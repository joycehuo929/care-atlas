"""Read the Care Atlas directory from the team's Unity Catalog Gold tables."""

import json
import math
import os
from urllib.parse import urlsplit

from databricks import sql
from databricks.sdk.core import Config


def _connect():
    warehouse = os.environ.get("DATABRICKS_WAREHOUSE_ID", "").strip()
    if not warehouse:
        raise RuntimeError("Configure the app's SQL warehouse resource to read the Gold catalog.")
    config = Config()
    host = urlsplit(config.host if "://" in config.host else "//" + config.host).netloc
    return sql.connect(
        server_hostname=host,
        http_path=f"/sql/1.0/warehouses/{warehouse}",
        credentials_provider=lambda: config.authenticate,
    )


def _rows(connection, statement, parameters=None):
    with connection.cursor() as cursor:
        cursor.execute(statement, parameters)
        while batch := cursor.fetchmany(1000):
            for row in batch:
                yield row.asDict()


def load_services():
    """Load the service selector, keeping the catalog key separate from the label."""
    with _connect() as connection:
        return list(_rows(connection, """
            SELECT service AS id, service_label AS label, service_source,
                   n_facilities, n_verified, n_likely, n_claimed_only AS n_claimed
            FROM workspace.default.gold_services
            ORDER BY lower(service_label), service_label, service
        """))


def load_coverage():
    with _connect() as connection:
        return next(_rows(connection, """
            SELECT count(DISTINCT unique_id) AS facilities
            FROM workspace.default.gold_facility_services
        """))


_CLAIM_COLUMNS = """
    sha2(to_json(named_struct('facility', f.unique_id, 'service', f.service)), 256) AS id,
    f.unique_id AS record, f.service AS service_id, f.service_label AS service,
    f.name, f.facility_type, f.address, f.city, f.state, f.pincode AS pin,
    f.n_beds, f.n_doctors, f.official_phone, f.official_website,
    f.loc_lat AS lat, f.loc_lon AS lon, f.loc_source, f.trust_level, f.trust_score,
    to_json(f.evidence) AS evidence_json, to_json(f.problems) AS problems_json,
    f.explanation, f.flag_location_uncertain
"""


def _read_claims(statement, parameters):
    with _connect() as connection:
        records = []
        for row in _rows(connection, statement, parameters):
            for field in ("evidence", "problems"):
                value = row.pop(field + "_json")
                row[field] = json.loads(value) if value is not None else None
            for field in ("lat", "lon", "n_beds", "n_doctors"):
                value = row[field]
                if value is not None and not math.isfinite(value):
                    row[field] = None
            records.append(row)
        return records


def load_facilities(service_id):
    """Read all facility claims for exactly one catalog service without recomputing scores."""
    return _read_claims(f"""
        SELECT {_CLAIM_COLUMNS}
        FROM workspace.default.gold_facility_services f
        WHERE f.service = :service_id
        ORDER BY f.trust_score DESC NULLS LAST, lower(f.name), f.unique_id
    """, {"service_id": service_id})


def load_hospital_services(record):
    return _read_claims(f"""
        SELECT {_CLAIM_COLUMNS}, s.service_source
        FROM workspace.default.gold_facility_services f
        LEFT JOIN workspace.default.gold_services s ON f.service = s.service
        WHERE f.unique_id = :record
        ORDER BY lower(f.service_label), f.service_label, f.service
    """, {"record": record})


def search_hospitals(query, limit=24, offset=0):
    """Search institution names across every service, paging by stable facility ID."""
    limit = max(1, min(int(limit), 100))
    offset = max(0, int(offset))
    statement = f"""
        WITH hospitals AS (
            SELECT unique_id AS record, min(name) AS name, min(city) AS city,
                   min(state) AS state, count(DISTINCT service) AS service_count
            FROM workspace.default.gold_facility_services
            GROUP BY unique_id
        ), matches AS (
            SELECT * FROM hospitals
            WHERE :query = '' OR instr(lower(name), lower(:query)) > 0
        ), page AS (
            SELECT * FROM matches
            ORDER BY lower(name) NULLS LAST, name NULLS LAST, record
            LIMIT {limit} OFFSET {offset}
        )
        SELECT page.record, page.name, page.city, page.state, page.service_count, totals.total
        FROM (SELECT count(*) AS total FROM matches) totals
        LEFT JOIN page ON TRUE
        ORDER BY lower(page.name) NULLS LAST, page.name NULLS LAST, page.record
    """
    with _connect() as connection:
        rows = list(_rows(connection, statement, {"query": query.strip()}))
    # The count row is also returned for empty and out-of-range pages.
    total = rows[0]["total"]
    items = []
    for row in rows:
        if row["service_count"] is not None:
            del row["total"]
            items.append(row)
    return {"items": items, "total": total, "offset": offset, "limit": limit}


def _location(row):
    point = None
    lat, lon = row["lat"], row["lon"]
    if lat is not None and lon is not None:
        if math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180:
            point = [lon, lat]
    name = row["place_name"] or row["place_key"] or ""
    state = row["state"] or ""
    return {
        "kind": (row["place_type"] or "location").lower(),
        "name": name,
        "label": ", ".join(part for part in (name, state) if part),
        "detail": (row["place_type"] or "").replace("_", " ").title(),
        "point": point,
        "state": state,
        "place_type": row["place_type"],
        "place_key": row["place_key"],
        "n_points": row["n_points"],
        "source": row["source"],
    }


def lookup_locations(query, limit=25, offset=0):
    """Search every Gold lookup row, including ambiguous names across states."""
    query = " ".join(str(query or "").lower().replace(",", " ").split())
    limit = max(1, min(int(limit), 100))
    offset = max(0, int(offset))
    statement = f"""
        WITH locations AS (
            SELECT place_name, state, lat, lon, n_points, place_type, source, place_key,
                   lower(concat_ws(' ', place_name, state, place_key)) AS search_text,
                   :query AS needle
            FROM workspace.default.gold_location_lookup
        )
        SELECT place_name, state, lat, lon, n_points, place_type, source, place_key
        FROM locations
        WHERE forall(split(needle, ' '), word -> contains(search_text, word))
        ORDER BY CASE WHEN lower(place_name) = needle OR lower(place_key) = needle
                           OR lower(concat_ws(' ', place_name, state)) = needle THEN 0
                      WHEN startswith(lower(place_name), needle) THEN 1 ELSE 2 END,
                 lower(place_name), place_name, state, place_type, place_key, source, lat, lon, n_points
        LIMIT {limit} OFFSET {offset}
    """
    with _connect() as connection:
        return [_location(row) for row in _rows(connection, statement, {"query": query})]

# Care Atlas web app

Care Atlas helps people find a healthcare service, see the evidence behind a facility’s listing, and get directions. The finder is at `/` and the facility directory is at `/hospitals`. Both support English and Hindi.

## Run on Databricks

1. Set the Databricks App’s source directory to this `app/` folder. The entry point is `python app.py`. FastAPI serves the HTML, JavaScript, CSS and map assets. The frontend requires no build step.
2. Attach a SQL warehouse as an app resource named `sql-warehouse` and grant the app identity **Can use** on it. `app.yaml` reads the resource ID into `DATABRICKS_WAREHOUSE_ID`.
3. Grant that identity **USE CATALOG** on `workspace`, **USE SCHEMA** on `workspace.default`, and **SELECT** on these tables.

   | Table | Used for |
   | --- | --- |
   | `workspace.default.gold_facility_services` | Facility details, service evidence, trust scores and coordinates |
   | `workspace.default.gold_services` | Service names and counts by evidence level |
   | `workspace.default.gold_location_lookup` | Starting places and PIN-code coordinates |

4. Deploy the app and open its URL. The backend reads the existing Gold tables. A new deployment needs no scoring notebook run or data import.

## Run locally

From this directory, with a Databricks identity configured for the workspace and access to the same warehouse and tables, run the following commands. Replace `<warehouse-id>` with your SQL warehouse ID.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DATABRICKS_WAREHOUSE_ID='<warehouse-id>'
python app.py
```

Open [the local finder](http://localhost:8000/). Facility searches require a working Databricks connection.

## Map assets

The bundled street map uses OpenStreetMap data via OpenFreeMap and OpenMapTiles. Source credits are in `map-basemap.json`. [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/)

The bundled satellite image is a contrast-enhanced EOxCloudless image by EOX IT Services GmbH containing modified Copernicus Sentinel data from 2025. Its source and attribution are in `map-satellite.json`. [EOxCloudless](https://cloudless.eox.at/) · [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

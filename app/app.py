"""Serve Care Atlas and its read-only Gold directory through the same app origin."""
import json
import logging
import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response

from gold_data import load_coverage, load_facilities, load_hospital_services, load_services, lookup_locations, search_hospitals


assets = Path(__file__).resolve().parent
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(GZipMiddleware, minimum_size=1500)
logger = logging.getLogger("uvicorn.error")

html = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Care Atlas · Find a facility</title>
<link rel="icon" type="image/svg+xml" sizes="any" href="/assets/care-route.svg">
<style>:root{--shell-paper:#f8fafb;--shell-ink:#202832;--shell-font:Inter,system-ui,sans-serif}
html,body{margin:0;min-height:100%;overflow-x:clip;background:var(--shell-paper);color:var(--shell-ink);font-family:var(--shell-font)}
#load{margin:2rem}#load button{font:inherit;cursor:pointer}</style>
</head><body><main id="care-atlas"></main><div id="load" role="status">
<span>Loading the facility directory…</span> <button hidden>Retry</button></div>
<template id="ui"><link rel="stylesheet" href="/assets/finder.css">
""" + (assets / "ui.html").read_text() + """
</template><script type="module" src="/assets/start.js"></script></body></html>"""

javascript = "\n".join((assets / name).read_text() for name in (
    "satellite-detail.js", "map-address.js", "map.js", "ui.js"
))
css = "\n".join((assets / name).read_text() for name in ("ui.css", "map.css"))
satellite = json.loads((assets / "map-satellite.json").read_text())
satellite.update(image="/assets/map-satellite.jpg",
                 maptilerPublicKey=os.getenv("MAPTILER_PUBLIC_KEY", "").strip())

@app.get("/", response_class=HTMLResponse)
def index():
    return HTMLResponse(html, headers={"Cache-Control": "no-cache"})

@app.get("/hospitals", response_class=HTMLResponse)
def hospital_directory():
    return FileResponse(assets / "directory.html", media_type="text/html", headers={"Cache-Control": "no-cache"})

@app.get("/assets/finder.js")
def finder_js():
    return Response(javascript, media_type="text/javascript", headers={"Cache-Control": "no-cache"})

@app.get("/assets/finder.css")
def finder_css():
    return Response(css, media_type="text/css", headers={"Cache-Control": "no-cache"})

@app.get("/assets/map-config.json")
def configuration():
    return {"satellite": satellite}

@app.get("/assets/{filename}")
def static_file(filename: str):
    if filename not in {"start.js", "locale.js", "service-picker.js", "service-hindi.js", "places-hindi.js",
                        "evidence-hindi.js", "map-basemap.json", "map-satellite.jpg", "directory.js", "directory.css",
                        "care-route.svg"}:
        raise HTTPException(status_code=404)
    return FileResponse(assets / filename, headers={"Cache-Control": "no-cache"})

def gold_response(reader, *args):
    try:
        result = reader(*args)
    except Exception:
        logger.exception("Gold read failed in %s", reader.__name__)
        raise HTTPException(status_code=503, detail="The Gold directory is temporarily unavailable.")
    return JSONResponse(result, headers={"Cache-Control": "no-store"})

@app.get("/api/services")
def services():
    return gold_response(load_services)

@app.get("/api/coverage")
def coverage():
    return gold_response(load_coverage)

@app.get("/api/facilities")
def facilities(service: str = Query(min_length=1, max_length=512)):
    return gold_response(load_facilities, service)

@app.get("/api/hospitals")
def hospitals(q: str = Query(default="", max_length=512),
              offset: int = Query(default=0, ge=0), limit: int = Query(default=24, ge=1, le=100)):
    return gold_response(search_hospitals, q, limit, offset)

@app.get("/api/hospitals/{record}/services")
def hospital_services(record: str):
    return gold_response(load_hospital_services, record)

@app.get("/api/locations")
def locations(q: str = Query(default="", max_length=512),
              offset: int = Query(default=0, ge=0), limit: int = Query(default=25, ge=1, le=100)):
    return gold_response(lookup_locations, q, limit, offset)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("DATABRICKS_APP_PORT", "8000")))

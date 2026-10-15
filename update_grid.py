import json
from google.cloud import bigquery
import os

client = bigquery.Client()
BUCKET = "semai-data-hrs"

print("Re-exporting calibrated grid.geojson...")
sql = "SELECT * EXCEPT(geom), ST_ASGEOJSON(geom) AS geojson FROM `semai.grid`"
query_job = client.query(sql)
rows = list(query_job.result())

features = []
for r in rows:
    props = {k: v for k, v in r.items() if k != 'geojson'}
    geom = json.loads(r['geojson']) if r['geojson'] else None
    if geom:
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": props
        })

with open("grid.geojson", "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": features}, f)

print(f"grid.geojson re-exported! Uploading to gs://{BUCKET}/data/...")
os.system(f"gcloud storage cp grid.geojson gs://{BUCKET}/data/")
print("Done!")

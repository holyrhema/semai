import json
from google.cloud import bigquery

client = bigquery.Client()

tables = [
    {
        "name": "gathering.geojson",
        "sql": "SELECT id, name, cat, weight, ST_ASGEOJSON(geom) AS geojson FROM `semai.gathering`"
    },
    {
        "name": "roads.geojson",
        "sql": "SELECT id, class, is_main, ST_ASGEOJSON(geom) AS geojson FROM `semai.roads`"
    },
    {
        "name": "demand_points.geojson",
        "sql": "SELECT name, type, weight, ST_ASGEOJSON(geom) AS geojson FROM `semai.demand_points`"
    },
    {
        "name": "desa.geojson",
        "sql": "SELECT desa, ST_ASGEOJSON(geom) AS geojson FROM `semai.desa`"
    }
]

for t in tables:
    print(f"Mengekspor {t['name']}...")
    query_job = client.query(t['sql'])
    rows = list(query_job.result())
    
    features = []
    for row in rows:
        properties = {k: v for k, v in row.items() if k != 'geojson'}
        geometry = json.loads(row['geojson']) if row['geojson'] else None
        if geometry:
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            })
            
    geojson_obj = {
        "type": "FeatureCollection",
        "features": features
    }
    
    with open(t['name'], 'w', encoding='utf-8') as f:
        json.dump(geojson_obj, f, ensure_ascii=False)
        
    print(f"Selesai: {t['name']} ({len(features)} baris)")

print("\nSemua file GeoJSON berhasil dibuat!")

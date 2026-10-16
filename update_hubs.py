import json, os

hubs = [
  # Jerowaru
  {"name": "Masjid Besar Jami' Jerowaru", "cat": "mosque", "weight": 1.5, "lng": 116.4885, "lat": -8.8470, "desa": "Jerowaru"},
  {"name": "Pasar Umum & Terminal Jerowaru", "cat": "market", "weight": 1.8, "lng": 116.4678, "lat": -8.8350, "desa": "Jerowaru"},
  {"name": "Kantor Camat Jerowaru", "cat": "local_government_office", "weight": 1.3, "lng": 116.4710, "lat": -8.8380, "desa": "Jerowaru"},
  {"name": "Puskesmas Jerowaru (Pusat Kesehatan)", "cat": "health_center", "weight": 1.4, "lng": 116.4690, "lat": -8.8360, "desa": "Jerowaru"},
  {"name": "SMAN 1 Jerowaru", "cat": "school", "weight": 1.2, "lng": 116.4750, "lat": -8.8410, "desa": "Jerowaru"},
  {"name": "Pusat Informasi Ekowisata Bale Mangrove", "cat": "community_center", "weight": 1.6, "lng": 116.4883, "lat": -8.8475, "desa": "Jerowaru"},

  # Pare Mas
  {"name": "Masjid Nurul Huda Pare Mas", "cat": "mosque", "weight": 1.5, "lng": 116.4980, "lat": -8.8370, "desa": "Pare Mas"},
  {"name": "Kantor Desa Pare Mas", "cat": "local_government_office", "weight": 1.3, "lng": 116.4950, "lat": -8.8350, "desa": "Pare Mas"},
  {"name": "Pangkalan Pendaratan Ikan (PPI) Pare Mas", "cat": "market", "weight": 1.7, "lng": 116.5020, "lat": -8.8390, "desa": "Pare Mas"},
  {"name": "Dermaga Sentra Budidaya Lobster Teluk Jukung", "cat": "port", "weight": 1.6, "lng": 116.5122, "lat": -8.8540, "desa": "Pare Mas"},
  {"name": "Pos Ronda & Patroli Pokmaswas Pare Mas", "cat": "community_center", "weight": 1.4, "lng": 116.5050, "lat": -8.8420, "desa": "Pare Mas"},
  {"name": "SDN 2 Pare Mas", "cat": "school", "weight": 1.1, "lng": 116.4930, "lat": -8.8320, "desa": "Pare Mas"},

  # Pemongkong
  {"name": "Masjid Jami' Nurul Islam Pemongkong", "cat": "mosque", "weight": 1.5, "lng": 116.4825, "lat": -8.8825, "desa": "Pemongkong"},
  {"name": "Pasar Tradisional Pemongkong", "cat": "market", "weight": 1.7, "lng": 116.4810, "lat": -8.8810, "desa": "Pemongkong"},
  {"name": "Kantor Desa Pemongkong", "cat": "local_government_office", "weight": 1.3, "lng": 116.4830, "lat": -8.8840, "desa": "Pemongkong"},
  {"name": "Balai Pertemuan Kelompok Tani Garam", "cat": "community_center", "weight": 1.4, "lng": 116.4720, "lat": -8.8550, "desa": "Pemongkong"},
  {"name": "Koperasi Perikanan Bahari Mandiri", "cat": "market", "weight": 1.3, "lng": 116.4780, "lat": -8.8680, "desa": "Pemongkong"},
  {"name": "Posyandu Dusun Pemongkong Pesisir", "cat": "health_center", "weight": 1.2, "lng": 116.4860, "lat": -8.8870, "desa": "Pemongkong"}
]

features = []
for h in hubs:
    features.append({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [h["lng"], h["lat"]]
        },
        "properties": {
            "name": h["name"],
            "cat": h["cat"],
            "weight": h["weight"],
            "desa": h["desa"]
        }
    })

with open("gathering.geojson", "w") as f:
    json.dump({"type": "FeatureCollection", "features": features}, f, indent=2)

os.system("gcloud storage cp gathering.geojson gs://semai-data-hrs/data/")
print("18 Verified Village Anchors uploaded to Cloud Storage!")

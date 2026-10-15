import json
import random
from google.cloud import bigquery
import os

client = bigquery.Client()
BUCKET = "semai-data-hrs"

print("1. Mengekspor grid.geojson dari BigQuery...")
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
print(f"grid.geojson selesai ({len(features)} sel, {round(os.path.getsize('grid.geojson')/1024/1024, 2)} MB)")

# 2. Buat direktori packs & modules
os.makedirs("packs", exist_ok=True)
os.makedirs("modules", exist_ok=True)

print("2. Menulis Resource Packs (mangrove & seaweed)...")
packs_index = {
  "active_packs": ["mangrove", "seaweed"],
  "quadrant": {"opportunity_min": 0.6, "risk_min": 0.5, "risk_field": "p_loss_500m"}
}
with open("packs/index.json", "w") as f:
    json.dump(packs_index, f, indent=2)

mangrove_pack = {
  "pack_id": "mangrove",
  "name": "Mangrove",
  "version": "0.1",
  "resource_field": "mangrove_frac_2024",
  "products": [
    {
      "product_id": "madu_mangrove",
      "name": "Madu mangrove (kelulut)",
      "conservation_alignment": 1,
      "harvest_note": "Non-ekstraktif. Makin sehat mangrove, makin banyak nektar.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "mangrove_500m_ha", "transform": {"type": "linear", "min": 0, "max": 20}, "weight": 0.25, "group": "bahan_baku", "label": "Luas mangrove 500 m"},
        {"field": "seaward_500m_share", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "bahan_baku", "label": "Porsi zona api-api/pedada (berbunga)"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 10000}, "weight": 0.20, "group": "pasar", "label": "Dekat tujuan wisata"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "pasar", "label": "Keramaian (masjid, pasar, sekolah)"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Akses jalan"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 200}, "weight": 0.10, "group": "produksi", "label": "Permukiman (tenaga kerja)"},
        {"field": "p_loss_500m", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Mangrove sekitar stabil"}
      ],
      "exclude_if": [],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "kopi_mangrove",
      "name": "Kopi mangrove",
      "conservation_alignment": 0,
      "harvest_note": "Pakai propagul yang jatuh dan matang saja. Jangan ambil di zona restorasi.",
      "competition_radius_m": 3000,
      "factors": [
        {"field": "middle_1km_ha", "transform": {"type": "linear", "min": 0, "max": 30}, "weight": 0.25, "group": "bahan_baku", "label": "Luas zona bakau (Rhizophora) 1 km"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 15000}, "weight": 0.20, "group": "pasar", "label": "Dekat tujuan wisata"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "pasar", "label": "Keramaian"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.15, "group": "produksi", "label": "Permukiman"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Akses jalan"},
        {"field": "p_loss_1km", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Mangrove sekitar stabil"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "kemasan_pirt"]
    },
    {
      "product_id": "olahan_pangan",
      "name": "Olahan pangan mangrove (sirup/dodol pedada, tepung api-api)",
      "conservation_alignment": 0,
      "harvest_note": "Buah saja. Sisakan buah untuk regenerasi alami.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "seaward_1km_ha", "transform": {"type": "linear", "min": 0, "max": 30}, "weight": 0.25, "group": "bahan_baku", "label": "Luas zona api-api/pedada 1 km"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.20, "group": "pasar", "label": "Keramaian"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 5000}, "weight": 0.15, "group": "pasar", "label": "Dekat pasar"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.20, "group": "produksi", "label": "Permukiman (dapur produksi)"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "produksi", "label": "Akses jalan"},
        {"field": "p_loss_1km", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Mangrove sekitar stabil"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "ekowisata",
      "name": "Ekowisata mangrove",
      "conservation_alignment": 1,
      "harvest_note": "Patuhi daya dukung jalur dan perahu.",
      "competition_radius_m": 4000,
      "factors": [
        {"field": "mangrove_500m_ha", "transform": {"type": "linear", "min": 0, "max": 20}, "weight": 0.25, "group": "bahan_baku", "label": "Luas mangrove 500 m"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 500}, "weight": 0.10, "group": "produksi", "label": "Akses perahu"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Akses jalan"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.25, "group": "pasar", "label": "Dekat arus wisatawan"},
        {"field": "p_loss_500m", "transform": {"type": "invert"}, "weight": 0.20, "group": "risiko", "label": "Mangrove sekitar stabil"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.6},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "jualan_online", "kerja_sama_pembeli"]
    }
  ]
}
with open("packs/mangrove.json", "w") as f:
    json.dump(mangrove_pack, f, indent=2)

seaweed_pack = {
  "pack_id": "seaweed",
  "name": "Rumput laut (Gracilaria)",
  "version": "0.1",
  "resource_field": "pond_frac_2017",
  "products": [
    {
      "product_id": "gracilaria_kering",
      "name": "Gracilaria kering (bahan agar)",
      "conservation_alignment": 1,
      "harvest_note": "Hanya di tambak yang sudah ada sejak 2017. Tidak boleh membuka mangrove.",
      "competition_radius_m": 1000,
      "factors": [
        {"field": "pond_frac_2017", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.35, "group": "bahan_baku", "label": "Tambak yang sudah ada"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.15, "group": "produksi", "label": "Pasokan air payau"},
        {"field": "dist_mangrove_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "bahan_baku", "label": "Dekat mangrove (kualitas air)"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Akses jalan"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 200}, "weight": 0.10, "group": "produksi", "label": "Tenaga kerja"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.15, "group": "pasar", "label": "Dekat pengepul/pasar"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2017", "op": ">", "value": 0.2},
        {"field": "pond_frac_2017", "op": "<", "value": 0.2}
      ],
      "learning_modules": ["hpp", "kerja_sama_pembeli"]
    },
    {
      "product_id": "olahan_agar",
      "name": "Olahan rumput laut (jeli, dodol)",
      "conservation_alignment": 0,
      "harvest_note": "Bahan dari tambak yang sudah ada.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "pond_3km_ha", "transform": {"type": "linear", "min": 0, "max": 50}, "weight": 0.25, "group": "bahan_baku", "label": "Tambak dalam 3 km"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.20, "group": "produksi", "label": "Permukiman"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.20, "group": "pasar", "label": "Keramaian"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 15000}, "weight": 0.20, "group": "pasar", "label": "Dekat tujuan wisata"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.15, "group": "produksi", "label": "Akses jalan"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5}
      ],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "polikultur_bandeng",
      "name": "Polikultur Gracilaria + bandeng",
      "conservation_alignment": 1,
      "harvest_note": "Hanya di tambak yang sudah ada sejak 2017.",
      "competition_radius_m": 1000,
      "factors": [
        {"field": "pond_frac_2017", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.40, "group": "bahan_baku", "label": "Tambak yang sudah ada"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Pasokan air payau"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Akses jalan"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.15, "group": "pasar", "label": "Dekat pasar ikan"},
        {"field": "dist_mangrove_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "bahan_baku", "label": "Dekat mangrove (kualitas air)"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2017", "op": ">", "value": 0.2},
        {"field": "pond_frac_2017", "op": "<", "value": 0.2}
      ],
      "learning_modules": ["hpp", "pisah_uang"]
    }
  ]
}
with open("packs/seaweed.json", "w") as f:
    json.dump(seaweed_pack, f, indent=2)

print("3. Menulis Graf Ekosistem (nodes & edges)...")
nodes = [
  {"id": "R_mangrove", "type": "resource", "name": "Hutan mangrove Teluk Jor", "desa": "Jerowaru", "lat": -8.8475, "lng": 116.4883, "source": "publik"},
  {"id": "R_teluk", "type": "resource", "name": "Perairan teluk & kualitas air", "desa": "Jerowaru", "lat": -8.8600, "lng": 116.5000, "source": "publik"},
  {"id": "R_tambak", "type": "resource", "name": "Tambak (ikan/udang/garam)", "desa": "Pemongkong", "lat": -8.8400, "lng": 116.4750, "source": "publik"},
  {"id": "R_gracilaria", "type": "resource", "name": "Rumput laut Gracilaria", "desa": "Pare Mas", "lat": -8.8350, "lng": 116.4950, "source": "literatur"},
  {"id": "B_ekowisata", "type": "business", "name": "Ekowisata Bale Mangrove", "desa": "Jerowaru", "lat": -8.8475, "lng": 116.4883, "source": "publik"},
  {"id": "B_lobster", "type": "business", "name": "Keramba lobster Teluk Jukung", "desa": "Pare Mas", "lat": -8.8540, "lng": 116.5122, "source": "publik"},
  {"id": "B_nelayan", "type": "business", "name": "Nelayan tangkap pesisir", "desa": "Pemongkong", "lat": -8.8650, "lng": 116.4900, "source": "publik"},
  {"id": "B_terasi", "type": "business", "name": "Produksi terasi udang rebon", "desa": "Jerowaru", "lat": -8.8380, "lng": 116.4720, "source": "publik"},
  {"id": "B_garam", "type": "business", "name": "Tambak garam rakyat", "desa": "Pemongkong", "lat": -8.8420, "lng": 116.4680, "source": "publik"},
  {"id": "B_kopi", "type": "business", "name": "Kopi mangrove", "desa": "Jerowaru", "lat": -8.8460, "lng": 116.4870, "source": "publik"},
  {"id": "B_madu", "type": "business", "name": "Madu mangrove (kelulut)", "desa": "Jerowaru", "lat": -8.8480, "lng": 116.4890, "source": "literatur"},
  {"id": "B_pangan", "type": "business", "name": "Olahan sirup/dodol pedada", "desa": "Pare Mas", "lat": -8.8340, "lng": 116.4920, "source": "literatur"},
  {"id": "B_rl_kering", "type": "business", "name": "Gracilaria kering", "desa": "Pare Mas", "lat": -8.8360, "lng": 116.4970, "source": "literatur"},
  {"id": "B_rl_olahan", "type": "business", "name": "Olahan agar & dodol rumput laut", "desa": "Pare Mas", "lat": -8.8350, "lng": 116.4910, "source": "literatur"},
  {"id": "B_homestay", "type": "business", "name": "Homestay & penginapan warga", "desa": "Jerowaru", "lat": -8.8450, "lng": 116.4860, "source": "publik"},
  {"id": "B_kuliner", "type": "business", "name": "Kuliner & lesehan apung", "desa": "Jerowaru", "lat": -8.8470, "lng": 116.4895, "source": "publik"},
  {"id": "B_kerajinan", "type": "business", "name": "Kerajinan miniatur sampan", "desa": "Pemongkong", "lat": -8.8800, "lng": 116.4810, "source": "publik"},
  {"id": "M_domestik", "type": "market", "name": "Wisatawan domestik", "desa": "Jerowaru", "lat": -8.8475, "lng": 116.4883, "source": "publik"},
  {"id": "M_mancanegara", "type": "market", "name": "Wisatawan mancanegara", "desa": "Jerowaru", "lat": -8.8475, "lng": 116.4883, "source": "publik"},
  {"id": "M_pengepul", "type": "market", "name": "Pengepul ikan & rumput laut", "desa": "Pemongkong", "lat": -8.7960, "lng": 116.5140, "source": "literatur"},
  {"id": "M_restoran", "type": "market", "name": "Restoran Mandalika/Mataram", "desa": "Jerowaru", "lat": -8.8924, "lng": 116.2829, "source": "literatur"},
  {"id": "I_pokdarwis", "type": "institution", "name": "Pokdarwis Bale Mangrove", "desa": "Jerowaru", "lat": -8.8475, "lng": 116.4883, "source": "publik"},
  {"id": "I_pokmaswas", "type": "institution", "name": "Pokmaswas Pengawas Pesisir", "desa": "Pare Mas", "lat": -8.8400, "lng": 116.5000, "source": "literatur"},
  {"id": "I_kwt", "type": "institution", "name": "Kelompok Wanita Tani (KWT)", "desa": "Jerowaru", "lat": -8.8430, "lng": 116.4850, "source": "literatur"},
  {"id": "I_awik", "type": "institution", "name": "Awik-awik (Aturan Adat)", "desa": "Jerowaru", "lat": -8.8450, "lng": 116.4800, "source": "literatur"}
]
with open("graph_nodes.json", "w") as f:
    json.dump(nodes, f, indent=2)

edges = [
  {"from": "R_mangrove", "to": "B_ekowisata", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Mangrove daya tarik utama"},
  {"from": "R_mangrove", "to": "R_teluk", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Menjaga kualitas air"},
  {"from": "R_mangrove", "to": "B_nelayan", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Daerah asuhan ikan"},
  {"from": "R_mangrove", "to": "B_madu", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Nektar bunga mangrove"},
  {"from": "R_mangrove", "to": "B_kopi", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Propagul bakau matang"},
  {"from": "R_mangrove", "to": "B_pangan", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Buah pedada & api-api"},
  {"from": "R_tambak", "to": "R_mangrove", "type": "tradeoff", "sign": -1, "strength": "kuat", "evidence": "literatur", "note": "Ekspansi tambak menebang mangrove"},
  {"from": "R_tambak", "to": "B_garam", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Lahan tambak garam"},
  {"from": "R_tambak", "to": "R_gracilaria", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Media budidaya rumput laut"},
  {"from": "R_gracilaria", "to": "B_rl_kering", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Bahan baku langsung"},
  {"from": "R_gracilaria", "to": "B_rl_olahan", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Bahan olahan agar"},
  {"from": "R_teluk", "to": "B_lobster", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Kualitas air menentukan keramba"},
  {"from": "R_teluk", "to": "B_nelayan", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Stok cumi & kepiting"},
  {"from": "B_nelayan", "to": "B_terasi", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Pasokan udang rebon"},
  {"from": "M_domestik", "to": "B_ekowisata", "type": "market", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Pengunjung utama"},
  {"from": "B_ekowisata", "to": "B_homestay", "type": "market", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Wisatawan menginap"},
  {"from": "B_ekowisata", "to": "B_kuliner", "type": "market", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Konsumsi pengunjung"},
  {"from": "B_ekowisata", "to": "B_kopi", "type": "market", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Oleh-oleh kopi"},
  {"from": "B_ekowisata", "to": "B_madu", "type": "market", "sign": 1, "strength": "sedang", "evidence": "hipotesis", "note": "Oleh-oleh madu"},
  {"from": "B_ekowisata", "to": "B_pangan", "type": "market", "sign": 1, "strength": "sedang", "evidence": "hipotesis", "note": "Oleh-oleh dodol pedada"},
  {"from": "B_ekowisata", "to": "B_rl_olahan", "type": "market", "sign": 1, "strength": "sedang", "evidence": "hipotesis", "note": "Oleh-oleh jeli agar"},
  {"from": "B_lobster", "to": "M_restoran", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Pasokan lobster hotel"},
  {"from": "I_awik", "to": "R_mangrove", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "literatur", "note": "Larangan adat tebang liar"},
  {"from": "I_pokmaswas", "to": "R_mangrove", "type": "supports", "sign": 1, "strength": "sedang", "evidence": "literatur", "note": "Patroli pesisir"},
  {"from": "I_pokdarwis", "to": "B_ekowisata", "type": "supports", "sign": 1, "strength": "kuat", "evidence": "publik", "note": "Manajemen ekowisata"}
]
with open("graph_edges.json", "w") as f:
    json.dump(edges, f, indent=2)

print("4. Membuat 40 UMKM Simulasi (umkm.json)...")
random.seed(42)
first = ['Bakau', 'Pesisir', 'Teluk', 'Lestari', 'Bahari', 'Sasak', 'Pelangi', 'Mutiara', 'Barokah', 'Samudra']
second = ['Jaya', 'Makmur', 'Sejahtera', 'Berkah', 'Mandiri', 'Bersama', 'Sentosa', 'Abadi']
desas = ['Jerowaru', 'Pare Mas', 'Pemongkong']
coords_center = {
    'Jerowaru': (-8.845, 116.485),
    'Pare Mas': (-8.835, 116.495),
    'Pemongkong': (-8.865, 116.475)
}
prods_m = ['madu_mangrove', 'kopi_mangrove', 'olahan_pangan', 'ekowisata']
prods_s = ['gracilaria_kering', 'olahan_agar', 'polikultur_bandeng']

umkm_list = []
for i in range(1, 41):
    d = random.choice(desas)
    lat_c, lng_c = coords_center[d]
    pack = random.choice(['mangrove', 'seaweed'])
    prod = random.choice(prods_m if pack == 'mangrove' else prods_s)
    umkm_list.append({
        "umkm_id": f"u_{i:03d}",
        "name": f"UMKM {random.choice(first)} {random.choice(second)}",
        "pack_id": pack,
        "product_id": prod,
        "desa": d,
        "lat": round(lat_c + random.uniform(-0.012, 0.012), 6),
        "lng": round(lng_c + random.uniform(-0.012, 0.012), 6),
        "status": random.choice(["aktif", "rintisan"]),
        "members_n": random.randint(2, 10),
        "monthly_revenue_idr": random.choice([750000, 1500000, 3000000, 5500000]),
        "channels": random.sample(["langsung", "wisatawan", "online", "pengepul"], 2),
        "simulated": True
    })
with open("umkm.json", "w") as f:
    json.dump(umkm_list, f, indent=2)

print("5. Menulis Modul Edukasi Bisnis (modules/)...")
hpp_md = """---
id: hpp
title: Hitung HPP & Harga Jual
duration_min: 10
products: [semua]
---
## 1. Apa itu HPP?
HPP (Harga Pokok Produksi) adalah total seluruh biaya yang dikeluarkan untuk membuat satu produk. Mengetahui HPP mencegah usaha rugi meskipun barang laku keras.

## 2. Catat Biaya Produksi (Per Batch)
- **Bahan Baku**: Buah pedada/api-api, gula, air, jahe, dsb.
- **Tenaga Kerja**: Upah produksi per batch, termasuk menghargai keringat Anda sendiri.
- **Biaya Operasional**: Gas elpiji, listrik, air galon, transport jemput bahan.
- **Kemasan Unit**: Botol kaca/plastik, label stiker, tutup, kardus.

## 3. Rumus Standar
$$HPP = \\frac{Bahan + Tenaga + Operasional}{Jumlah Unit Batch} + Kemasan$$
$$Harga Jual = HPP \\times (1 + Margin)$$

## 4. Contoh Nyata: Sirup Pedada Teluk Jor
- Bahan Baku: Rp60.000
- Tenaga Kerja: Rp50.000
- Biaya Lain: Rp15.000
- Hasil Panen: 20 botol
- Kemasan per botol: Rp3.500
- **HPP** = (Rp125.000 ÷ 20) + Rp3.500 = **Rp9.750 / botol**.
- Jika margin laba 40%: Rp9.750 × 1,4 = **Rp13.650** (dibulatkan menjadi Rp14.000).

## 5. Uji Pasar
Bandingkan dengan harga pasar di Desa Wisata Jerowaru (misal kopi mangrove Rp20.000). Jika HPP Anda jauh lebih rendah, jangan jual terlalu murah; gunakan selisihnya untuk mempercantik kemasan!
"""
with open("modules/hpp.md", "w") as f:
    f.write(hpp_md)

summaries = {
    "pisah_uang.md": ("Pisahkan Keuangan Usaha dan Dompet Dapur", "Langkah sederhana memisahkan kas pribadi dan kas bisnis agar modal tidak tergerus kebutuhan rumah tangga."),
    "kemasan_pirt.md": ("Standar Kemasan & Izin Edar P-IRT", "Panduan memilih botol/pouch kedap udara, informasi wajib pada label, dan cara mengurus izin P-IRT di Dinas Kesehatan Lombok Timur."),
    "jualan_online.md": ("Mulai Jualan Lewat WhatsApp Business & Medsos", "Foto produk yang menarik menggunakan HP, menyusun katalog WA Business, dan menjangkau pembeli di luar desa."),
    "kerja_sama_pembeli.md": ("Menembus Pasar Oleh-Oleh & Pengepul", "Tips membuat kesepakatan konsinyasi dengan toko oleh-oleh wisata Mandalika dan menjaga kualitas pasokan rutin bagi pengepul.")
}

for fname, (title, desc) in summaries.items():
    content = f"""---
id: {fname.replace('.md','')}
title: {title}
duration_min: 5
products: [semua]
---
## Pengantar
{desc}

*Modul lengkap akan segera hadir pada pembaruan berikutnya.*
"""
    with open(f"modules/{fname}", "w") as f:
        f.write(content)

print("\n6. Mengunggah semua data ke Cloud Storage...")
os.system(f"gcloud storage cp grid.geojson umkm.json graph_nodes.json graph_edges.json gs://{BUCKET}/data/")
os.system(f"gcloud storage cp -r packs modules gs://{BUCKET}/data/")

print("\nSELESAI! Semua data statis Phase 3 berhasil dibuat dan diunggah.")

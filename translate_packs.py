import json, os

BUCKET = "semai-data-hrs"

# 1. English Mangrove Pack
mangrove_pack = {
  "pack_id": "mangrove",
  "name": "Mangrove Forest",
  "version": "0.1",
  "resource_field": "mangrove_frac_2024",
  "products": [
    {
      "product_id": "madu_mangrove",
      "name": "Mangrove Honey (Stingless Bee / Kelulut)",
      "conservation_alignment": 1,
      "harvest_note": "Non-extractive. Healthier mangroves produce more floral nectar.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "mangrove_500m_ha", "transform": {"type": "linear", "min": 0, "max": 20}, "weight": 0.25, "group": "bahan_baku", "label": "Mangrove Area (500m)"},
        {"field": "seaward_500m_share", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "bahan_baku", "label": "Flowering Api-Api / Pedada Zone"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 10000}, "weight": 0.20, "group": "pasar", "label": "Proximity to Tourism"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "pasar", "label": "Footfall Density (Hubs)"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Road Access"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 200}, "weight": 0.10, "group": "produksi", "label": "Labor Availability (1km)"},
        {"field": "p_loss_500m", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Surrounding Forest Stability"}
      ],
      "exclude_if": [],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "kopi_mangrove",
      "name": "Mangrove Propagule Coffee",
      "conservation_alignment": 0,
      "harvest_note": "Use naturally fallen, ripe Rhizophora propagules only. Never harvest in restoration zones.",
      "competition_radius_m": 3000,
      "factors": [
        {"field": "middle_1km_ha", "transform": {"type": "linear", "min": 0, "max": 30}, "weight": 0.25, "group": "bahan_baku", "label": "Rhizophora Bakau Zone (1km)"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 15000}, "weight": 0.20, "group": "pasar", "label": "Proximity to Tourist Flow"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.10, "group": "pasar", "label": "Local Market Footfall"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.15, "group": "produksi", "label": "Processing Labor"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Logistics & Road Access"},
        {"field": "p_loss_1km", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Surrounding Forest Stability"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "kemasan_pirt"]
    },
    {
      "product_id": "olahan_pangan",
      "name": "Mangrove Fruit Food Products (Pedada Syrup & Pastry)",
      "conservation_alignment": 0,
      "harvest_note": "Harvest ripe fruits only. Leave sufficient fruit for natural regeneration.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "seaward_1km_ha", "transform": {"type": "linear", "min": 0, "max": 30}, "weight": 0.25, "group": "bahan_baku", "label": "Pedada / Api-api Zone (1km)"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.20, "group": "pasar", "label": "Local Center Footfall"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 5000}, "weight": 0.15, "group": "pasar", "label": "Proximity to Public Markets"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.20, "group": "produksi", "label": "Kitchen & Labor Availability"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "produksi", "label": "Road Access"},
        {"field": "p_loss_1km", "transform": {"type": "invert"}, "weight": 0.10, "group": "risiko", "label": "Surrounding Forest Stability"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "ekowisata",
      "name": "Community Mangrove Ecotourism",
      "conservation_alignment": 1,
      "harvest_note": "Zero-harvest. Strictly observe boardwalk and boat capacity limits.",
      "competition_radius_m": 4000,
      "factors": [
        {"field": "mangrove_500m_ha", "transform": {"type": "linear", "min": 0, "max": 20}, "weight": 0.25, "group": "bahan_baku", "label": "Mangrove Forest Canopy (500m)"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 500}, "weight": 0.10, "group": "produksi", "label": "Boat / Waterfront Access"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Visitor Road Access"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.25, "group": "pasar", "label": "Proximity to Tourist Flow"},
        {"field": "p_loss_500m", "transform": {"type": "invert"}, "weight": 0.20, "group": "risiko", "label": "Canopy Integrity"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.6},
        {"field": "p_gain", "op": ">", "value": 0.6}
      ],
      "learning_modules": ["hpp", "jualan_online", "kerja_sama_pembeli"]
    }
  ]
}

# 2. English Seaweed Pack
seaweed_pack = {
  "pack_id": "seaweed",
  "name": "Seaweed (Gracilaria)",
  "version": "0.1",
  "resource_field": "pond_frac_2017",
  "products": [
    {
      "product_id": "gracilaria_kering",
      "name": "Dried Gracilaria (Raw Agar Material)",
      "conservation_alignment": 1,
      "harvest_note": "Cultivated only in ponds existing prior to 2017. Strictly forbidden to clear mangroves.",
      "competition_radius_m": 1000,
      "factors": [
        {"field": "pond_frac_2017", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.35, "group": "bahan_baku", "label": "Pre-existing Pond Area"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.15, "group": "produksi", "label": "Brackish Water Intake"},
        {"field": "dist_mangrove_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "bahan_baku", "label": "Mangrove Proximity (Water Filtration)"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Transport Road Access"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 200}, "weight": 0.10, "group": "produksi", "label": "Local Labor Availability"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.15, "group": "pasar", "label": "Proximity to Buyer / Port"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2017", "op": ">", "value": 0.2},
        {"field": "pond_frac_2017", "op": "<", "value": 0.2}
      ],
      "learning_modules": ["hpp", "kerja_sama_pembeli"]
    },
    {
      "product_id": "olahan_agar",
      "name": "Value-Added Agar (Jelly & Seaweed Confectionery)",
      "conservation_alignment": 0,
      "harvest_note": "Procure seaweed raw materials from certified existing aquaculture ponds.",
      "competition_radius_m": 2000,
      "factors": [
        {"field": "pond_3km_ha", "transform": {"type": "linear", "min": 0, "max": 50}, "weight": 0.25, "group": "bahan_baku", "label": "Pond Supply within 3km"},
        {"field": "buildings_1km", "transform": {"type": "linear", "min": 0, "max": 300}, "weight": 0.20, "group": "produksi", "label": "Kitchen & Labor Availability"},
        {"field": "footfall_idx", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.20, "group": "pasar", "label": "Footfall Density"},
        {"field": "dist_tourism_m", "transform": {"type": "decay", "max": 15000}, "weight": 0.20, "group": "pasar", "label": "Proximity to Tourist Outlets"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.15, "group": "produksi", "label": "Road Access"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2024", "op": ">", "value": 0.5}
      ],
      "learning_modules": ["hpp", "kemasan_pirt", "jualan_online"]
    },
    {
      "product_id": "polikultur_bandeng",
      "name": "Polyculture (Gracilaria + Milkfish)",
      "conservation_alignment": 1,
      "harvest_note": "Cultivated only in verified existing ponds.",
      "competition_radius_m": 1000,
      "factors": [
        {"field": "pond_frac_2017", "transform": {"type": "linear", "min": 0, "max": 1}, "weight": 0.40, "group": "bahan_baku", "label": "Pre-existing Pond Basin"},
        {"field": "dist_coast_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.20, "group": "produksi", "label": "Brackish Water Flow"},
        {"field": "dist_road_m", "transform": {"type": "decay", "max": 1500}, "weight": 0.15, "group": "produksi", "label": "Road Access"},
        {"field": "dist_market_m", "transform": {"type": "decay", "max": 20000}, "weight": 0.15, "group": "pasar", "label": "Proximity to Fish Market"},
        {"field": "dist_mangrove_m", "transform": {"type": "decay", "max": 1000}, "weight": 0.10, "group": "bahan_baku", "label": "Mangrove Water Quality Proximity"}
      ],
      "exclude_if": [
        {"field": "mangrove_frac_2017", "op": ">", "value": 0.2},
        {"field": "pond_frac_2017", "op": "<", "value": 0.2}
      ],
      "learning_modules": ["hpp", "pisah_uang"]
    }
  ]
}

os.makedirs("packs", exist_ok=True)
with open("packs/mangrove.json", "w") as f:
    json.dump(mangrove_pack, f, indent=2)

with open("packs/seaweed.json", "w") as f:
    json.dump(seaweed_pack, f, indent=2)

os.system(f"gcloud storage cp packs/*.json gs://{BUCKET}/data/packs/")
print("Translated English resource packs uploaded successfully!")

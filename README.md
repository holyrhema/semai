# SEMAI — Spatial Ecosystem Modeling & AI for Sustainable Rural Businesses

> **Track**: Sustainability & Social Impact  
> **Target Region**: Teluk Jor, East Lombok (Jerowaru, Pare Mas, Pemongkong)  
> **Live Application**: Deployed on Google Cloud Run  
> **AI Engine**: Gemini 3.8 Flash with Function Grounding  

---

## 1. Executive Summary & Problem Statement

Coastal villages hold immense natural capital—mangroves, seagrass, sheltered bays, and seaweed. However, very little of this value currently reaches rural households. As a consequence, the land use that pays the fastest—**unregulated aquaculture ponds (tambak)**—destroys the very mangrove resource base that protects the coast and nurseries local fisheries.

**SEMAI** solves this by mapping a territory's natural resources, enterprises, infrastructure, and markets. It models how they depend on each other and identifies which sustainable micro, small, and medium enterprises (UMKM) can thrive without depleting the ecosystems they rely on. A dual Gemini assistant then helps ecosystem builders plan interventions and assists local owners in running those businesses.

---

## 2. Core Architecture

SEMAI pre-computes complex spatial transforms offline and serves them as static files from Google Cloud Storage, scoring cells dynamically in the browser and grounding Gemini agents through server-side tools.
[Offline Processing: Google Earth Engine & BigQuery GIS]
│
▼
[Google Cloud Storage Public Static Bucket]
├── grid.geojson (12,282 × 100m cells with coastal & risk features)
├── gathering.geojson (18 curated village gathering anchors)
├── roads.geojson (Overture Maps simplified transport vectors)
├── graph_nodes.json & graph_edges.json (25-node ecosystem network)
└── packs/ (Modular JSON resource packs: Mangrove & Seaweed)
│
▼
[Google Cloud Run Container]
├── Client: React + Tailwind CSS + Google Maps JavaScript API
│ ├── Dynamic In-Browser Scoring Engine (/shared/engine/score.ts)
│ ├── Strategic Decision Quadrants (Opportunity vs Threat)
│ └── Interactive 2D Force-Directed Ecosystem Graph
└── Server: Node.js + Express + @google/generative-ai
├── Tanya SEMAI (Builder Agent + Grounded Tools)
├── Asisten Usaha (UMKM Advisor Agent)
└── Threat Alert Simulator (Pub/Sub Event Dispatcher)

---

## 3. Google Cloud Services Used

| Service | Role in SEMAI |
| :--- | :--- |
| **Google Earth Engine (GEE)** | Satellite Embedding V1 Annual (2017–2024), Copernicus DEM GLO-30 elevation, Random Forest land-cover classification. |
| **BigQuery (US Region)** | Overture Maps geospatial queries, spatial distance transforms, centroid extraction, and grid assembly. |
| **Gemini 3.8 Flash (AI Studio)** | Dual agent execution with function calling (`get_area_profile`, `find_sites`, `simulate_impact`). |
| **Google Cloud Storage** | Global CDN hosting for GeoJSON, vector layers, and resource pack configurations. |
| **Google Cloud Run** | Serverless container deployment with auto-scaling to zero instances. |
| **Google Maps Platform** | JavaScript API vector basemap with custom stylized GeoJSON data layers. |

---

## 4. Key Features

* **Map Explorer**: Satellite timeline (2017–2024), coastal mangrove canopy, aquaculture basins, and live 100m predictive overlays.
* **Business Opportunity Heatmap**: Real-time multi-factor weighted scoring for 7 products across 2 resource packs with competition penalties.
* **Strategic Decision Matrix**: Categorizes every 100m cell into 4 actionable policy quadrants (*Accompany Business First*, *Expand & Connect*, *Patrol & Restore*, *Monitor Baseline*).
* **Ask SEMAI (Builder Agent)**: Conversational spatial intelligence that answers location queries and simulates ecosystem trade-offs using tool grounding without hallucination.
* **Ecosystem Dependency Network**: Interactive force-directed canvas that dynamically lights up downstream impacted businesses in red when environmental damage occurs.
* **UMKM Business Assistant & Academy**: Practical advisory for village residents, complete with an interactive Cost of Goods Sold (COGS/HPP) and selling price calculator.
* **Community Watch Alert**: Simulates real-time loss detection with auto-zoom and Pub/Sub dispatch alerts.

---

## 5. Data Disclosure & Integrity

* **Real Data**: Satellite land cover (2017–2024), roads and gathering points (Overture Maps), elevation (Copernicus DEM), and model accuracy metrics (89% Random Forest test accuracy).
* **Simulated Data**: The 40 local UMKM profiles are synthetic entries anchored to general village centroids to protect community privacy in accordance with Indonesian Data Protection Law (UU PDP).
* **Replicability**: Adding a new resource (such as Seaweed) requires only uploading a new JSON configuration file to `packs/` with zero code modifications.

---

## 6. Local Setup & Reproduction

```bash
# Clone the repository
git clone https://github.com/holyrhema/semai.git
cd semai

# Install dependencies
npm install

# Configure environment variables (.env)
PORT=3001
DATA_BASE_URL=https://storage.googleapis.com/semai-data-hrs/data/
VITE_DATA_BASE_URL=https://storage.googleapis.com/semai-data-hrs/data/
GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
GEMINI_API_KEY=your_gemini_api_key

# Run fullstack development environment
npm run dev

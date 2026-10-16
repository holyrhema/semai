import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAreaProfile, findSites, simulateImpact } from './tools.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DATA_BASE_URL = process.env.DATA_BASE_URL || 'https://storage.googleapis.com/semai-data-hrs/data/';

let gridCache: any = null;
let umkmCache: any = null;
let nodesCache: any = null;
let edgesCache: any = null;
let packsCache: Record<string, any> = {};

async function initializeServerCache() {
  console.log("Loading static data into Node server memory from:", DATA_BASE_URL);
  try {
    const [gridRes, umkmRes, nodesRes, edgesRes, packsIdxRes] = await Promise.all([
      fetch(`${DATA_BASE_URL}grid.geojson`),
      fetch(`${DATA_BASE_URL}umkm.json`),
      fetch(`${DATA_BASE_URL}graph_nodes.json`),
      fetch(`${DATA_BASE_URL}graph_edges.json`),
      fetch(`${DATA_BASE_URL}packs/index.json`)
    ]);

    gridCache = await gridRes.json();
    umkmCache = await umkmRes.json();
    nodesCache = await nodesRes.json();
    edgesCache = await edgesRes.json();
    const packsIdx = await packsIdxRes.json();

    for (const pId of packsIdx.active_packs || ['mangrove', 'seaweed']) {
      const res = await fetch(`${DATA_BASE_URL}packs/${pId}.json`);
      if (res.ok) packsCache[pId] = await res.json();
    }
    console.log("Server memory cache initialized successfully!");
  } catch (err) {
    console.error("Failed to initialize server data cache:", err);
  }
}

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const SYSTEM_PROMPT_BUILDER = `
You are SEMAI, an AI spatial economics advisor for programme officers, government planners, and conservation builders in Teluk Jor, East Lombok.
LANGUAGE RULE:
- Detect the user's language. If the user writes in Bahasa Indonesia, answer in clear, professional Bahasa Indonesia. If in English, answer in English.
CORE INSTRUCTIONS:
1. Every metric, percentage, hectare, and site recommendation MUST originate directly from the verified tool context provided below.
2. NEVER hallucinate numbers or recommend clearing standing mangroves.
3. Keep your analysis structured:
   - Provide up to 4 key analytical bullet points citing exact scores and factors.
   - Conclude with 1 clear, actionable next step for the field team.
4. Always note that UMKM enterprise data is simulated for demo purposes (append '(simulated data)' / '(data simulasi)').
`;

const SYSTEM_PROMPT_UMKM = `
You are the SEMAI Business Assistant (Asisten Usaha), a friendly, encouraging mentor helping coastal residents and small business owners in Teluk Jor, East Lombok start and run sustainable local enterprises.
LANGUAGE RULE:
- Detect the user's language. If the user asks in Bahasa Indonesia, respond in simple, warm, practical Bahasa Indonesia. If in English, respond in English.
COMMUNICATION RULES:
1. Keep sentences straightforward, warm, and actionable without complex academic jargon.
2. For "what business suits here", recommend 3 viable businesses for their location. For each, give:
   - 1 simple reason why it fits their village.
   - The key harvest sustainability rule (so they never damage their own raw material supply).
   - 3 immediate, low-cost steps to get started this week.
3. For pricing or costs, guide them to calculate their COGS (Cost of Goods Sold / HPP) and price with a healthy profit margin (e.g. 30–40%).
4. Always remind them that standing mangroves are their livelihood's shield—never clear trees for short-term gain.
`;

function runRelevantTool(prompt: string) {
  const p = prompt.toLowerCase();

  if (p.includes('convert') || p.includes('tambak') || p.includes('harm') || p.includes('impact') || p.includes('dampak') || p.includes('konversi')) {
    const targetNode = (p.includes('tambak') || p.includes('pond')) ? 'R_tambak' : 'R_mangrove';
    const change = (p.includes('tambak') || p.includes('naik')) ? 'naik' : 'hilang';
    const res = simulateImpact(targetNode, change, nodesCache || [], edgesCache || []);
    return {
      toolName: 'simulate_impact',
      args: { node_id: targetNode, change },
      data: res
    };
  }

  if (p.includes('pemongkong') || p.includes('jerowaru') || p.includes('pare mas') || p.includes('village') || p.includes('desa') || p.includes('ringkas')) {
    const desa = p.includes('pemongkong') ? 'Pemongkong' : p.includes('pare') ? 'Pare Mas' : 'Jerowaru';
    const res = getAreaProfile(desa, gridCache?.features || [], umkmCache || []);
    return {
      toolName: 'get_area_profile',
      args: { desa },
      data: res
    };
  }

  let productId = 'madu_mangrove';
  if (p.includes('coffee') || p.includes('kopi')) productId = 'kopi_mangrove';
  if (p.includes('seaweed') || p.includes('gracilaria') || p.includes('agar') || p.includes('rumput')) productId = 'gracilaria_kering';
  if (p.includes('tourism') || p.includes('wisata')) productId = 'ekowisata';

  const res = findSites(productId, 3, gridCache?.features || [], packsCache, umkmCache || []);
  return {
    toolName: 'find_sites',
    args: { product_id: productId, top_n: 3 },
    data: res
  };
}

// 1. Builder Route
app.post('/api/chat/builder', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const toolRun = runRelevantTool(message);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: SYSTEM_PROMPT_BUILDER
    });

    const promptWithGrounding = `
USER INQUIRY:
"${message}"

VERIFIED DATA EXTRACTED VIA TOOL [${toolRun.toolName}]:
${JSON.stringify(toolRun.data, null, 2)}

Provide a concise, professional assessment strictly using the data above. Match the user's language (English or Bahasa Indonesia).
`;

    const result = await model.generateContent(promptWithGrounding);
    const text = result.response.text();

    let highlightedNodes: string[] = [];
    if (toolRun.toolName === 'simulate_impact' && toolRun.data?.impacted_nodes) {
      highlightedNodes = toolRun.data.impacted_nodes.map((n: any) => n.node_id);
    }

    return res.status(200).json({
      text,
      toolsExecuted: [{ name: toolRun.toolName, args: toolRun.args, summary: toolRun.data }],
      highlightedNodes
    });
  } catch (err: any) {
    console.error("Gemini Builder Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process builder inquiry" });
  }
});

// 2. UMKM Route
app.post('/api/chat/umkm', async (req, res) => {
  const { message, village } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const v = village || 'Pemongkong';
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: SYSTEM_PROMPT_UMKM
    });

    const prompt = `
USER RESIDENCE: Village of ${v}, Teluk Jor, East Lombok.
USER QUESTION: "${message}"

Give a friendly, step-by-step practical recommendation tailored to their location in ${v}. Match the language of the user question (English or Bahasa Indonesia).
`;

    const result = await model.generateContent(prompt);
    const replyText = result.response.text();
    return res.status(200).json({ text: replyText });
  } catch (err: any) {
    console.error("Gemini UMKM Error:", err);
    return res.status(500).json({ error: err.message || "Failed to process UMKM assistant request" });
  }
});

// 3. DYNAMIC ALERT ENDPOINT (Generates a DIFFERENT cell & metric on every call!)
const VULNERABLE_CELLS_POOL = [
  // 1. Poton Bako North Shoreline (Right on Bale Mangrove estuary)
  { id: 'c_03494', desa: 'Jerowaru (Bale Mangrove Estuary)', lat: -8.8475, lng: 116.4883, baseRisk: 82, patrol: 'Pokmaswas Bale Mangrove' },
  
  // 2. Teluk Jukung Coastal Lobster & Pond Margin (Pare Mas tidal channel)
  { id: 'c_05708', desa: 'Pare Mas (Teluk Jukung Coastal Basin)', lat: -8.8420, lng: 116.5080, baseRisk: 88, patrol: 'Pos Patroli Pesisir Pare Mas' },
  
  // 3. Teluk Jor Inner Estuary (True intertidal water interface)
  { id: 'c_04812', desa: 'Jerowaru (Kanal Tambak Pesisir)', lat: -8.8510, lng: 116.4920, baseRisk: 79, patrol: 'Patroli Cepat Teluk Jor' },
  
  // 4. Ekas Bay Brackish Water Canal (West shoreline ponds)
  { id: 'c_06340', desa: 'Pemongkong (Laguna Ekas Pesisir)', lat: -8.8550, lng: 116.4640, baseRisk: 74, patrol: 'Unit Ronda Pesisir Ekas' },
  
  // 5. Pare Mas Mudflat Mangrove Fringe (East bay coast)
  { id: 'c_05120', desa: 'Pare Mas (Sempadan Bakau Teluk)', lat: -8.8380, lng: 116.5030, baseRisk: 85, patrol: 'Pos Pengawas Teluk Jukung' },
  
  // 6. Teluk Jor South Salt-pan Shoreline (Right along southern lagoon)
  { id: 'c_07890', desa: 'Pemongkong (Tambak Garam Pesisir)', lat: -8.8620, lng: 116.4860, baseRisk: 80, patrol: 'Kelompok Jaga Pesisir Selatan' }
];

let lastPickIndex = -1;

app.post('/api/alert', async (req, res) => {
  try {
    // Pick a DIFFERENT index from the previous click
    let nextIndex = Math.floor(Math.random() * VULNERABLE_CELLS_POOL.length);
    if (nextIndex === lastPickIndex) {
      nextIndex = (nextIndex + 1) % VULNERABLE_CELLS_POOL.length;
    }
    lastPickIndex = nextIndex;

    const cell = VULNERABLE_CELLS_POOL[nextIndex];

    // Dynamic random loss (1.4 to 3.8 ha)
    const simulatedLoss = Math.round((1.4 + Math.random() * 2.4) * 10) / 10;
    const dynamicRisk = Math.min(94, cell.baseRisk + Math.floor(Math.random() * 9) - 4);

    const alertPayload = {
      event: "MANGROVE_LOSS_DETECTED",
      timestamp: new Date().toISOString(),
      cell_id: cell.id,
      village: cell.desa,
      loss_area_ha: simulatedLoss,
      conversion_risk: `${dynamicRisk}%`,
      coordinates: [cell.lat, cell.lng],
      assigned_unit: cell.patrol,
      action_required: `Dispatched ${cell.patrol} for perimeter verification`
    };

    console.log("🚨 [DYNAMIC ALERT TRIGGERED]:", alertPayload);

    // Telegram Bot Dispatch
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      const formattedTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
      const messageText = 
`🚨 *SEMAI THREAT ALERT: SATELLITE ANOMALY DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Location*: Desa ${alertPayload.village}
🗺️ *Grid Cell*: \`${alertPayload.cell_id}\`
🌐 *Coordinates*: \`${cell.lat.toFixed(4)}, ${cell.lng.toFixed(4)}\`
📉 *Detected Canopy Loss*: *~${alertPayload.loss_area_ha} hectares*
⚠️ *Conversion Threat*: *${alertPayload.conversion_risk}* (Critical)
⏱️ *Timestamp*: ${formattedTime} WITA

🚢 *Response Action Dispatched*:
*${alertPayload.assigned_unit}* has been alerted via Google Cloud Pub/Sub. Immediate field inspection required.

🔗 [View on SEMAI Live Map](https://semai-485946535221.asia-southeast2.run.app/)
_(Live event simulation replay: 100m satellite embedding)_`;

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChatId,
            text: messageText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        });
        const tgData = await tgRes.json();
        if (tgData.ok) {
          console.log("✅ Dynamic Telegram alert dispatched to group!");
        } else {
          console.error("⚠️ Telegram API returned error:", tgData.description);
        }
      } catch (tgErr) {
        console.error("⚠️ Failed to reach Telegram API:", tgErr);
      }
    } else {
      console.log("ℹ️ Telegram credentials not set. Alert processed locally.");
    }

    return res.status(200).json({ success: true, alert: alertPayload });
  } catch (err: any) {
    console.error("Alert Error:", err);
    return res.status(500).json({ error: "Failed to dispatch alert" });
  }
});

// 4. Production Static Frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`SEMAI Backend listening on http://${HOST}:${PORT}`);
  initializeServerCache();
});

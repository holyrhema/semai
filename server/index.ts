import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAreaProfile, findSites, simulateImpact } from './tools.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DATA_BASE_URL = process.env.DATA_BASE_URL || 'https://storage.googleapis.com/semai-data-hrs/data/';

let gridCache: any = null;
let umkmCache: any = null;
let nodesCache: any = null;
let edgesCache: any = null;
let packsCache: Record<string, any> = {};

async function initializeServerCache() {
  console.log("Loading static data into Node server memory...");
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

// System Prompts
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

  // What-if / Impact Simulation
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

  // Village Baseline Summary
  if (p.includes('pemongkong') || p.includes('jerowaru') || p.includes('pare mas') || p.includes('village') || p.includes('desa') || p.includes('ringkas')) {
    const desa = p.includes('pemongkong') ? 'Pemongkong' : p.includes('pare') ? 'Pare Mas' : 'Jerowaru';
    const res = getAreaProfile(desa, gridCache?.features || [], umkmCache || []);
    return {
      toolName: 'get_area_profile',
      args: { desa },
      data: res
    };
  }

  // Site Recommendation (Default)
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

// 1. ROUTE: Builder AI Chat
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

// 2. ROUTE: UMKM Assistant Chat
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

// 3. ROUTE: Alert Simulator
app.post('/api/alert', async (req, res) => {
  try {
    const alertPayload = {
      event: "MANGROVE_LOSS_DETECTED",
      timestamp: new Date().toISOString(),
      cell_id: "c_03494",
      village: "Jerowaru",
      loss_area_ha: 2.4,
      conversion_risk: "78%",
      action_required: "Pokmaswas coastal patrol dispatched via Pub/Sub"
    };

    console.log("🚨 [SEMAI ALERT DISPATCHED]:", alertPayload);
    return res.status(200).json({ success: true, alert: alertPayload });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to dispatch alert" });
  }
});

// 4. Production Static File Serving (Placed strictly at the very bottom!)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

app.use(express.static(distPath));

app.listen(PORT, async () => {
  console.log(`SEMAI Backend running on http://localhost:${PORT}`);
  await initializeServerCache();
});

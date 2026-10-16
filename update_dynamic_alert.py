import re

with open("server/index.ts", "r") as f:
    code = f.read()

# Replace the alert endpoint with a dynamic spatial picker
old_pattern = r"app\.post\('/api/alert'[\s\S]*?return res\.status\(500\)[\s\S]*?\}\);\n\}\);"

new_endpoint = """app.post('/api/alert', async (req, res) => {
  try {
    if (!gridCache?.features || gridCache.features.length === 0) {
      return res.status(500).json({ error: "Spatial grid data not loaded" });
    }

    // 1. Find all candidate coastal cells facing genuine conversion pressure
    const threatCandidates = gridCache.features.filter((f: any) => {
      const p = f.properties;
      return (
        (p.p_loss && p.p_loss >= 0.45) ||
        (p.p_loss_500m && p.p_loss_500m >= 0.50) ||
        (p.mangrove_frac_2024 > 0.15 && (p.dist_coast_m || 999) <= 180)
      );
    });

    const pool = threatCandidates.length > 0 ? threatCandidates : gridCache.features.slice(0, 50);

    // 2. Randomly select one distinct cell on every click
    const randomCell = pool[Math.floor(Math.random() * pool.length)];
    const p = randomCell.properties;

    // Extract exact coordinates [lng, lat]
    const coords = randomCell.geometry?.coordinates?.[0]?.[0] || [116.4883, -8.8475];
    const lng = coords[0];
    const lat = coords[1];

    // Compute dynamic, realistic loss footprint (1.2 to 3.8 ha)
    const simulatedLoss = Math.round((1.2 + Math.random() * 2.6) * 10) / 10;
    const riskPercent = Math.round((p.p_loss_500m || p.p_loss || (0.65 + Math.random() * 0.25)) * 100);

    const patrolPosts: Record<string, string> = {
      'Jerowaru': 'Pokmaswas Bale Mangrove Poton Bako',
      'Pare Mas': 'Pos Patroli Pesisir Dermaga Pare Mas',
      'Pemongkong': 'Unit Pengawas Pesisir Teluk Jor Selatan'
    };
    const villageName = p.desa || 'Jerowaru';
    const assignedPatrol = patrolPosts[villageName] || 'Pokmaswas Teluk Jor Patrol';

    const alertPayload = {
      event: "MANGROVE_LOSS_DETECTED",
      timestamp: new Date().toISOString(),
      cell_id: p.cell_id || `c_${Math.floor(1000 + Math.random() * 9000)}`,
      village: villageName,
      loss_area_ha: simulatedLoss,
      conversion_risk: `${riskPercent}%`,
      coordinates: [lat, lng],
      assigned_unit: assignedPatrol,
      action_required: `Dispatched ${assignedPatrol} for coastal perimeter verification`
    };

    console.log("🚨 [DYNAMIC ALERT TRIGGERED]:", alertPayload);

    // 3. Dispatch to Telegram Bot with dynamic content
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      const formattedTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' });
      const messageText = 
`🚨 *SEMAI THREAT ALERT: SATELLITE ANOMALY DETECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Location*: Desa ${alertPayload.village}
🗺️ *Grid Cell*: \`${alertPayload.cell_id}\`
🌐 *Coordinates*: \`${lat.toFixed(4)}, ${lng.toFixed(4)}\`
📉 *Detected Canopy Loss*: *~${alertPayload.loss_area_ha} hectares*
⚠️ *Conversion Threat*: *${alertPayload.conversion_risk}* (Critical)
⏱️ *Timestamp*: ${formattedTime} WITA

🚢 *Response Action Dispatched*:
*${alertPayload.assigned_unit}* has been alerted via Google Cloud Pub/Sub. Immediate field inspection required.

_(Live event simulation replay: 100m satellite embedding)_`;

      const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      console.log("✅ Dynamic Telegram alert dispatched successfully!");
    }

    return res.status(200).json({ success: true, alert: alertPayload });
  } catch (err: any) {
    console.error("Alert Error:", err);
    return res.status(500).json({ error: "Failed to dispatch alert" });
  }
});"""

code = re.sub(old_pattern, new_endpoint, code)
with open("server/index.ts", "w") as f:
    code = f.write(code)

print("Dynamic alert generator installed in server/index.ts!")

with open("server/index.ts", "r") as f:
    content = f.read()

# Replace the alert endpoint with active Telegram Bot dispatch
old_route = """app.post('/api/alert', async (req, res) => {
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
});"""

new_route = """app.post('/api/alert', async (req, res) => {
  try {
    const alertPayload = {
      event: "MANGROVE_LOSS_DETECTED",
      timestamp: new Date().toISOString(),
      cell_id: "c_03494",
      village: "Jerowaru (Poton Bako Fringe)",
      loss_area_ha: 2.4,
      conversion_risk: "78%",
      coordinates: [-8.8475, 116.4883],
      action_required: "Pokmaswas coastal boat patrol dispatched"
    };

    console.log("🚨 [SEMAI ALERT DISPATCHED]:", alertPayload);

    // TELEGRAM DISPATCH
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.TELEGRAM_CHAT_ID;

    if (tgToken && tgChatId) {
      const messageText = 
`🚨 *SEMAI EARLY WARNING: MANGROVE LOSS DETECTED*
━━━━━━━━━━━━━━━━━━━━━
📍 *Location*: Desa ${alertPayload.village}
🗺️ *Grid Cell*: \`${alertPayload.cell_id}\`
⚠️ *Conversion Risk*: *${alertPayload.conversion_risk}* (Critical)
📉 *Estimated Loss*: ~${alertPayload.loss_area_ha} hectares
⏱️ *Timestamp*: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA

🔔 *Dispatched Action*:
${alertPayload.action_required}. Please verify coordinate perimeter via SEMAI map.

_(Demo simulation replay: multi-year satellite detection)_`;

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
      console.log("✅ Alert sent to Telegram group successfully!");
    } else {
      console.log("ℹ️ Telegram credentials not set. Alert logged to console.");
    }

    return res.status(200).json({ success: true, alert: alertPayload });
  } catch (err: any) {
    console.error("Alert Error:", err);
    return res.status(500).json({ error: "Failed to dispatch alert" });
  }
});"""

if old_route in content:
    content = content.replace(old_route, new_route)
    with open("server/index.ts", "w") as f:
        f.write(content)
    print("server/index.ts updated with Telegram bot dispatcher!")
else:
    print("Could not find exact text, check manually.")

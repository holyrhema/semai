with open("server/index.ts", "r") as f:
    code = f.read()

# Replace the Telegram dispatch section with a robust fetch
old_block = """    if (tgToken && tgChatId) {
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

_(Live event simulation replay: 100m satellite embedding)_`;

      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      console.log("✅ Dynamic Telegram alert sent!");
    }"""

new_block = """    if (tgToken && tgChatId) {
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

🔗 [View on SEMAI Live Map](https://semai-hackathon.web.app)
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
    }"""

if old_block in code:
    code = code.replace(old_block, new_block)
    with open("server/index.ts", "w") as f:
        f.write(code)
    print("server/index.ts updated with full Telegram error handling & link preview options!")
else:
    print("Could not find exact block, checking server/index.ts...")

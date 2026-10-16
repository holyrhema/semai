import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("TELEGRAM_BOT_TOKEN")
chat_id = os.getenv("TELEGRAM_CHAT_ID")

print(f"Token: {token[:8]}..." if token else "❌ Missing TELEGRAM_BOT_TOKEN in .env")
print(f"Chat ID: {chat_id}" if chat_id else "❌ Missing TELEGRAM_CHAT_ID in .env")

if token and chat_id:
    msg = (
        "🚨 *SEMAI TEST ALERT*\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "Testing connection to Pokmaswas Patrol Group.\n"
        "Status: *ONLINE & READY* ✅"
    )
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    res = requests.post(url, json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
    if res.status_code == 200:
        print("🎉 SUCCESS! Check your Telegram group.")
    else:
        print("❌ Failed:", res.text)

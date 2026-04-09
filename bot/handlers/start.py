"""Handler for /start command."""
from telegram import Update
from telegram.ext import ContextTypes

from config import WEB_APP_URL


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send welcome message with available commands."""
    web_link = f"\n🌐 Web app: {WEB_APP_URL}" if WEB_APP_URL else ""
    text = (
        "⚡ *EarnRebalancer Bot*\n\n"
        "I help you discover the best DeFi yield opportunities and rebalance your positions.\n\n"
        "*Commands:*\n"
        "/positions `<wallet>` — View your current yield positions\n"
        "/recommend `<wallet>` — Get a rebalance recommendation\n"
        "/execute `<wallet>` — Get a LI.FI quote and execute a rebalance\n"
        f"{web_link}"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

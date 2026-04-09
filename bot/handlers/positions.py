"""Handler for /positions command."""
from telegram import Update
from telegram.ext import ContextTypes

from api.earn import fetch_positions
from utils.risk import calculate_risk_score, risk_label


def _fmt_usd(n: float) -> str:
    if n >= 1_000_000:
        return f"${n/1_000_000:.2f}M"
    if n >= 1_000:
        return f"${n/1_000:.2f}K"
    return f"${n:.2f}"


async def positions(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fetch and display a wallet's current yield positions."""
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "Usage: /positions `<wallet_address>`", parse_mode="Markdown"
        )
        return

    wallet = args[0]
    msg = await update.message.reply_text("🔍 Fetching positions…")

    try:
        pos_list = await fetch_positions(wallet)
    except Exception as exc:
        await msg.edit_text(f"⚠️ Error fetching positions: {exc}")
        return

    if not pos_list:
        await msg.edit_text(
            f"No positions found for `{wallet[:8]}…{wallet[-4:]}`.",
            parse_mode="Markdown",
        )
        return

    lines = [f"📊 *Positions for* `{wallet[:8]}…{wallet[-4:]}`\n"]
    for pos in pos_list:
        v = pos["vault"]
        risk = calculate_risk_score(v)
        vault_name = v["name"] or f"{v['protocol']} {v['token']}"
        lines.append(
            f"• *{vault_name}*\n"
            f"  Chain: {v['chain']} | Token: {v['token']}\n"
            f"  Balance: {pos['balance']:.4f} {v['token']} ({_fmt_usd(pos['balanceUsd'])})\n"
            f"  APY: {v['apy']:.2f}% | Risk: {risk_label(risk)} ({risk})\n"
        )

    await msg.edit_text("\n".join(lines), parse_mode="Markdown")

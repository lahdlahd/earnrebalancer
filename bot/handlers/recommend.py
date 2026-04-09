"""Handler for /recommend command."""
from __future__ import annotations

from typing import Any

from telegram import Update
from telegram.ext import ContextTypes

from api.earn import fetch_positions, fetch_vaults
from utils.risk import calculate_risk_score, risk_label


def _build_recommendation(
    positions: list[dict[str, Any]], vaults: list[dict[str, Any]]
) -> dict[str, Any] | None:
    """Pick the worst-performing position and suggest a better vault."""
    if not positions or not vaults:
        return None

    current_pos = min(positions, key=lambda p: p["vault"]["apy"])
    current_vault = current_pos["vault"]
    current_risk = calculate_risk_score(current_vault)

    candidates = [
        v for v in vaults
        if v["id"] != current_vault["id"]
        and v["token"] == current_vault["token"]
        and v["apy"] > current_vault["apy"]
    ]
    if not candidates:
        return None

    suggested = max(
        candidates,
        key=lambda v: v["apy"] - calculate_risk_score(v) / 10,
    )
    suggested_risk = calculate_risk_score(suggested)

    return {
        "current_vault": current_vault,
        "current_pos": current_pos,
        "suggested_vault": suggested,
        "apy_delta": suggested["apy"] - current_vault["apy"],
        "risk_delta": suggested_risk - current_risk,
        "current_risk": current_risk,
        "suggested_risk": suggested_risk,
    }


async def recommend(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fetch positions + vaults and return a rebalance recommendation."""
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "Usage: /recommend `<wallet_address>`", parse_mode="Markdown"
        )
        return

    wallet = args[0]
    msg = await update.message.reply_text("🔍 Analysing positions…")

    try:
        pos_list = await fetch_positions(wallet)
        vaults = await fetch_vaults()
    except Exception as exc:
        await msg.edit_text(f"⚠️ Error: {exc}")
        return

    rec = _build_recommendation(pos_list, vaults)
    if not rec:
        await msg.edit_text(
            "🎉 No better vault found — you're already well-positioned!"
        )
        return

    cv = rec["current_vault"]
    sv = rec["suggested_vault"]
    cv_name = cv["name"] or f"{cv['protocol']} {cv['token']}"
    sv_name = sv["name"] or f"{sv['protocol']} {sv['token']}"
    sign = "+" if rec["apy_delta"] >= 0 else ""
    risk_sign = "+" if rec["risk_delta"] >= 0 else ""

    text = (
        "💡 *Rebalance Recommendation*\n\n"
        f"*Current:* {cv_name}\n"
        f"  APY: {cv['apy']:.2f}% | Risk: {risk_label(rec['current_risk'])} ({rec['current_risk']})\n\n"
        f"*Suggested:* {sv_name}\n"
        f"  APY: {sv['apy']:.2f}% | Risk: {risk_label(rec['suggested_risk'])} ({rec['suggested_risk']})\n\n"
        f"📈 APY change: *{sign}{rec['apy_delta']:.2f}%*\n"
        f"🛡 Risk change: *{risk_sign}{rec['risk_delta']} pts*\n\n"
        f"Move `{cv['token']}` from *{cv['protocol']}* → *{sv['protocol']}* "
        f"for {rec['apy_delta']:.2f}% more yield.\n\n"
        f"Use /execute `{wallet}` to get a transaction quote."
    )

    await msg.edit_text(text, parse_mode="Markdown")

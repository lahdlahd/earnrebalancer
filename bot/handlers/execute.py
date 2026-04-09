"""Handler for /execute command."""
from __future__ import annotations

import math
from typing import Any

from telegram import Update
from telegram.ext import ContextTypes

from api.earn import fetch_positions, fetch_vaults
from api.lifi import fetch_quote
from utils.risk import calculate_risk_score


def _best_suggestion(
    positions: list[dict[str, Any]], vaults: list[dict[str, Any]]
) -> tuple[dict[str, Any], dict[str, Any]] | None:
    """Return (position, suggested_vault) or None if no better vault found."""
    if not positions or not vaults:
        return None

    current_pos = min(positions, key=lambda p: p["vault"]["apy"])
    current_vault = current_pos["vault"]

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
    return current_pos, suggested


async def execute(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fetch a LI.FI quote and return a mocked execution confirmation."""
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "Usage: /execute `<wallet_address>`", parse_mode="Markdown"
        )
        return

    wallet = args[0]
    msg = await update.message.reply_text("⚙️ Fetching quote from LI.FI…")

    try:
        pos_list = await fetch_positions(wallet)
        vaults = await fetch_vaults()
    except Exception as exc:
        await msg.edit_text(f"⚠️ Error fetching data: {exc}")
        return

    result = _best_suggestion(pos_list, vaults)
    if not result:
        await msg.edit_text(
            "🎉 No better vault found — no rebalance needed!"
        )
        return

    current_pos, suggested_vault = result
    current_vault = current_pos["vault"]

    # Convert balance to wei-equivalent (assume 18 decimals for MVP)
    balance = current_pos.get("balance", 0)
    amount_wei = str(int(math.floor(balance * 1e18)))

    try:
        quote = await fetch_quote(
            from_chain=current_vault["chain"],
            to_chain=suggested_vault["chain"],
            from_token=current_vault["token"],
            to_token=suggested_vault["token"],
            from_amount=amount_wei,
            from_address=wallet,
        )
        quote_id = quote.get("id", "n/a")
        to_amount = quote.get("estimate", {}).get("toAmountMin", "0")
        duration = quote.get("estimate", {}).get("executionDuration", "?")

        text = (
            "✅ *Quote received from LI.FI*\n\n"
            f"Quote ID: `{quote_id}`\n"
            f"From: *{current_vault['token']}* on *{current_vault['chain']}*\n"
            f"To: *{suggested_vault['token']}* on *{suggested_vault['chain']}*\n"
            f"Amount: `{balance:.4f}` {current_vault['token']}\n"
            f"You receive (min): `{int(to_amount)/1e18:.6f}` {suggested_vault['token']}\n"
            f"Est. duration: {duration}s\n\n"
            "⚠️ *MVP mode:* Transaction would be signed and submitted via your "
            "connected wallet in production. Quote ID is your reference."
        )
    except Exception as exc:
        # Return a mocked response if the API call fails (e.g., missing API key)
        mock_id = f"mock-{abs(hash(wallet)) % 10**12:012d}"
        text = (
            "⚠️ *LI.FI API unavailable* — showing mock response\n\n"
            f"Mock quote ID: `{mock_id}`\n"
            f"From: *{current_vault['token']}* on *{current_vault['chain']}*\n"
            f"To: *{suggested_vault['token']}* on *{suggested_vault['chain']}*\n"
            f"Amount: `{balance:.4f}` {current_vault['token']}\n\n"
            f"Error detail: {exc}\n\n"
            "In production this would call LI.FI and return a real quote."
        )

    await msg.edit_text(text, parse_mode="Markdown")

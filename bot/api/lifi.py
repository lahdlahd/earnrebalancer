"""LI.FI API client."""
from __future__ import annotations

from typing import Any

import httpx

from config import LIFI_BASE_URL, LIFI_API_KEY


async def fetch_quote(
    from_chain: str,
    to_chain: str,
    from_token: str,
    to_token: str,
    from_amount: str,
    from_address: str,
    to_address: str | None = None,
) -> dict[str, Any]:
    """Fetch a swap/bridge quote from LI.FI."""
    params: dict[str, str] = {
        "fromChain": from_chain,
        "toChain": to_chain,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAmount": from_amount,
        "fromAddress": from_address,
    }
    if to_address:
        params["toAddress"] = to_address

    headers: dict[str, str] = {}
    if LIFI_API_KEY:
        headers["x-lifi-api-key"] = LIFI_API_KEY

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{LIFI_BASE_URL}/v1/quote",
            params=params,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()

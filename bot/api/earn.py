"""Earn API client."""
from __future__ import annotations

from typing import Any

import httpx

from config import EARN_BASE_URL


def _enrich(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalise a vault dict from the Earn API."""
    return {
        "id": str(raw.get("id") or raw.get("vaultId") or raw.get("address") or ""),
        "name": str(raw.get("name") or raw.get("displayName") or ""),
        "protocol": str(raw.get("protocol") or raw.get("protocolId") or ""),
        "chain": str(raw.get("chain") or raw.get("chainId") or raw.get("network") or ""),
        "token": str(raw.get("token") or raw.get("tokenSymbol") or raw.get("asset") or ""),
        "apy": float(raw.get("apy") or raw.get("apyBase") or raw.get("currentApy") or 0),
        "tvl": float(raw.get("tvl") or raw.get("tvlUsd") or raw.get("totalValueLocked") or 0),
        "tvlChange7d": raw.get("tvlChange7d"),
        "apyHistory": raw.get("apyHistory"),
    }


async def fetch_vaults(
    chain: str | None = None,
    token: str | None = None,
    protocol: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch vaults from the Earn API with optional filters."""
    params: dict[str, str] = {}
    if chain:
        params["chain"] = chain
    if token:
        params["token"] = token
    if protocol:
        params["protocol"] = protocol

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{EARN_BASE_URL}/v1/opportunities", params=params)
        resp.raise_for_status()
        data = resp.json()

    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = (
            data.get("opportunities")
            or data.get("vaults")
            or data.get("data")
            or data.get("items")
            or []
        )
    else:
        items = []

    return [_enrich(v) for v in items]


async def fetch_positions(wallet_address: str) -> list[dict[str, Any]]:
    """Fetch user positions from the Earn API."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{EARN_BASE_URL}/v1/positions",
            params={"walletAddress": wallet_address},
        )
        resp.raise_for_status()
        data = resp.json()

    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = (
            data.get("positions")
            or data.get("data")
            or data.get("items")
            or []
        )
    else:
        items = []

    result = []
    for raw in items:
        vault_raw = raw.get("vault") or raw.get("opportunity") or {}
        vault = _enrich({**vault_raw, **({"id": raw["vaultId"]} if "vaultId" in raw else {})})
        result.append(
            {
                "vault": vault,
                "balance": float(raw.get("balance") or raw.get("amount") or 0),
                "balanceUsd": float(
                    raw.get("balanceUsd") or raw.get("valueUsd") or raw.get("amountUsd") or 0
                ),
                "shareOfPool": float(raw.get("shareOfPool") or raw.get("share") or 0),
            }
        )
    return result

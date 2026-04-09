"""Risk score calculation matching the web app logic."""
from __future__ import annotations

import math
from typing import Any

PROTOCOL_RISK: dict[str, int] = {
    "aave": 5,
    "compound": 5,
    "morpho-blue": 8,
    "morpho": 8,
    "spark": 10,
    "euler": 12,
    "yearn": 15,
    "pendle": 18,
    "convex": 18,
    "curve": 12,
    "uniswap-v3": 10,
    "beefy": 20,
    "stargate": 22,
    "radiant": 25,
    "silo": 20,
    "fluid": 15,
    "seamless": 18,
    "ionic-protocol": 22,
}

CHAIN_RISK: dict[str, int] = {
    "ethereum": 0, "1": 0,
    "arbitrum": 5, "42161": 5,
    "optimism": 5, "10": 5,
    "polygon": 8, "137": 8,
    "base": 8, "8453": 8,
    "avalanche": 12, "43114": 12,
    "bsc": 12, "56": 12,
    "linea": 15, "59144": 15,
    "scroll": 15, "534352": 15,
    "zksync": 15, "324": 15,
    "gnosis": 12, "100": 12,
    "mode": 20, "34443": 20,
}


def _stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def calculate_risk_score(vault: dict[str, Any]) -> int:
    """Return a risk score 0-100 for the given vault dict."""
    score = 0

    protocol_key = vault.get("protocol", "").lower().replace(" ", "-")
    score += min(30, PROTOCOL_RISK.get(protocol_key, 25))

    chain_key = vault.get("chain", "").lower().replace(" ", "-")
    score += min(20, CHAIN_RISK.get(chain_key, 18))

    tvl_change = vault.get("tvlChange7d") or 0
    if tvl_change < -50:
        score += 25
    elif tvl_change < -30:
        score += 20
    elif tvl_change < -15:
        score += 15
    elif tvl_change < -5:
        score += 8
    elif tvl_change < 0:
        score += 3

    apy_history = vault.get("apyHistory") or []
    if len(apy_history) >= 2:
        sd = _stddev([float(x) for x in apy_history])
        if sd > 20:
            score += 15
        elif sd > 10:
            score += 10
        elif sd > 5:
            score += 6
        elif sd > 2:
            score += 3

    tvl_m = (vault.get("tvl") or 0) / 1_000_000
    if tvl_m < 0.1:
        score += 10
    elif tvl_m < 1:
        score += 7
    elif tvl_m < 10:
        score += 4
    elif tvl_m < 50:
        score += 2

    return min(100, max(0, round(score)))


def risk_label(score: int) -> str:
    if score <= 20:
        return "Very Low"
    if score <= 40:
        return "Low"
    if score <= 60:
        return "Medium"
    if score <= 80:
        return "High"
    return "Very High"

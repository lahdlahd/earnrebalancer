import type { Vault } from '../types';

/**
 * Risk score calculation (0 = lowest risk, 100 = highest risk).
 *
 * Factors:
 *  1. TVL change over 7 days (sharp drops signal risk)
 *  2. APY volatility (high variance signals unsustainable yields)
 *  3. Protocol tier (well-known protocols score lower)
 *  4. Chain tier (established chains score lower)
 */

const PROTOCOL_RISK: Record<string, number> = {
  aave: 5,
  compound: 5,
  'morpho-blue': 8,
  morpho: 8,
  spark: 10,
  euler: 12,
  yearn: 15,
  pendle: 18,
  convex: 18,
  curve: 12,
  'uniswap-v3': 10,
  beefy: 20,
  stargate: 22,
  radiant: 25,
  silo: 20,
  fluid: 15,
  seamless: 18,
  'ionic-protocol': 22,
};

const CHAIN_RISK: Record<string, number> = {
  ethereum: 0,
  '1': 0,
  arbitrum: 5,
  '42161': 5,
  optimism: 5,
  '10': 5,
  polygon: 8,
  '137': 8,
  base: 8,
  '8453': 8,
  avalanche: 12,
  '43114': 12,
  bsc: 12,
  '56': 12,
  linea: 15,
  '59144': 15,
  scroll: 15,
  '534352': 15,
  zksync: 15,
  '324': 15,
  gnosis: 12,
  '100': 12,
  mode: 20,
  '34443': 20,
};

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function calculateRiskScore(vault: Vault): number {
  let score = 0;

  // 1. Protocol risk (0-30)
  const protocolKey = vault.protocol.toLowerCase().replace(/\s+/g, '-');
  const protocolRisk = PROTOCOL_RISK[protocolKey] ?? 25;
  score += Math.min(30, protocolRisk);

  // 2. Chain risk (0-20)
  const chainKey = vault.chain.toLowerCase().replace(/\s+/g, '-');
  const chainRisk = CHAIN_RISK[chainKey] ?? 18;
  score += Math.min(20, chainRisk);

  // 3. TVL change risk (0-25): large negative change is risky
  const tvlChange = vault.tvlChange7d ?? 0;
  if (tvlChange < -50) score += 25;
  else if (tvlChange < -30) score += 20;
  else if (tvlChange < -15) score += 15;
  else if (tvlChange < -5) score += 8;
  else if (tvlChange < 0) score += 3;

  // 4. APY volatility risk (0-15)
  if (vault.apyHistory && vault.apyHistory.length >= 2) {
    const sd = stddev(vault.apyHistory);
    if (sd > 20) score += 15;
    else if (sd > 10) score += 10;
    else if (sd > 5) score += 6;
    else if (sd > 2) score += 3;
  }

  // 5. TVL size risk (0-10): tiny TVL is riskier
  const tvlM = vault.tvl / 1_000_000;
  if (tvlM < 0.1) score += 10;
  else if (tvlM < 1) score += 7;
  else if (tvlM < 10) score += 4;
  else if (tvlM < 50) score += 2;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function riskLabel(score: number): string {
  if (score <= 20) return 'Very Low';
  if (score <= 40) return 'Low';
  if (score <= 60) return 'Medium';
  if (score <= 80) return 'High';
  return 'Very High';
}

export function riskColor(score: number): string {
  if (score <= 20) return '#22c55e';
  if (score <= 40) return '#84cc16';
  if (score <= 60) return '#eab308';
  if (score <= 80) return '#f97316';
  return '#ef4444';
}

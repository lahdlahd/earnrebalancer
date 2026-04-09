import type { Vault, Position, VaultFilters } from '../types';
import { calculateRiskScore } from '../utils/riskScore';

const EARN_BASE_URL = import.meta.env.VITE_EARN_BASE_URL || 'https://earn.li.fi';

function enrichVault(raw: Record<string, unknown>): Vault {
  const vault: Vault = {
    id: String(raw.id ?? raw.vaultId ?? raw.address ?? ''),
    name: String(raw.name ?? raw.displayName ?? ''),
    protocol: String(raw.protocol ?? raw.protocolId ?? ''),
    chain: String(raw.chain ?? raw.chainId ?? raw.network ?? ''),
    token: String(raw.token ?? raw.tokenSymbol ?? raw.asset ?? ''),
    apy: Number(raw.apy ?? raw.apyBase ?? raw.currentApy ?? 0),
    tvl: Number(raw.tvl ?? raw.tvlUsd ?? raw.totalValueLocked ?? 0),
    tvlChange7d: raw.tvlChange7d !== undefined ? Number(raw.tvlChange7d) : undefined,
    apyHistory: Array.isArray(raw.apyHistory)
      ? (raw.apyHistory as number[])
      : undefined,
  };
  vault.riskScore = calculateRiskScore(vault);
  return vault;
}

export async function fetchVaults(filters?: VaultFilters): Promise<Vault[]> {
  const params = new URLSearchParams();
  if (filters?.chain) params.set('chain', filters.chain);
  if (filters?.token) params.set('token', filters.token);
  if (filters?.protocol) params.set('protocol', filters.protocol);

  const url = `${EARN_BASE_URL}/v1/opportunities?${params.toString()}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Earn API error ${res.status}: ${await res.text()}`);
  }

  const data: unknown = await res.json();

  let items: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    items = data as Record<string, unknown>[];
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const candidate = obj.opportunities ?? obj.vaults ?? obj.data ?? obj.items;
    if (Array.isArray(candidate)) {
      items = candidate as Record<string, unknown>[];
    }
  }

  let vaults = items.map(enrichVault);

  // Client-side filters
  if (filters?.minApy !== undefined) {
    vaults = vaults.filter((v) => v.apy >= (filters.minApy as number));
  }
  if (filters?.maxRisk !== undefined) {
    vaults = vaults.filter(
      (v) => (v.riskScore ?? 0) <= (filters.maxRisk as number),
    );
  }

  return vaults;
}

export async function fetchPositions(walletAddress: string): Promise<Position[]> {
  if (!walletAddress) return [];

  const url = `${EARN_BASE_URL}/v1/positions?walletAddress=${encodeURIComponent(walletAddress)}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Earn API error ${res.status}: ${await res.text()}`);
  }

  const data: unknown = await res.json();

  let items: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    items = data as Record<string, unknown>[];
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const candidate = obj.positions ?? obj.data ?? obj.items;
    if (Array.isArray(candidate)) {
      items = candidate as Record<string, unknown>[];
    }
  }

  return items.map((raw) => {
    const vaultRaw = (raw.vault ?? raw.opportunity ?? {}) as Record<string, unknown>;
    const vault = enrichVault({ ...vaultRaw, ...(raw.vaultId ? { id: raw.vaultId } : {}) });
    return {
      vaultId: vault.id,
      vault,
      walletAddress,
      balance: Number(raw.balance ?? raw.amount ?? 0),
      balanceUsd: Number(raw.balanceUsd ?? raw.valueUsd ?? raw.amountUsd ?? 0),
      shareOfPool: Number(raw.shareOfPool ?? raw.share ?? 0),
    } as Position;
  });
}

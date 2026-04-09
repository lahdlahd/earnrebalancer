import type { Vault } from '../types';
import { riskLabel, riskColor } from '../utils/riskScore';

interface Props {
  vault: Vault;
  onSelect?: (vault: Vault) => void;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtUsd(n: number) {
  if (n >= 1e9) return `$${fmt(n / 1e9)}B`;
  if (n >= 1e6) return `$${fmt(n / 1e6)}M`;
  if (n >= 1e3) return `$${fmt(n / 1e3)}K`;
  return `$${fmt(n)}`;
}

export function VaultCard({ vault, onSelect }: Props) {
  const risk = vault.riskScore ?? 0;
  const color = riskColor(risk);

  return (
    <div className="vault-card" onClick={() => onSelect?.(vault)}>
      <div className="vault-card-header">
        <div>
          <div className="vault-name">{vault.name || `${vault.protocol} ${vault.token}`}</div>
          <div className="vault-meta">
            <span className="badge">{vault.protocol}</span>
            <span className="badge badge-chain">{vault.chain}</span>
            <span className="badge badge-token">{vault.token}</span>
          </div>
        </div>
        <div className="vault-apy">
          <div className="apy-value">{fmt(vault.apy)}%</div>
          <div className="apy-label">APY</div>
        </div>
      </div>

      <div className="vault-card-footer">
        <div className="vault-stat">
          <span className="stat-label">TVL</span>
          <span className="stat-value">{fmtUsd(vault.tvl)}</span>
        </div>
        {vault.tvlChange7d !== undefined && (
          <div className="vault-stat">
            <span className="stat-label">7d TVL</span>
            <span
              className="stat-value"
              style={{ color: vault.tvlChange7d >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {vault.tvlChange7d >= 0 ? '+' : ''}
              {fmt(vault.tvlChange7d)}%
            </span>
          </div>
        )}
        <div className="vault-stat">
          <span className="stat-label">Risk</span>
          <span className="stat-value" style={{ color }}>
            {riskLabel(risk)} ({risk})
          </span>
        </div>
      </div>

      {onSelect && (
        <button
          className="btn btn-outline btn-sm vault-select-btn"
          onClick={(e) => { e.stopPropagation(); onSelect(vault); }}
        >
          Select
        </button>
      )}
    </div>
  );
}

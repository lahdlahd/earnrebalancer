import type { Position } from '../types';
import { riskLabel, riskColor } from '../utils/riskScore';

interface Props {
  position: Position;
}

function fmt(n: number, decimals = 4) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function fmtUsd(n: number) {
  if (n >= 1e6) return `$${fmt(n / 1e6, 2)}M`;
  if (n >= 1e3) return `$${fmt(n / 1e3, 2)}K`;
  return `$${fmt(n, 2)}`;
}

export function PositionCard({ position }: Props) {
  const { vault } = position;
  const risk = vault.riskScore ?? 0;
  const color = riskColor(risk);

  return (
    <div className="position-card">
      <div className="position-header">
        <div>
          <div className="vault-name">{vault.name || `${vault.protocol} ${vault.token}`}</div>
          <div className="vault-meta">
            <span className="badge">{vault.protocol}</span>
            <span className="badge badge-chain">{vault.chain}</span>
            <span className="badge badge-token">{vault.token}</span>
          </div>
        </div>
        <div className="position-value">
          <div className="value-usd">{fmtUsd(position.balanceUsd)}</div>
          <div className="value-token">
            {fmt(position.balance)} {vault.token}
          </div>
        </div>
      </div>
      <div className="position-stats">
        <div className="vault-stat">
          <span className="stat-label">APY</span>
          <span className="stat-value">{fmt(vault.apy, 2)}%</span>
        </div>
        <div className="vault-stat">
          <span className="stat-label">Pool share</span>
          <span className="stat-value">
            {(position.shareOfPool * 100).toFixed(4)}%
          </span>
        </div>
        <div className="vault-stat">
          <span className="stat-label">Risk</span>
          <span className="stat-value" style={{ color }}>
            {riskLabel(risk)} ({risk})
          </span>
        </div>
      </div>
    </div>
  );
}

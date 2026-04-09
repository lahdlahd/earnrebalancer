import type { Recommendation } from '../types';
import { riskColor, riskLabel } from '../utils/riskScore';

interface Props {
  recommendation: Recommendation;
  onExecute: (rec: Recommendation) => void;
}

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}

function Delta({ value, unit = '' }: { value: number; unit?: string }) {
  const sign = value >= 0 ? '+' : '';
  const color = value >= 0 ? '#22c55e' : '#ef4444';
  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}{fmt(value)}{unit}
    </span>
  );
}

export function RecommendationCard({ recommendation, onExecute }: Props) {
  const { currentVault, suggestedVault, apyDelta, riskDelta, reason } =
    recommendation;

  const currentRisk = currentVault.riskScore ?? 0;
  const suggestedRisk = suggestedVault.riskScore ?? 0;

  return (
    <div className="recommendation-card">
      <div className="rec-header">
        <span className="rec-title">💡 Rebalance Recommendation</span>
      </div>

      <div className="rec-body">
        <div className="rec-vault rec-current">
          <div className="rec-vault-label">Current</div>
          <div className="rec-vault-name">
            {currentVault.name || `${currentVault.protocol} ${currentVault.token}`}
          </div>
          <div className="rec-vault-stats">
            <span>APY: <strong>{fmt(currentVault.apy)}%</strong></span>
            <span style={{ color: riskColor(currentRisk) }}>
              Risk: <strong>{riskLabel(currentRisk)} ({currentRisk})</strong>
            </span>
          </div>
        </div>

        <div className="rec-arrow">→</div>

        <div className="rec-vault rec-suggested">
          <div className="rec-vault-label">Suggested</div>
          <div className="rec-vault-name">
            {suggestedVault.name ||
              `${suggestedVault.protocol} ${suggestedVault.token}`}
          </div>
          <div className="rec-vault-stats">
            <span>APY: <strong>{fmt(suggestedVault.apy)}%</strong></span>
            <span style={{ color: riskColor(suggestedRisk) }}>
              Risk: <strong>{riskLabel(suggestedRisk)} ({suggestedRisk})</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="rec-deltas">
        <div className="rec-delta-item">
          <span className="stat-label">APY change</span>
          <Delta value={apyDelta} unit="%" />
        </div>
        <div className="rec-delta-item">
          <span className="stat-label">Risk change</span>
          {/* For risk, negative delta is good */}
          <span style={{ color: riskDelta <= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
            {riskDelta >= 0 ? '+' : ''}{riskDelta} pts
          </span>
        </div>
      </div>

      {reason && <p className="rec-reason">{reason}</p>}

      <button
        className="btn btn-primary rec-execute-btn"
        onClick={() => onExecute(recommendation)}
      >
        Execute Rebalance
      </button>
    </div>
  );
}

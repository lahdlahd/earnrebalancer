import { useState } from 'react';
import { fetchLifiQuote } from '../api/lifi';
import type { LifiQuote, Recommendation } from '../types';

interface Props {
  recommendation: Recommendation;
  walletAddress: string;
  onClose: () => void;
}

export function ComposerExecute({ recommendation, walletAddress, onClose }: Props) {
  const { currentVault, suggestedVault, currentPosition } = recommendation;

  const [status, setStatus] = useState<'idle' | 'loading' | 'confirm' | 'error'>('idle');
  const [quote, setQuote] = useState<LifiQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function requestQuote() {
    setStatus('loading');
    setError(null);
    try {
      const amountWei = BigInt(
        Math.floor(currentPosition.balance * 1e18),
      ).toString();

      const q = await fetchLifiQuote({
        fromChain: currentVault.chain,
        toChain: suggestedVault.chain,
        fromToken: currentVault.token,
        toToken: suggestedVault.token,
        fromAmount: amountWei,
        fromAddress: walletAddress,
      });
      setQuote(q);
      setStatus('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }

  function confirmExecution() {
    // For MVP: no actual on-chain execution — just show success with quote ID
    setConfirmed(true);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Execute Rebalance</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="exec-summary">
            <div className="exec-route">
              <span className="exec-from">
                {currentVault.token} on {currentVault.chain}
              </span>
              <span className="exec-arrow">→</span>
              <span className="exec-to">
                {suggestedVault.token} on {suggestedVault.chain}
              </span>
            </div>
            <div className="exec-amount">
              Amount: <strong>{currentPosition.balance.toFixed(4)} {currentVault.token}</strong>
              {' '}(≈ ${currentPosition.balanceUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })})
            </div>
          </div>

          {status === 'idle' && (
            <button className="btn btn-primary" onClick={requestQuote}>
              Get Quote
            </button>
          )}

          {status === 'loading' && (
            <div className="loading-row">
              <span className="spinner" /> Fetching quote from LI.FI…
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="error-msg">{error}</div>
              <button className="btn btn-outline btn-sm" onClick={requestQuote}>
                Retry
              </button>
            </div>
          )}

          {status === 'confirm' && quote && !confirmed && (
            <div className="quote-details">
              <h3>Quote Details</h3>
              <div className="quote-grid">
                <div className="quote-row">
                  <span>Quote ID</span>
                  <code>{quote.id}</code>
                </div>
                <div className="quote-row">
                  <span>You receive (min)</span>
                  <span>
                    {(Number(quote.estimate.toAmountMin) / 1e18).toFixed(6)}{' '}
                    {suggestedVault.token}
                  </span>
                </div>
                <div className="quote-row">
                  <span>Est. duration</span>
                  <span>{quote.estimate.executionDuration}s</span>
                </div>
                {quote.estimate.feeCosts && quote.estimate.feeCosts.length > 0 && (
                  <div className="quote-row">
                    <span>Fees</span>
                    <span>
                      {quote.estimate.feeCosts
                        .map((f) => `${f.name}: $${f.amountUSD}`)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {quote.transactionRequest && (
                  <div className="quote-row tx-data">
                    <span>Tx to</span>
                    <code>{quote.transactionRequest.to}</code>
                  </div>
                )}
              </div>

              <div className="confirm-actions">
                <button className="btn btn-primary" onClick={confirmExecution}>
                  Confirm & Execute
                </button>
                <button className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmed && (
            <div className="success-panel">
              <div className="success-icon">✅</div>
              <h3>Transaction Submitted!</h3>
              <p>Quote ID: <code>{quote?.id}</code></p>
              <p className="note">
                In a production build this would send the transaction on-chain
                via your connected wallet.
              </p>
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

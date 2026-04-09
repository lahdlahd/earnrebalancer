import { useState, useMemo } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { VaultFilter } from './components/VaultFilter';
import { VaultCard } from './components/VaultCard';
import { PositionCard } from './components/PositionCard';
import { RecommendationCard } from './components/RecommendationCard';
import { ComposerExecute } from './components/ComposerExecute';
import { useVaults } from './hooks/useVaults';
import { usePositions } from './hooks/usePositions';
import type { VaultFilters, Recommendation, Vault } from './types';
import './App.css';

type Tab = 'vaults' | 'positions' | 'recommend';

function buildRecommendation(
  positions: ReturnType<typeof usePositions>['positions'],
  vaults: Vault[],
): Recommendation | null {
  if (!positions.length || !vaults.length) return null;

  // Pick the position with lowest APY as the one to improve
  const currentPosition = [...positions].sort(
    (a, b) => a.vault.apy - b.vault.apy,
  )[0];
  const currentVault = currentPosition.vault;
  const currentRisk = currentVault.riskScore ?? 50;

  // Find best vault: higher APY and acceptable risk change
  const candidates = vaults.filter(
    (v) =>
      v.id !== currentVault.id &&
      v.token === currentVault.token &&
      v.apy > currentVault.apy,
  );

  if (!candidates.length) return null;

  const suggestedVault = candidates.reduce((best, v) =>
    v.apy - (v.riskScore ?? 50) / 10 > best.apy - (best.riskScore ?? 50) / 10
      ? v
      : best,
  );

  const suggestedRisk = suggestedVault.riskScore ?? 50;

  return {
    currentVault,
    suggestedVault,
    currentPosition,
    apyDelta: suggestedVault.apy - currentVault.apy,
    riskDelta: suggestedRisk - currentRisk,
    reason: `Move ${currentVault.token} from ${currentVault.protocol} (${currentVault.apy.toFixed(2)}% APY) to ${suggestedVault.protocol} (${suggestedVault.apy.toFixed(2)}% APY) for ${(suggestedVault.apy - currentVault.apy).toFixed(2)}% more yield.`,
  };
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [tab, setTab] = useState<Tab>('vaults');
  const [filters, setFilters] = useState<VaultFilters>({});
  const [executeTarget, setExecuteTarget] = useState<Recommendation | null>(null);

  const { vaults, loading: vaultsLoading, error: vaultsError } = useVaults(filters);
  const { positions, loading: posLoading, error: posError } = usePositions(walletAddress);

  const recommendation = useMemo(
    () => buildRecommendation(positions, vaults),
    [positions, vaults],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⚡ EarnRebalancer</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn${tab === 'vaults' ? ' active' : ''}`}
            onClick={() => setTab('vaults')}
          >
            Vaults
          </button>
          <button
            className={`nav-btn${tab === 'positions' ? ' active' : ''}`}
            onClick={() => setTab('positions')}
          >
            Positions
          </button>
          <button
            className={`nav-btn${tab === 'recommend' ? ' active' : ''}`}
            onClick={() => setTab('recommend')}
          >
            Recommend
          </button>
        </nav>
        <WalletConnect
          address={walletAddress}
          onConnect={setWalletAddress}
          onDisconnect={() => setWalletAddress('')}
        />
      </header>

      <main className="app-main">
        {tab === 'vaults' && (
          <section>
            <h1>Discover Vaults</h1>
            <VaultFilter filters={filters} onChange={setFilters} />
            {vaultsError && <div className="error-msg">⚠ {vaultsError}</div>}
            {vaultsLoading ? (
              <div className="loading-row"><span className="spinner" /> Loading vaults…</div>
            ) : vaults.length === 0 ? (
              <div className="empty-state">
                No vaults found. Try adjusting your filters or check back later.
              </div>
            ) : (
              <div className="vault-grid">
                {vaults.map((v) => (
                  <VaultCard key={v.id} vault={v} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'positions' && (
          <section>
            <h1>Your Positions</h1>
            {!walletAddress ? (
              <div className="empty-state">
                Connect your wallet to view positions.
              </div>
            ) : posError ? (
              <div className="error-msg">⚠ {posError}</div>
            ) : posLoading ? (
              <div className="loading-row"><span className="spinner" /> Loading positions…</div>
            ) : positions.length === 0 ? (
              <div className="empty-state">No positions found for this wallet.</div>
            ) : (
              <div className="position-list">
                {positions.map((p) => (
                  <PositionCard key={p.vaultId} position={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'recommend' && (
          <section>
            <h1>Rebalance Recommendation</h1>
            {!walletAddress ? (
              <div className="empty-state">
                Connect your wallet to get recommendations.
              </div>
            ) : posLoading || vaultsLoading ? (
              <div className="loading-row"><span className="spinner" /> Analysing positions…</div>
            ) : !recommendation ? (
              <div className="empty-state">
                No better vault found for your current positions — you're already
                well-positioned! 🎉
              </div>
            ) : (
              <RecommendationCard
                recommendation={recommendation}
                onExecute={setExecuteTarget}
              />
            )}
          </section>
        )}
      </main>

      {executeTarget && (
        <ComposerExecute
          recommendation={executeTarget}
          walletAddress={walletAddress}
          onClose={() => setExecuteTarget(null)}
        />
      )}
    </div>
  );
}

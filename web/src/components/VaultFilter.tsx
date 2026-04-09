import { useState } from 'react';
import type { VaultFilters } from '../types';

interface Props {
  filters: VaultFilters;
  onChange: (filters: VaultFilters) => void;
}

export function VaultFilter({ filters, onChange }: Props) {
  const [local, setLocal] = useState<VaultFilters>(filters);

  function update(key: keyof VaultFilters, value: string) {
    const next: VaultFilters = { ...local };
    if (key === 'minApy' || key === 'maxRisk') {
      next[key] = value === '' ? undefined : Number(value);
    } else {
      next[key as 'chain' | 'token' | 'protocol'] = value === '' ? undefined : value;
    }
    setLocal(next);
  }

  function apply() {
    onChange(local);
  }

  function reset() {
    const empty: VaultFilters = {};
    setLocal(empty);
    onChange(empty);
  }

  return (
    <div className="vault-filter">
      <div className="filter-row">
        <div className="filter-field">
          <label>Chain</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. ethereum"
            value={local.chain ?? ''}
            onChange={(e) => update('chain', e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Token</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. USDC"
            value={local.token ?? ''}
            onChange={(e) => update('token', e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Protocol</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. aave"
            value={local.protocol ?? ''}
            onChange={(e) => update('protocol', e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Min APY (%)</label>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="0"
            value={local.minApy ?? ''}
            onChange={(e) => update('minApy', e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>Max Risk (0-100)</label>
          <input
            className="input"
            type="number"
            min={0}
            max={100}
            placeholder="100"
            value={local.maxRisk ?? ''}
            onChange={(e) => update('maxRisk', e.target.value)}
          />
        </div>
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary btn-sm" onClick={apply}>
          Apply
        </button>
        <button className="btn btn-outline btn-sm" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

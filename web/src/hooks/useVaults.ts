import { useState, useEffect, useCallback } from 'react';
import { fetchVaults } from '../api/earn';
import type { Vault, VaultFilters } from '../types';

export function useVaults(filters?: VaultFilters) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialise filters so useCallback only re-creates when values actually change
  const chain = filters?.chain;
  const token = filters?.token;
  const protocol = filters?.protocol;
  const minApy = filters?.minApy;
  const maxRisk = filters?.maxRisk;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaults({ chain, token, protocol, minApy, maxRisk });
      setVaults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [chain, token, protocol, minApy, maxRisk]);

  useEffect(() => {
    load();
  }, [load]);

  return { vaults, loading, error, refetch: load };
}

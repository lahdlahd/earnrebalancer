import { useState, useEffect, useCallback } from 'react';
import { fetchPositions } from '../api/earn';
import type { Position } from '../types';

export function usePositions(walletAddress: string) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!walletAddress) {
      setPositions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPositions(walletAddress);
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    load();
  }, [load]);

  return { positions, loading, error, refetch: load };
}

import { useEffect, useState, useCallback } from 'react';

interface FlagMap { [key: string]: boolean; }

export function useFeatureFlags(keys: string[]) {
  const [flags, setFlags] = useState<FlagMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results = await Promise.all(keys.map(async key => {
        const res = await fetch(`/api/flags/check/${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error(`Failed flag ${key}`);
        return res.json();
      }));
      const map: FlagMap = {};
      results.forEach(r => { map[r.key] = r.enabled; });
      setFlags(map);
    } catch (e: any) {
      setError(e.message || 'Flag load failed');
    } finally {
      setLoading(false);
    }
  }, [keys]);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  return { flags, loading, error, refresh: fetchFlags };
}

export function useFlag(key: string) {
  const { flags } = useFeatureFlags([key]);
  return !!flags[key];
}

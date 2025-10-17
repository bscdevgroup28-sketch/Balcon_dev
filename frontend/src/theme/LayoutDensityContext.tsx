import React, { createContext, useContext, useMemo, useState, useEffect, useCallback, ReactNode } from 'react';

export type DensityMode = 'comfortable' | 'compact';

type LayoutDensityContextValue = {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  toggleDensity: () => void;
};

const LayoutDensityContext = createContext<LayoutDensityContextValue | undefined>(undefined);

const STORAGE_KEY = 'ui_density_mode';

export function LayoutDensityProvider({ children, defaultDensity }: { children: ReactNode; defaultDensity?: DensityMode }) {
  const [density, setDensityState] = useState<DensityMode>(defaultDensity ?? 'comfortable');

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as DensityMode | null);
    if (saved === 'comfortable' || saved === 'compact') {
      setDensityState(saved);
    }
  }, []);

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleDensity = useCallback(() => {
    setDensityState(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
  }, []);

  const value = useMemo(() => ({ density, setDensity, toggleDensity }), [density, setDensity, toggleDensity]);

  return (
    <LayoutDensityContext.Provider value={value}>{children}</LayoutDensityContext.Provider>
  );
}

export function useLayoutDensity() {
  const ctx = useContext(LayoutDensityContext);
  if (!ctx) throw new Error('useLayoutDensity must be used within LayoutDensityProvider');
  return ctx;
}

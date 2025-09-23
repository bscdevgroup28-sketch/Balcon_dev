import { useEffect, useRef } from 'react';

// Simple global flag (can be replaced by feature flag system later)
declare global {
  interface Window { __PREFETCH_ENABLED__?: boolean; __FF_PREFETCH_V2__?: boolean; }
}

if (typeof window !== 'undefined' && window.__PREFETCH_ENABLED__ === undefined) {
  window.__PREFETCH_ENABLED__ = true; // default on; toggle via runtime later
}

interface PrefetchCoordinatorOptions {
  userRole?: string;
  delayMs?: number; // initial idle fallback delay
}

// Map of route chunk dynamic imports to warm (centralized copy kept here for now)
const routePrefetchers: Record<string, () => Promise<unknown>> = {
  projects: () => import('../pages/projects/ProjectsPage'),
  quotes: () => import('../pages/quotes/QuotesPage'),
  materials: () => import('../pages/materials/MaterialsPage'),
};

// Panel prefetch registry can be appended by panels exporting an optional register
type PanelKey = string;
const panelPrefetchers: Record<PanelKey, () => Promise<unknown>> = {
  // Example keys; actual panels are lazy imported already. These allow early warm.
  'pm:active-projects': () => import('../pages/dashboard/projectManagerPanels/ActiveProjectsPanel'),
  'pm:milestones': () => import('../pages/dashboard/projectManagerPanels/UpcomingMilestonesPanel'),
  'pm:team': () => import('../pages/dashboard/projectManagerPanels/TeamOverviewPanel'),
  'pm:risks': () => import('../pages/dashboard/projectManagerPanels/RiskAlertsPanel'),
};

// Lightweight idle helper with fallback
function onIdle(cb: () => void, timeout = 3000) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout });
  } else {
    setTimeout(cb, Math.min(timeout, 1500));
  }
}

export function usePrefetchCoordinator(opts: PrefetchCoordinatorOptions = {}) {
  const { userRole, delayMs = 1200 } = opts;
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

  if (!window.__PREFETCH_ENABLED__) return;
  if (window.__FF_PREFETCH_V2__ === false) return; // feature flag off

    // Network / savings gating
    const nav: any = (navigator as any).connection;
    if (nav && (nav.saveData || ['slow-2g', '2g'].includes(nav.effectiveType))) {
      return; // skip prefetch for constrained connections
    }

    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        // Do not proceed while hidden; will re-attempt when visible again
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler, { once: true });

    const controller = new AbortController();

    // Hover-trigger route prefetch (navigation side menu anchors with data-route attr)
    const hoverHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      const route = target?.getAttribute?.('data-prefetch-route');
      if (route && routePrefetchers[route] && !controller.signal.aborted) {
        routePrefetchers[route](); // fire & forget
      }
    };
    document.addEventListener('mouseover', hoverHandler);

    // IntersectionObserver for panel placeholders (elements with data-prefetch-panel)
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const panelKey = (entry.target as HTMLElement).getAttribute('data-prefetch-panel');
            if (panelKey && panelPrefetchers[panelKey]) {
              panelPrefetchers[panelKey]();
              observer?.unobserve(entry.target);
            }
          }
        });
      }, { rootMargin: '200px 0px' });
      // Attach to any existing placeholders
      document.querySelectorAll('[data-prefetch-panel]').forEach(el => observer!.observe(el));
    }

    const schedule = () => {
      if (controller.signal.aborted) return;
      onIdle(async () => {
        if (controller.signal.aborted) return;
        // Stagger route prefetches sequentially
        const order: string[] = ['projects', 'quotes', 'materials'];
        for (const key of order) {
          if (controller.signal.aborted) break;
          const prefetchFn = routePrefetchers[key];
          try {
            await prefetchFn();
          } catch (_) {
            // swallow; prefetch failure is non-fatal
          }
          await new Promise(r => setTimeout(r, 250));
        }
      });
    };

    const timer = setTimeout(schedule, delayMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
      document.removeEventListener('mouseover', hoverHandler);
      observer?.disconnect();
    };
  }, [userRole, delayMs]);
}

export default usePrefetchCoordinator;

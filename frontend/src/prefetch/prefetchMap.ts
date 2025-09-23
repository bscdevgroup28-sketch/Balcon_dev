// Central map for dynamic route/module prefetching
export const routePrefetchers: Record<string, () => Promise<unknown>> = {
  projects: () => import('../pages/projects/ProjectsPage'),
  quotes: () => import('../pages/quotes/QuotesPage'),
  materials: () => import('../pages/materials/MaterialsPage'),
};

export type RoutePrefetchKey = keyof typeof routePrefetchers;

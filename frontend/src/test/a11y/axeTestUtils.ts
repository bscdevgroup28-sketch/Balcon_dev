import { configureAxe } from 'jest-axe';

export const axe = configureAxe({
  rules: {
    // Keep contrast enabled by default; disable noisy heading-order rule for baseline
    'heading-order': { enabled: false },
  },
});

declare module 'jest-axe' {
  import { AxeResults, RunOptions } from 'axe-core';
  export interface ConfigureAxeOptions {
    rules?: Record<string, { enabled?: boolean } | boolean>;
  }
  export function configureAxe(options?: ConfigureAxeOptions): (html: HTMLElement, options?: RunOptions) => Promise<AxeResults>;
}
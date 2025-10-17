import { describe, it, expect } from '@jest/globals';
import { validateRuntime } from '../../src/config/environment';

// Validates runtime checker flags missing JWT secret.
describe('Configuration Validation Failure', () => {
  it('detects missing JWT_SECRET via validateRuntime()', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    const result = validateRuntime();
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('jwt'))).toBe(true);
    // Restore
    if (original) process.env.JWT_SECRET = original; else process.env.JWT_SECRET = 'restored-secret';
  });
});

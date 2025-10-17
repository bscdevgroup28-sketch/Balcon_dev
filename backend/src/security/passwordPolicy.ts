import zxcvbn from 'zxcvbn';

export interface PasswordPolicyResult { valid: boolean; errors: string[]; score: number; }

export function evaluatePassword(password: string): PasswordPolicyResult {
  const errors: string[] = [];
  if (password.length < 12) errors.push('Password must be at least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter required');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter required');
  if (!/\d/.test(password)) errors.push('At least one digit required');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('At least one symbol required');
  const strength = zxcvbn(password);
  if (strength.score < 3) errors.push('Password too weak (entropy score < 3)');
  return { valid: errors.length === 0, errors, score: strength.score };
}

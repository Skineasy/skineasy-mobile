import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema, resetPasswordSchema } from '@features/auth/schemas/auth.schema';

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.invalidEmail');
    }
  });

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords of min length', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 6 chars', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'abc',
      confirmPassword: 'abc',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.passwordMin');
    }
  });

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'secret123',
      confirmPassword: 'secret456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const matchIssue = result.error.issues.find(
        (i) => i.message === 'validation.passwordsDoNotMatch',
      );
      expect(matchIssue).toBeDefined();
      expect(matchIssue?.path).toEqual(['confirmPassword']);
    }
  });
});

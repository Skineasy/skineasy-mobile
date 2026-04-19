import { describe, expect, it, vi } from 'vitest';

vi.mock('@lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import * as authApi from '@features/auth/data/auth.api';

describe('authApi.requestPasswordReset', () => {
  it('resolves for any email', async () => {
    await expect(
      authApi.requestPasswordReset({ email: 'user@example.com' }),
    ).resolves.toBeUndefined();
  });

  it('resolves even for unknown email (no enumeration)', async () => {
    await expect(
      authApi.requestPasswordReset({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();
  });
});

describe('authApi.exchangeRecoveryCode', () => {
  it('resolves with a non-empty code', async () => {
    await expect(authApi.exchangeRecoveryCode('abc')).resolves.toBeUndefined();
  });

  it('rejects with an empty code', async () => {
    await expect(authApi.exchangeRecoveryCode('')).rejects.toThrow();
  });
});

describe('authApi.resetPassword', () => {
  it('resolves with a valid password', async () => {
    await expect(authApi.resetPassword({ password: 'secret123' })).resolves.toBeUndefined();
  });
});

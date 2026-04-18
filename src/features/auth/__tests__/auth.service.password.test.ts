import { describe, expect, it, vi } from 'vitest';

vi.mock('@lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
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

describe('authApi.resetPassword', () => {
  it('resolves with a non-empty token', async () => {
    await expect(
      authApi.resetPassword({ token: 'abc', password: 'secret123' }),
    ).resolves.toBeUndefined();
  });

  it('rejects with an empty token', async () => {
    await expect(authApi.resetPassword({ token: '', password: 'secret123' })).rejects.toThrow();
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('@shared/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { authService } from '@features/auth/services/auth.service';

describe('authService.requestPasswordReset (mock)', () => {
  it('resolves for any email', async () => {
    await expect(
      authService.requestPasswordReset({ email: 'user@example.com' }),
    ).resolves.toBeUndefined();
  });

  it('resolves even for unknown email (no enumeration)', async () => {
    await expect(
      authService.requestPasswordReset({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();
  });
});

describe('authService.resetPassword (mock)', () => {
  it('resolves with a non-empty token', async () => {
    await expect(
      authService.resetPassword({ token: 'abc', password: 'secret123' }),
    ).resolves.toBeUndefined();
  });

  it('rejects with an empty token', async () => {
    await expect(authService.resetPassword({ token: '', password: 'secret123' })).rejects.toThrow();
  });
});

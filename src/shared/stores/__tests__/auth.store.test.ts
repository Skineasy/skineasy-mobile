import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@shared/stores/auth.store';

// Mock storage functions
vi.mock('@shared/utils/storage', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
  setRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearAllTokens: vi.fn(),
}));

import * as storage from '@shared/utils/storage';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      token: null,
      isAuthenticated: false,
      isLoading: true,
    });
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('should set tokens and update authentication state', async () => {
    const { setTokens } = useAuthStore.getState();

    await setTokens('access-token-123', 'refresh-token-456');

    const state = useAuthStore.getState();
    expect(state.token).toBe('access-token-123');
    expect(state.isAuthenticated).toBe(true);
    expect(storage.setToken).toHaveBeenCalledWith('access-token-123');
    expect(storage.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
  });

  it('should clear auth state', async () => {
    // Set initial authenticated state
    useAuthStore.setState({
      token: 'some-token',
      isAuthenticated: true,
      isLoading: false,
    });

    const { clearAuth } = useAuthStore.getState();
    await clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(storage.clearAllTokens).toHaveBeenCalled();
  });

  it('should load token from storage', async () => {
    vi.mocked(storage.getToken).mockResolvedValue('stored-token');

    const { loadToken } = useAuthStore.getState();
    await loadToken();

    const state = useAuthStore.getState();
    expect(state.token).toBe('stored-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle no token in storage', async () => {
    vi.mocked(storage.getToken).mockResolvedValue(null);

    const { loadToken } = useAuthStore.getState();
    await loadToken();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '@shared/stores/user.store';
import type { UserProfile } from '@shared/types/user.types';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserStore.setState({
      user: null,
      hasDiagnosis: false,
    });
  });

  it('should have initial state', () => {
    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.hasDiagnosis).toBe(false);
  });

  it('should set user', () => {
    const mockUser: UserProfile = {
      id: 1,
      email: 'test@example.com',
      firstname: 'John',
      lastname: 'Doe',
      skinType: 'oily',
    };

    const { setUser } = useUserStore.getState();
    setUser(mockUser);

    const state = useUserStore.getState();
    expect(state.user).toEqual(mockUser);
  });

  it('should set hasDiagnosis', () => {
    const { setHasDiagnosis } = useUserStore.getState();
    setHasDiagnosis(true);

    const state = useUserStore.getState();
    expect(state.hasDiagnosis).toBe(true);
  });

  it('should clear user', () => {
    // Set initial state with user
    useUserStore.setState({
      user: {
        id: 1,
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      },
      hasDiagnosis: true,
    });

    const { clearUser } = useUserStore.getState();
    clearUser();

    const state = useUserStore.getState();
    expect(state.user).toBeNull();
    expect(state.hasDiagnosis).toBe(false);
  });
});

import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { t: (key: string): string => key },
}));

import { mapErrorToKey, mapErrorToMessage } from '@/lib/error-mapper';

describe('mapErrorToKey', () => {
  it('maps known error code string', () => {
    expect(mapErrorToKey('INVALID_CREDENTIALS')).toBe('auth.invalidCredentials');
  });

  it('maps Error with known message', () => {
    expect(mapErrorToKey(new Error('SESSION_EXPIRED'))).toBe('common.sessionExpired');
  });

  it('maps object with code property', () => {
    expect(mapErrorToKey({ code: 'NETWORK_ERROR' })).toBe('common.networkError');
  });

  it('returns fallback for unknown error', () => {
    expect(mapErrorToKey('UNKNOWN_CODE')).toBe('common.error');
  });

  it('returns fallback for null', () => {
    expect(mapErrorToKey(null)).toBe('common.error');
  });

  it('returns fallback for undefined', () => {
    expect(mapErrorToKey(undefined)).toBe('common.error');
  });

  it('returns fallback for number', () => {
    expect(mapErrorToKey(42)).toBe('common.error');
  });
});

describe('mapErrorToMessage', () => {
  it('returns translated key for known error', () => {
    expect(mapErrorToMessage('SERVER_ERROR')).toBe('common.serverError');
  });

  it('returns translated fallback for unknown error', () => {
    expect(mapErrorToMessage('SOMETHING_WEIRD')).toBe('common.error');
  });
});

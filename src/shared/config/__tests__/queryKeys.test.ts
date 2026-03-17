import { describe, it, expect } from 'vitest';
import { queryKeys } from '@shared/config/queryKeys';

describe('queryKeys', () => {
  it('should have user keys', () => {
    expect(queryKeys.user).toEqual(['user']);
    expect(queryKeys.userProfile()).toEqual(['user', 'profile']);
  });

  it('should have diagnosis keys', () => {
    expect(queryKeys.diagnosis).toEqual(['diagnosis']);
    expect(queryKeys.diagnosisLatest()).toEqual(['diagnosis', 'latest']);
  });

  it('should have journal keys', () => {
    expect(queryKeys.journal).toEqual(['journal']);
    expect(queryKeys.journalEntries('2024-01-15')).toEqual(['journal', 'entries', '2024-01-15']);
  });

  it('should have routine keys', () => {
    expect(queryKeys.routine).toEqual(['routine']);
  });
});

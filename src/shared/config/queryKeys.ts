export const queryKeys = {
  // User
  user: ['user'] as const,
  userProfile: () => [...queryKeys.user, 'profile'] as const,

  // Diagnosis
  diagnosis: ['diagnosis'] as const,
  diagnosisLatest: () => [...queryKeys.diagnosis, 'latest'] as const,

  // Journal
  journal: ['journal'] as const,
  journalAllEntries: () => [...queryKeys.journal, 'entries'] as const,
  journalEntries: (date: string) => [...queryKeys.journal, 'entries', date] as const,
  journalEntriesRange: (startDate: string, endDate: string) =>
    [...queryKeys.journal, 'entries', startDate, endDate] as const,
  journalSleep: (date: string) => [...queryKeys.journal, 'sleep', date] as const,
  journalSport: (date: string) => [...queryKeys.journal, 'sport', date] as const,
  journalMeal: (date: string) => [...queryKeys.journal, 'meal', date] as const,
  journalStress: (date: string) => [...queryKeys.journal, 'stress', date] as const,
  journalObservations: (date: string) => [...queryKeys.journal, 'observations', date] as const,
  sportTypes: () => [...queryKeys.journal, 'sport-types'] as const,

  // Routine
  routine: ['routine'] as const,
  routineLast: () => [...queryKeys.routine, 'last'] as const,
  routineByRspid: (rspid: string) => [...queryKeys.routine, 'rspid', rspid] as const,
} as const;

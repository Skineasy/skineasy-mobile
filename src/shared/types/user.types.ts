export interface UserProfile {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  skinType?: string;
  birthday?: string; // YYYY-MM-DD format
  avatar?: string | null;
  hasRoutineAccess?: boolean;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserState {
  user: UserProfile | null;
  hasDiagnosis: boolean;
}

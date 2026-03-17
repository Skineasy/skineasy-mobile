// Auth types
export interface AuthUser {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export interface RegisterResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export interface MeResponse {
  data: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    skinType?: string;
  };
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

// User types
export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  skinType?: string;
}

// Diagnosis types
export interface Diagnosis {
  id: string;
  skinType: string;
  concerns: string[];
  createdAt: string;
  routine: Routine;
}

export interface Routine {
  morning: RoutineStep[];
  evening: RoutineStep[];
}

export interface RoutineStep {
  order: number;
  name: string;
  product: Product;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  description: string;
  whyRecommended: string;
  prestashopId: number;
}

// Journal types
export type JournalEntryType = 'sleep' | 'nutrition' | 'sport';

export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  date: string;
  createdAt: string;
  data: SleepData | NutritionData | SportData;
}

export interface SleepData {
  quality: 1 | 2 | 3;
  hours: number;
}

export interface NutritionData {
  imageUrl: string;
  note?: string;
}

export interface SportData {
  activity: string;
  duration: number;
  note?: string;
}

// Generic API Response
export interface ApiResponse<T> {
  data: T;
}

// API Error
export interface ApiError {
  message: string;
  statusCode: number;
}

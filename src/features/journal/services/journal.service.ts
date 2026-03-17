/**
 * Journal API Service
 *
 * Handles all API requests for journal entries (sleep, sport, meal)
 * Based on BACKEND_API.md specification
 */

import { api } from '@shared/services/api';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CreateMealEntryDto,
  CreateObservationEntryDto,
  CreateSleepEntryDto,
  CreateSportEntryDto,
  CreateStressEntryDto,
  ImageUploadResponse,
  JournalWeekResponse,
  MealEntry,
  ObservationEntry,
  ObservationUpsertResponse,
  SleepEntry,
  SleepUpsertResponse,
  SportEntry,
  SportTypeInfo,
  StressEntry,
  StressUpsertResponse,
} from '@shared/types/journal.types';
import { imageUriToFormData } from '@shared/utils/image';
import { logger } from '@shared/utils/logger';

/**
 * Sleep Entry Service
 */
export const sleepService = {
  /**
   * Get sleep entries for a specific date
   * @param date - Date in YYYY-MM-DD format (e.g., "2025-01-15")
   */
  async getByDate(date: string): Promise<SleepEntry[]> {
    logger.info('[Journal API] Fetching sleep entries for date:', date);
    const response = await api.get<ApiResponse<SleepEntry[]>>(
      `/api/v1/journal/sleeps?date=${encodeURIComponent(date)}`,
    );
    return response.data;
  },

  /**
   * Create or update sleep entry (upsert)
   * @param dto - Sleep entry data
   * @returns Created or updated sleep entry + created flag
   */
  async upsert(dto: CreateSleepEntryDto): Promise<SleepUpsertResponse> {
    logger.info('[Journal API] Upserting sleep entry:', dto);
    const response = await api.put<ApiResponse<SleepUpsertResponse>>(
      '/api/v1/journal/sleep/upsert',
      dto,
    );
    return response.data;
  },

  /**
   * Delete sleep entry by ID
   * @param id - Sleep entry ID
   */
  async delete(id: number): Promise<void> {
    logger.info('[Journal API] Deleting sleep entry:', id);
    await api.delete(`/api/v1/journal/sleep/${id}`);
  },
};

/**
 * Sport Entry Service
 */
export const sportService = {
  /**
   * Get sport entries for a specific date
   * @param date - Date in YYYY-MM-DD format (e.g., "2025-01-15")
   */
  async getByDate(date: string): Promise<SportEntry[]> {
    logger.info('[Journal API] Fetching sport entries for date:', date);
    const response = await api.get<ApiResponse<SportEntry[]>>(
      `/api/v1/journal/sports?date=${encodeURIComponent(date)}`,
    );
    return response.data;
  },

  /**
   * Create a new sport entry
   * @param dto - Sport entry data
   */
  async create(dto: CreateSportEntryDto): Promise<SportEntry> {
    logger.info('[Journal API] Creating sport entry:', dto);
    const response = await api.post<ApiResponse<SportEntry>>('/api/v1/journal/sport', dto);
    return response.data;
  },

  /**
   * Update a sport entry
   * @param id - Sport entry ID
   * @param dto - Updated sport entry data
   */
  async update(id: number, dto: Partial<CreateSportEntryDto>): Promise<SportEntry> {
    logger.info('[Journal API] Updating sport entry:', { id, dto });
    const response = await api.put<ApiResponse<SportEntry>>(`/api/v1/journal/sport/${id}`, dto);
    return response.data;
  },

  /**
   * Delete sport entry by ID
   * @param id - Sport entry ID
   */
  async delete(id: number): Promise<void> {
    logger.info('[Journal API] Deleting sport entry:', id);
    await api.delete(`/api/v1/journal/sport/${id}`);
  },
};

/**
 * Meal Entry Service
 */
export const mealService = {
  /**
   * Get meal entries for a specific date
   * @param date - Date in YYYY-MM-DD format (e.g., "2025-01-15")
   */
  async getByDate(date: string): Promise<MealEntry[]> {
    logger.info('[Journal API] Fetching meal entries for date:', date);
    const response = await api.get<ApiResponse<MealEntry[]>>(
      `/api/v1/journal/meals?date=${encodeURIComponent(date)}`,
    );
    return response.data;
  },

  /**
   * Upload a meal image
   * @param imageUri - Local URI of the compressed image
   * @param onProgress - Optional callback for upload progress (0-100)
   * @returns URL of the uploaded image
   */
  async uploadImage(imageUri: string, onProgress?: (progress: number) => void): Promise<string> {
    logger.info('[Journal API] Uploading meal image');

    const formData = imageUriToFormData(imageUri, 'image');

    const response = await api.postFormData<ApiResponse<ImageUploadResponse>>(
      '/api/v1/journal/meal/upload',
      formData,
      { onProgress },
    );

    logger.info('[Journal API] Image uploaded successfully:', response.data.url);
    return response.data.url;
  },

  /**
   * Create a new meal entry
   * @param dto - Meal entry data
   */
  async create(dto: CreateMealEntryDto): Promise<MealEntry> {
    logger.info('[Journal API] Creating meal entry:', dto);
    const response = await api.post<ApiResponse<MealEntry>>('/api/v1/journal/meal', dto);
    return response.data;
  },

  /**
   * Update a meal entry
   * @param id - Meal entry ID
   * @param dto - Updated meal entry data
   */
  async update(id: number, dto: Partial<CreateMealEntryDto>): Promise<MealEntry> {
    logger.info('[Journal API] Updating meal entry:', { id, dto });
    const response = await api.put<ApiResponse<MealEntry>>(`/api/v1/journal/meal/${id}`, dto);
    return response.data;
  },

  /**
   * Delete meal entry by ID
   * @param id - Meal entry ID
   */
  async delete(id: number): Promise<void> {
    logger.info('[Journal API] Deleting meal entry:', id);
    await api.delete(`/api/v1/journal/meal/${id}`);
  },
};

/**
 * Sport Types Service
 */
export const sportTypesService = {
  /**
   * Get all available sport types from backend
   * @returns Array of sport type info objects with id, name, created_at
   */
  async getAll(): Promise<SportTypeInfo[]> {
    logger.info('[Journal API] Fetching sport types');

    const response = await api.get<ApiResponse<SportTypeInfo[]>>('/api/v1/sport-types');

    logger.info(`[Journal API] Fetched ${response.data.length} sport types`);
    return response.data;
  },
};

/**
 * Stress Entry Service
 */
export const stressService = {
  async getByDate(date: string): Promise<StressEntry[]> {
    logger.info('[Journal API] Fetching stress entries for date:', date);
    const response = await api.get<ApiResponse<StressEntry[]>>(
      `/api/v1/journal/stresses?date=${encodeURIComponent(date)}`,
    );
    return response.data;
  },

  async upsert(dto: CreateStressEntryDto): Promise<StressUpsertResponse> {
    logger.info('[Journal API] Upserting stress entry:', dto);
    const response = await api.put<ApiResponse<StressUpsertResponse>>(
      '/api/v1/journal/stress/upsert',
      dto,
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    logger.info('[Journal API] Deleting stress entry:', id);
    await api.delete(`/api/v1/journal/stress/${id}`);
  },
};

/**
 * Observation Entry Service
 */
export const observationsService = {
  async getByDate(date: string): Promise<ObservationEntry[]> {
    logger.info('[Journal API] Fetching observations for date:', date);
    const response = await api.get<ApiResponse<ObservationEntry[]>>(
      `/api/v1/journal/observations?date=${encodeURIComponent(date)}`,
    );
    return response.data;
  },

  async upsert(dto: CreateObservationEntryDto): Promise<ObservationUpsertResponse> {
    logger.info('[Journal API] Upserting observation entry:', dto);
    const response = await api.put<ApiResponse<ObservationUpsertResponse>>(
      '/api/v1/journal/observations/upsert',
      dto,
    );
    return response.data;
  },

  async delete(id: number): Promise<void> {
    logger.info('[Journal API] Deleting observation entry:', id);
    await api.delete(`/api/v1/journal/observations/${id}`);
  },
};

/**
 * Batch Entries Service
 */
export const entriesService = {
  /**
   * Get all journal entries for a date range (batch endpoint)
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format (max 14 days range)
   */
  async getByDateRange(startDate: string, endDate: string): Promise<JournalWeekResponse> {
    logger.info('[Journal API] Fetching entries for range:', { startDate, endDate });
    const response = await api.get<ApiResponse<JournalWeekResponse>>(
      `/api/v1/journal/entries?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
    );
    return response.data;
  },
};

/**
 * Combined Journal Service
 */
export const journalService = {
  sleep: sleepService,
  sport: sportService,
  meal: mealService,
  stress: stressService,
  observations: observationsService,
  sportTypes: sportTypesService,
  entries: entriesService,
};

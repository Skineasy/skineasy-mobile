/**
 * Sport Type Mapping Utility
 *
 * Centralized mapping between backend sport types and frontend i18n keys + icons.
 * This ensures consistency and catches missing translations/icons at runtime.
 *
 * IMPORTANT: When backend adds a new sport type, you MUST:
 * 1. Add entry to SPORT_TYPE_CONFIG below
 * 2. Add translations to en.json and fr.json
 * 3. The validation will catch missing translations in DEV mode
 */

import { logger } from '@shared/utils/logger';
import type { TFunction } from 'i18next';

/**
 * Sport Type Configuration
 * Maps backend sport type ID to i18n key and icon name
 */
interface SportTypeConfig {
  i18nKey: string;
  iconName: string; // Lucide icon name
  popular?: boolean; // Show in quick select chips
}

/**
 * Centralized Sport Type Configuration
 * SINGLE SOURCE OF TRUTH for all sport types
 */

const namespace = 'journal.sport.activities';
export const SPORT_TYPE_CONFIG: Record<string, SportTypeConfig> = {
  running: {
    i18nKey: `${namespace}.running`,
    iconName: 'activity',
    popular: true,
  },
  cycling: {
    i18nKey: `${namespace}.cycling`,
    iconName: 'bike',
    popular: true,
  },
  yoga: {
    i18nKey: `${namespace}.yoga`,
    iconName: 'heart',
    popular: true,
  },
  strength: {
    i18nKey: `${namespace}.strength`,
    iconName: 'dumbbell',
    popular: true,
  },
  swimming: {
    i18nKey: `${namespace}.swimming`,
    iconName: 'waves',
    popular: true,
  },
  cardio: {
    i18nKey: `${namespace}.cardio`,
    iconName: 'heart-pulse',
  },
  pilates: {
    i18nKey: `${namespace}.pilates`,
    iconName: 'stretch-horizontal',
  },
  hiking: {
    i18nKey: `${namespace}.hiking`,
    iconName: 'mountain',
  },
  dancing: {
    i18nKey: `${namespace}.dancing`,
    iconName: 'music',
  },
  other: {
    i18nKey: `${namespace}.other`,
    iconName: 'circle-ellipsis',
  },
};

/**
 * Validation result for sport type mappings
 */
interface ValidationResult {
  valid: boolean;
  missingConfig: string[]; // Sport types without config
  missingTranslations: string[]; // Sport types with config but no translation
  total: number;
  configured: number;
}

/**
 * Get translated label for a sport type
 *
 * @param sportType - Backend sport type ID (e.g., "running")
 * @param t - i18next translation function
 * @returns Translated label or fallback
 */
export function getSportTypeLabel(sportType: string, t: TFunction): string {
  const config = SPORT_TYPE_CONFIG[sportType];

  // Missing config - log warning and use fallback
  if (!config) {
    logger.warn(`[SportMapping] Missing config for sport type: "${sportType}"`);
    return capitalizeFirst(sportType);
  }

  const translation = t(config.i18nKey);

  // Check if translation exists (i18next returns key if missing)
  if (translation === config.i18nKey) {
    logger.warn(`[SportMapping] Missing translation for key: "${config.i18nKey}"`);
    return capitalizeFirst(sportType);
  }

  return translation;
}

/**
 * Get icon name for a sport type
 *
 * @param sportType - Backend sport type ID
 * @returns Lucide icon name or default
 */
export function getSportTypeIcon(sportType: string): string {
  const config = SPORT_TYPE_CONFIG[sportType];

  if (!config) {
    logger.warn(`[SportMapping] Missing icon config for sport type: "${sportType}"`);
    return 'circle'; // Default icon
  }

  return config.iconName;
}

/**
 * Check if sport type should be shown in quick select chips
 *
 * @param sportType - Backend sport type ID
 * @returns True if popular
 */
export function isSportTypePopular(sportType: string): boolean {
  return SPORT_TYPE_CONFIG[sportType]?.popular ?? false;
}

/**
 * Get all popular sport types
 *
 * @param sportTypes - All sport types from backend
 * @returns Filtered list of popular sport types
 */
export function getPopularSportTypes(sportTypes: string[]): string[] {
  return sportTypes.filter((type) => isSportTypePopular(type));
}

/**
 * Validate sport type mappings
 * Checks that all backend sport types have config + translations
 *
 * @param sportTypes - Sport types from backend
 * @param t - i18next translation function
 * @returns Validation result
 */
export function validateSportMappings(sportTypes: string[], t: TFunction): ValidationResult {
  const missingConfig: string[] = [];
  const missingTranslations: string[] = [];

  sportTypes.forEach((type) => {
    const config = SPORT_TYPE_CONFIG[type];

    // Check if config exists
    if (!config) {
      missingConfig.push(type);
      return;
    }

    // Check if translation exists
    const translation = t(config.i18nKey);
    if (translation === config.i18nKey) {
      missingTranslations.push(type);
    }
  });

  const valid = missingConfig.length === 0 && missingTranslations.length === 0;

  // Log errors in DEV mode
  if (!valid) {
    logger.group('[SportMapping] Validation Failed');

    if (missingConfig.length > 0) {
      logger.error('Missing config for sport types:', missingConfig);
      logger.info('Add to SPORT_TYPE_CONFIG in src/features/journal/utils/sportMapping.ts');
    }

    if (missingTranslations.length > 0) {
      logger.error('Missing translations for sport types:', missingTranslations);
      logger.info('Add to en.json and fr.json:');
      missingTranslations.forEach((type) => {
        const config = SPORT_TYPE_CONFIG[type];
        if (config) {
          logger.info(`  "${config.i18nKey}": "Your Translation"`);
        }
      });
    }

    logger.groupEnd();
  }

  return {
    valid,
    missingConfig,
    missingTranslations,
    total: sportTypes.length,
    configured: sportTypes.length - missingConfig.length,
  };
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get sport type with metadata for UI rendering
 */
export interface SportTypeWithMetadata {
  id: string; // Sport type name (e.g., "running")
  label: string; // Translated label
  icon: string; // Lucide icon name
  popular: boolean; // Show in quick select
  backendId: number; // Backend database ID
}

/**
 * Transform backend sport types to UI-ready format
 *
 * @param sportTypes - Sport type info objects from backend
 * @param t - i18next translation function
 * @returns Sport types with labels, icons, and backend IDs
 */
export function enrichSportTypes(
  sportTypes: Array<{ id: number; name: string }>,
  t: TFunction,
): SportTypeWithMetadata[] {
  return sportTypes.map((sportType) => ({
    id: sportType.name,
    label: getSportTypeLabel(sportType.name, t),
    icon: getSportTypeIcon(sportType.name),
    popular: isSportTypePopular(sportType.name),
    backendId: sportType.id,
  }));
}

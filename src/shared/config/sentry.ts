import * as Sentry from '@sentry/react-native';
import { ENV } from '@shared/config/env';
import { logger } from '@shared/utils/logger';

export { Sentry };

export function initSentry(): void {
  if (!ENV.SENTRY_DSN) {
    logger.warn('[Sentry] SENTRY_DSN not found - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 10000,
    enabled: !__DEV__,
  });

  logger.info('[Sentry] Initialized successfully');
}

export function captureException(
  error: unknown,
  context?: Record<string, Record<string, unknown>>,
): void {
  logger.error('[Sentry] Capturing exception:', error);
  Sentry.captureException(error, context ? { contexts: context } : undefined);
}

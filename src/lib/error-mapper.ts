import i18n from 'i18next';

const ERROR_MAP: Record<string, string> = {
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  EMAIL_ALREADY_EXISTS: 'auth.emailAlreadyExists',
  SESSION_EXPIRED: 'common.sessionExpired',
  NETWORK_ERROR: 'common.networkError',
  NOT_FOUND: 'common.notFound',
  VALIDATION_ERROR: 'common.validationError',
  SERVER_ERROR: 'common.serverError',
};

const FALLBACK_KEY = 'common.error';

export function mapErrorToMessage(error: unknown): string {
  const code = extractErrorCode(error);
  const key = ERROR_MAP[code] ?? FALLBACK_KEY;
  return i18n.t(key);
}

export function mapErrorToKey(error: unknown): string {
  const code = extractErrorCode(error);
  return ERROR_MAP[code] ?? FALLBACK_KEY;
}

function extractErrorCode(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (isErrorWithCode(error)) return error.code;
  return '';
}

function isErrorWithCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

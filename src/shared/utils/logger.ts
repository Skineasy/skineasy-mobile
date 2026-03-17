const enabled = __DEV__;

const timestamp = (): string => {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
};

const debug = (message: string, ...args: unknown[]): void => {
  if (!enabled) return;
  console.log(`[${timestamp()}] [DEBUG] ${message}`, ...args);
};

const info = (message: string, ...args: unknown[]): void => {
  if (!enabled) return;
  console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
};

const warn = (message: string, ...args: unknown[]): void => {
  if (!enabled) return;
  console.warn(`[${timestamp()}] [WARN] ${message}`, ...args);
};

const error = (message: string, ...args: unknown[]): void => {
  if (!enabled) return;
  console.error(`[${timestamp()}] [ERROR] ${message}`, ...args);
};

const group = (label: string): void => {
  if (!enabled) return;
  console.group(label);
};

const groupEnd = (): void => {
  if (!enabled) return;
  console.groupEnd();
};

export const logger = {
  debug,
  info,
  warn,
  error,
  group,
  groupEnd,
};

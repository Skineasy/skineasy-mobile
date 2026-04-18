import { toast as sonnerToast } from 'sonner-native';

import { haptic } from '@shared/utils/haptic';

interface ToastOptions {
  haptic?: boolean;
}

export const toast = {
  success(message: string, description?: string, options: ToastOptions = {}): void {
    if (options.haptic !== false) haptic.success();
    sonnerToast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string, options: ToastOptions = {}): void {
    if (options.haptic !== false) haptic.error();
    sonnerToast.error(message, description ? { description } : undefined);
  },
};

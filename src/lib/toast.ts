import { toast as sonnerToast } from 'sonner-native';

import { haptic } from '@shared/utils/haptic';

export const toast = {
  success(message: string, description?: string): void {
    haptic.success();
    sonnerToast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string): void {
    haptic.error();
    sonnerToast.error(message, description ? { description } : undefined);
  },
};

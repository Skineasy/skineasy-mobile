import { logger } from '@shared/utils/logger';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';

type ImpactLevel = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'error' | 'warning';

const IMPACT_MAP: Record<ImpactLevel, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_MAP: Record<NotificationType, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  error: Haptics.NotificationFeedbackType.Error,
  warning: Haptics.NotificationFeedbackType.Warning,
};

const impact = (level: ImpactLevel): void => {
  if (!IS_NATIVE) return;
  try {
    Haptics.impactAsync(IMPACT_MAP[level]);
  } catch (err) {
    logger.warn('[Haptic] Impact failed:', err);
  }
};

const selection = (): void => {
  if (!IS_NATIVE) return;
  try {
    Haptics.selectionAsync();
  } catch (err) {
    logger.warn('[Haptic] Selection failed:', err);
  }
};

const notification = (type: NotificationType): void => {
  if (!IS_NATIVE) return;
  try {
    Haptics.notificationAsync(NOTIFICATION_MAP[type]);
  } catch (err) {
    logger.warn('[Haptic] Notification failed:', err);
  }
};

export const haptic = {
  impact,
  selection,
  notification,
  heavy: (): void => impact('heavy'),
  medium: (): void => impact('medium'),
  light: (): void => impact('light'),
  success: (): void => notification('success'),
  error: (): void => notification('error'),
  warning: (): void => notification('warning'),
};

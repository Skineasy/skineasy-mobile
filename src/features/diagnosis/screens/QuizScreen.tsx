import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';

import { Pressable } from '@shared/components/pressable';
import { queryKeys } from '@shared/config/queryKeys';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';
import { useUserStore } from '@shared/stores/user.store';
import { haptic } from '@shared/utils/haptic';
import { logger } from '@shared/utils/logger';
import { routineStorage } from '@shared/utils/routineStorage';
import { colors } from '@theme/colors';

const TYPEFORM_BASE_URL = 'https://form.typeform.com/to/XOEB81yk';
// Typeform redirects here after completion - app intercepts this URL to extract rspid
const TYPEFORM_REDIRECT_PATTERN = 'skineasy.com/app/quiz-complete';

export default function QuizScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const setHasDiagnosis = useUserStore((state) => state.setHasDiagnosis);
  const setRspid = useUserStore((state) => state.setRspid);
  const animStyles = useEntranceAnimation(2);

  const webViewRef = useRef<WebView>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Build Typeform URL with hidden fields
  const typeformUrl = `${TYPEFORM_BASE_URL}?email=${encodeURIComponent(user?.email || '')}&firstname=${encodeURIComponent(user?.firstname || '')}&lastname=${encodeURIComponent(user?.lastname || '')}`;

  // Handle completion with rspid
  const handleCompletionWithRspid = useCallback(
    async (rspid: string) => {
      if (isCompleted) return;
      setIsCompleted(true);
      haptic.success();

      logger.info('[QuizScreen] Quiz completed with rspid:', rspid);

      // Invalidate diagnosis queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.diagnosis });

      // Save routineReadyAt for tomorrow 9am
      const readyAt = routineStorage.getNextMorning9am();
      await routineStorage.setReadyAt(readyAt);
      logger.info('[QuizScreen] Routine ready at:', readyAt.toISOString());

      // Update user store with rspid (also sets routineStatus to 'processing')
      setRspid(rspid);
      setHasDiagnosis(true);

      // Show processing popup
      Alert.alert(t('routine.processingTitle'), t('routine.processingMessage'), [
        { text: t('common.ok') },
      ]);

      // Navigate back
      router.back();
    },
    [isCompleted, queryClient, router, setHasDiagnosis, setRspid, t],
  );

  // Detect form completion via URL changes (redirect to our custom page)
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url } = navState;
      logger.info('[QuizScreen] Navigation:', url);

      // Detect Typeform redirect with rspid
      if (url.includes(TYPEFORM_REDIRECT_PATTERN)) {
        try {
          const urlObj = new URL(url);
          const rspid = urlObj.searchParams.get('rspid');

          if (rspid) {
            handleCompletionWithRspid(rspid);
          }
        } catch (error) {
          logger.error('[QuizScreen] Failed to parse redirect URL:', error);
        }
      }
    },
    [handleCompletionWithRspid],
  );

  // Handle close button press with confirmation
  const handleClose = useCallback(() => {
    if (isCompleted) {
      router.replace('/');
      return;
    }

    // Show confirmation dialog
    Alert.alert(t('diagnosis.exitConfirmTitle'), t('diagnosis.exitConfirmMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('diagnosis.exitConfirm'),
        style: 'destructive',
        onPress: () => {
          haptic.medium();
          router.replace('/');
        },
      },
    ]);
  }, [isCompleted, router, t]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with close button */}
      <Animated.View
        style={animStyles[0]}
        className="flex-row items-center justify-end px-4 pt-2 pb-4"
      >
        <Pressable
          onPress={handleClose}
          haptic="light"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface shadow-md"
          accessibilityLabel={t('common.close')}
        >
          <X size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* WebView */}
      <Animated.View style={animStyles[1]} className="flex-1">
        <WebView
          ref={webViewRef}
          source={{ uri: typeformUrl }}
          className="flex-1"
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          onNavigationStateChange={handleNavigationStateChange}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-background">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

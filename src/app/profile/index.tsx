import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Bug,
  ChevronRight,
  Download,
  FileText,
  Languages,
  Lock,
  LogOut,
  Shield,
  Trash2,
  UserPen,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Text, View } from 'react-native';

import { HealthKitSyncButton } from '@features/healthkit/components/HealthKitSyncButton';
import { useDeleteAccount } from '@features/profile/hooks/useDeleteAccount';
import * as Sentry from '@sentry/react-native';
import { checkAndApplyUpdate } from '@shared/hooks/useAppUpdates';
import { Avatar } from '@shared/components/avatar';
import { Pressable } from '@shared/components/pressable';
import { ScreenHeader } from '@shared/components/screen-header';
import { useAuthStore } from '@shared/stores/auth.store';
import { useUserStore } from '@shared/stores/user.store';
import { colors } from '@theme/colors';

function ErrorBoundaryTestButton(): React.ReactElement {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test ErrorBoundary crash from DEV mode');
  }

  return (
    <Pressable
      onPress={() => setShouldThrow(true)}
      haptic="light"
      className="flex-row items-center justify-between p-4"
    >
      <View className="flex-row items-center gap-3">
        <AlertTriangle size={20} color={colors.warning} />
        <Text className="text-base text-warning">Test ErrorBoundary (DEV only)</Text>
      </View>
    </Pressable>
  );
}

function CheckUpdatesButton(): React.ReactElement {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckUpdates = async (): Promise<void> => {
    setIsChecking(true);
    const result = await checkAndApplyUpdate();
    setIsChecking(false);
    Alert.alert('Updates', result);
  };

  return (
    <Pressable
      onPress={handleCheckUpdates}
      haptic="light"
      disabled={isChecking}
      className="flex-row items-center justify-between p-4"
    >
      <View className="flex-row items-center gap-3">
        <Download size={20} color={colors.warning} />
        <Text className="text-base text-warning">
          {isChecking ? 'Checking...' : 'Check for Updates (DEV only)'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ProfileScreen(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();

  const currentLanguage =
    i18n.language === 'fr' ? t('profile.languageFrench') : t('profile.languageEnglish');

  const handleLanguageChange = (): void => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = (): void => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutConfirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          clearUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = (): void => {
    if (isDeleting) return;

    Alert.alert(t('profile.deleteAccountTitle'), t('profile.deleteAccountConfirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteAccount();
        },
      },
    ]);
  };

  const openUrl = (url: string): void => {
    Linking.openURL(url);
  };

  const handleTestSentry = (): void => {
    Alert.alert(
      'Test Sentry Error Tracking',
      'This will send a test error to Sentry. Choose a test type:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Test Error',
          onPress: () => {
            Sentry.captureException(new Error('Test error from DEV mode'));
            Alert.alert('Success', 'Test error sent to Sentry!');
          },
        },
        {
          text: 'Test Message',
          onPress: () => {
            Sentry.captureMessage('Test message from DEV mode', 'info');
            Alert.alert('Success', 'Test message sent to Sentry!');
          },
        },
      ],
    );
  };

  return (
    <ScreenHeader title={t('profile.title')} edges={['top']}>
      {/* Avatar */}
      {!!user && (
        <View className="items-center mb-6">
          <Avatar
            avatar={user.avatar}
            firstname={user.firstname}
            lastname={user.lastname}
            email={user.email}
            size={80}
          />
        </View>
      )}

      {/* User Info */}
      {!!user && (
        <View className="mb-8 items-center">
          <Text className="text-lg font-medium text-text">
            {user?.firstname} {user?.lastname}
          </Text>
          <Text className="text-sm text-textMuted">{user?.email}</Text>
          {user?.skinType && (
            <Text className="text-sm text-primary mt-1">
              {t('profile.skinType')}: {user.skinType}
            </Text>
          )}
        </View>
      )}

      {/* Menu Items */}
      <View className="bg-surface mb-4 -mx-4">
        <Pressable
          onPress={() => router.push('/profile/edit')}
          haptic="medium"
          className="flex-row items-center justify-between p-4 border-b border-border"
        >
          <View className="flex-row items-center gap-3">
            <UserPen size={20} color={colors.primary} />
            <Text className="text-base text-text">{t('profile.editProfile')}</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={handleLanguageChange}
          haptic="light"
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-row items-center gap-3">
            <Languages size={20} color={colors.primary} />
            <Text className="text-base text-text">{t('profile.language')}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-text-muted">{currentLanguage}</Text>
            <ChevronRight size={20} color={colors.textMuted} />
          </View>
        </Pressable>
      </View>

      {/* Legal Section */}
      <View className="bg-surface mb-4 -mx-4">
        <Pressable
          onPress={() => openUrl(t('profile.termsOfSaleUrl'))}
          haptic="medium"
          className="flex-row items-center justify-between p-4 border-b border-border"
        >
          <View className="flex-row items-center gap-3">
            <FileText size={20} color={colors.primary} />
            <Text className="text-base text-text">{t('profile.termsOfSale')}</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => openUrl(t('profile.termsOfUseUrl'))}
          haptic="medium"
          className="flex-row items-center justify-between p-4 border-b border-border"
        >
          <View className="flex-row items-center gap-3">
            <Shield size={20} color={colors.primary} />
            <Text className="text-base text-text">{t('profile.termsOfUse')}</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => openUrl(t('profile.privacyPolicyUrl'))}
          haptic="medium"
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-row items-center gap-3">
            <Lock size={20} color={colors.primary} />
            <Text className="text-base text-text">{t('profile.privacyPolicy')}</Text>
          </View>
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Account Actions */}
      <View className="bg-surface -mx-4">
        <Pressable
          onPress={handleLogout}
          haptic="heavy"
          className="flex-row items-center justify-between p-4 border-b border-border"
        >
          <View className="flex-row items-center gap-3">
            <LogOut size={20} color={colors.error} />
            <Text className="text-base text-error">{t('profile.logout')}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          haptic="heavy"
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-row items-center gap-3">
            <Trash2 size={20} color={colors.error} />
            <Text className="text-base text-error">{t('profile.deleteAccount')}</Text>
          </View>
        </Pressable>
      </View>

      {/* DEV Only - Test Buttons */}
      {__DEV__ && (
        <View className="bg-surface mt-4 mb-8 -mx-4">
          <HealthKitSyncButton />
          <Pressable
            onPress={handleTestSentry}
            haptic="light"
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <View className="flex-row items-center gap-3">
              <Bug size={20} color={colors.warning} />
              <Text className="text-base text-warning">Test Sentry (DEV only)</Text>
            </View>
          </Pressable>
          <ErrorBoundaryTestButton />
          <CheckUpdatesButton />
        </View>
      )}
    </ScreenHeader>
  );
}

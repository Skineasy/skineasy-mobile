import { useRouter } from 'expo-router';
import { ListChecks, Sparkles, Sun } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Text, View } from 'react-native';

import assets from 'assets';

import { Button } from '@shared/components/button';
import { SectionHeader } from '@shared/components/section-header';
import { useUserStore } from '@shared/stores/user.store';

function TeaserBanner(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={assets.bubbleRoutine}
      className="rounded-2xl overflow-hidden p-5"
      imageStyle={{ borderRadius: 16, opacity: 0.8 }}
    >
      <View className="gap-3">
        <Text className="text-xl font-bold text-brown-dark">
          {t('dashboard.routine.teaser.title')}
        </Text>
        <Text className="text-base text-brown-dark leading-6">
          {t('dashboard.routine.teaser.description')}
        </Text>
      </View>
    </ImageBackground>
  );
}

function RoutineReadyBanner({ onPress }: { onPress?: () => void }): React.ReactElement {
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={assets.bubbleRoutine}
      className="rounded-2xl overflow-hidden p-5"
      imageStyle={{ borderRadius: 16, opacity: 0.8 }}
    >
      <View className="gap-3">
        <Text className="text-xl font-bold text-brown-dark">{t('dashboard.routine.title')}</Text>
        <Text className="text-base text-brown-dark leading-6">
          {t('dashboard.routine.description')}
        </Text>
        <Button
          title={t('dashboard.routine.discover')}
          iconLeft={ListChecks}
          className="mt-4 rounded-full"
          onPress={onPress}
        />
      </View>
    </ImageBackground>
  );
}

function QuizBanner({ onPress }: { onPress?: () => void }): React.ReactElement {
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={assets.bubbleRoutine}
      className="rounded-2xl overflow-hidden p-5"
      imageStyle={{ borderRadius: 16, opacity: 0.8 }}
    >
      <View className="gap-3">
        <Text className="text-xl font-bold text-brown-dark">{t('dashboard.quiz.title')}</Text>
        <Text className="text-base text-brown-dark leading-6">{t('dashboard.quiz.subtitle')}</Text>
        <Button
          title={t('diagnosis.start')}
          iconLeft={Sparkles}
          className="mt-4 rounded-full"
          onPress={onPress}
        />
      </View>
    </ImageBackground>
  );
}

export function RoutineBannerContainer(): React.ReactElement | null {
  const { t } = useTranslation();
  const router = useRouter();
  const routineStatus = useUserStore((state) => state.routineStatus);
  const hasRoutineAccess = useUserStore((state) => state.hasRoutineAccess);

  if (hasRoutineAccess && routineStatus === 'processing') {
    return null;
  }

  const handlePress = (): void => {
    if (routineStatus === 'none') {
      router.push('/diagnosis/quiz');
    } else {
      router.push('/routine');
    }
  };

  const renderBanner = (): React.ReactElement => {
    if (!hasRoutineAccess) return <TeaserBanner />;
    if (routineStatus === 'none') return <QuizBanner onPress={handlePress} />;
    return <RoutineReadyBanner onPress={handlePress} />;
  };

  return (
    <View>
      <SectionHeader className="px-4" icon={Sun} title={t('routine.title')} />
      <View className="px-4">{renderBanner()}</View>
    </View>
  );
}

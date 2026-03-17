import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Pressable } from '@shared/components/pressable';
import { useEntranceAnimation } from '@shared/hooks/useEntranceAnimation';
import { colors } from '@theme/colors';

export default function PasswordRecoveryScreen() {
  const router = useRouter();
  const animStyles = useEntranceAnimation(2);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Animated.View style={animStyles[0]} className="w-full px-4 pt-2 pb-4">
        <Pressable
          onPress={() => router.back()}
          haptic="light"
          className="w-10 h-10 items-center justify-center bg-surface rounded-full shadow-md"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      <Animated.View style={animStyles[1]} className="flex-1">
        <WebView
          source={{ uri: 'https://skineasy.com/password-recovery' }}
          className="flex-1"
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

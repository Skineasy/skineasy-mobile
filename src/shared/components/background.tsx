import assets from '@assets';
import { colors } from '@theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';

type BackgroundVariant = 'default' | 'fullBubble' | 'topBubble' | 'brownGradient';

interface BackgroundProps {
  variant?: BackgroundVariant;
  children: React.ReactNode;
}

export function Background({ variant = 'default', children }: BackgroundProps): React.ReactElement {
  if (variant === 'fullBubble') {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#F4E9E000', colors.background]}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={assets.bubbleBackground}
          style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {children}
      </View>
    );
  }

  if (variant === 'topBubble') {
    return (
      <View className="flex-1 bg-background">
        <Image
          source={assets.bubbleHeader}
          className="absolute top-0 left-0 right-0 w-full"
          resizeMode="contain"
        />
        {children}
      </View>
    );
  }

  if (variant === 'brownGradient') {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={[colors.brownLight, colors.brownDark]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return <View className="flex-1 bg-background">{children}</View>;
}

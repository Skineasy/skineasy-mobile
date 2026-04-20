import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Pressable as RNPressable, StyleSheet } from 'react-native';

import { colors } from '@theme/colors';

import { FAB_DIAMETER, FAB_RADIUS } from './constants';

type FabProps = {
  onPress: () => void;
};

export function Fab({ onPress }: FabProps): React.ReactElement {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.base}
    >
      <RNPressable onPress={onPress} style={styles.hit}>
        <Plus color={colors.white} size={28} strokeWidth={2.5} />
      </RNPressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    width: FAB_DIAMETER,
    height: FAB_DIAMETER,
    borderRadius: FAB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  hit: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FAB_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

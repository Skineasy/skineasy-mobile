import { type LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { cn } from '@shared/utils/cn';
import { colors } from '@theme/colors';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  className,
}: SectionHeaderProps): React.ReactElement {
  return (
    <View className={cn('flex-row items-center gap-2 px-4 mb-5', className)}>
      <View
        className="p-2 rounded-md items-center justify-center border border-brown-dark/20"
        style={{ backgroundColor: colors.brownDark + '0a' }}
      >
        <Icon size={16} color={colors.brownDark} strokeWidth={2.5} />
      </View>
      <Text className="text-brown-dark font-bold text-lg">{title}</Text>
    </View>
  );
}

import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProductDetailSheet } from '@features/routine/components/ProductDetailSheet';
import { useRoutineCompletionStore } from '@features/routine/stores/routineCompletionStore';
import type { ProductDto, RoutineStepWithProducts } from '@features/routine/types/routine.types';
import { CATEGORY_LABELS } from '@features/routine/types/routine.types';
import { Card } from '@shared/components/card';
import { Pressable } from '@shared/components/pressable';
import { cn } from '@shared/utils/cn';
import { getTodayUTC } from '@shared/utils/date';
import { haptic } from '@shared/utils/haptic';
import { colors } from '@theme/colors';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
}

function SquareCheckbox({ checked, onPress }: CheckboxProps): React.ReactElement {
  return (
    <Pressable onPress={onPress} hitSlop={16}>
      {checked ? (
        <View
          className="w-6 h-6 items-center justify-center bg-success"
          style={{ borderRadius: 6 }}
        >
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : (
        <View
          className="w-6 h-6 bg-surface"
          style={{
            borderWidth: 1.5,
            borderColor: colors.primary,
            borderRadius: 6,
          }}
        />
      )}
    </Pressable>
  );
}

interface ProductRowProps {
  product: ProductDto;
  stepLabel: string;
  checked: boolean;
  isLast: boolean;
  onToggle: () => void;
  onPress: () => void;
}

function ProductRow({
  product,
  stepLabel,
  checked,
  isLast,
  onToggle,
  onPress,
}: ProductRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center relative',
        !isLast && 'mb-3 pb-3 border-b border-border/50',
      )}
    >
      {product.illustrationUrl ? (
        <Image
          source={{ uri: product.illustrationUrl }}
          className="w-20 h-20 rounded-lg mr-4 bg-background"
          resizeMode="cover"
        />
      ) : (
        <View className="w-20 h-20 rounded-lg mr-4 bg-background" />
      )}

      <View className="flex-1 justify-center pr-10">
        <Text
          className={cn('text-base font-bold text-text mb-1', checked && 'line-through')}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <View className="flex-row items-center flex-wrap">
          <View className="px-2 py-0.5 rounded-full bg-primary/10 mr-2 mb-1">
            <Text className="text-xs font-semibold text-primary">{stepLabel}</Text>
          </View>
          {product.brand && (
            <Text className="text-xs text-textMuted mb-1" numberOfLines={1}>
              {product.brand}
            </Text>
          )}
        </View>
      </View>

      <View className="absolute top-0 right-0">
        <SquareCheckbox checked={checked} onPress={onToggle} />
      </View>
    </Pressable>
  );
}

interface RoutineStepCardProps {
  stepWithProducts: RoutineStepWithProducts;
  index: number;
  categoryOccurrence: number;
  totalCategoryCount: number;
  timeOfDay: 'morning' | 'evening';
}

export function RoutineStepCard({
  stepWithProducts,
  index,
  categoryOccurrence,
  totalCategoryCount,
  timeOfDay,
}: RoutineStepCardProps): React.ReactElement {
  const { t } = useTranslation();
  const { step, products } = stepWithProducts;
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);

  const { isProductCompleted, toggleProductCompletion } = useRoutineCompletionStore();
  const today = getTodayUTC();

  const baseLabel = CATEGORY_LABELS[step.category] || step.category;
  const categoryLabel =
    totalCategoryCount > 1
      ? `${t(categoryOccurrence === 1 ? 'routine.ordinal.first' : 'routine.ordinal.second')} ${baseLabel.toLowerCase()}`
      : baseLabel;
  const stepLabel = `${t('routine.step', { number: step.order })} · ${categoryLabel}`;
  const hasProducts = products.length > 0;

  const allChecked =
    hasProducts && products.every((p) => isProductCompleted(today, timeOfDay, p.id));

  const handleProductPress = (product: ProductDto): void => {
    haptic.light();
    setSelectedProduct(product);
  };

  const handleToggle = (productId: string): void => {
    haptic.light();
    toggleProductCompletion(today, timeOfDay, productId);
  };

  return (
    <>
      <Animated.View style={{ opacity: allChecked ? 0.5 : 1 }} className="mb-4">
        <Card animated entering={FadeInDown.delay(index * 100).springify()} padding="md">
          {hasProducts ? (
            <View>
              {products.map((product, productIndex) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  stepLabel={stepLabel}
                  checked={isProductCompleted(today, timeOfDay, product.id)}
                  isLast={productIndex === products.length - 1}
                  onToggle={() => handleToggle(product.id)}
                  onPress={() => handleProductPress(product)}
                />
              ))}
            </View>
          ) : (
            <View className="py-4">
              <Text className="text-xs text-textMuted mb-1">{stepLabel}</Text>
              <Text className="text-textMuted text-sm">{t('routine.noProductForStep')}</Text>
            </View>
          )}
        </Card>
      </Animated.View>

      <ProductDetailSheet
        product={selectedProduct}
        visible={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}

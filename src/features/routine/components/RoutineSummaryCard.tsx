import { Baby, ChevronDown, Droplets, Package } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type {
  ProductCategory,
  ProductSelectionDto,
  RoutineSummaryDto,
  SkinAnalysisDto,
} from '@features/routine/types/routine.types';
import { CATEGORY_LABELS } from '@features/routine/types/routine.types';
import { Pressable } from '@shared/components/pressable';
import { colors } from '@theme/colors';

interface ProductCarouselItemProps {
  category: string;
  productName: string;
  imageUrl: string | null;
}

function ProductCarouselItem({ category, productName, imageUrl }: ProductCarouselItemProps) {
  return (
    <View className="w-24 mr-3 items-center">
      {/* Product Image */}
      <View className="w-20 h-20 rounded-xl bg-background border border-border overflow-hidden mb-2">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center bg-background">
            <Package size={24} color={colors.textMuted} />
          </View>
        )}
      </View>
      {/* Category */}
      <Text className="text-xs font-medium text-primary text-center" numberOfLines={1}>
        {category}
      </Text>
      {/* Product Name */}
      <Text className="text-xs text-textMuted text-center" numberOfLines={2}>
        {productName}
      </Text>
    </View>
  );
}

const CAROUSEL_HEIGHT = 130;

interface RoutineSummaryCardProps {
  summary: RoutineSummaryDto;
  analysis: SkinAnalysisDto;
  productSelection: ProductSelectionDto;
}

export function RoutineSummaryCard({
  summary,
  analysis,
  productSelection,
}: RoutineSummaryCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const animationProgress = useSharedValue(0);

  const concerns = summary.primaryConcerns.join(' · ');
  const isPregnancySafe = analysis.healthConditions.isPregnancySafe;

  // Flatten all products from all categories with images
  const allProducts = useMemo(() => {
    return Object.entries(productSelection.products)
      .flatMap(([category, products]) =>
        products.map((product) => ({
          categoryKey: category,
          category: CATEGORY_LABELS[category as ProductCategory] || category,
          name: product.name,
          id: product.id,
          imageUrl: product.illustrationUrl || null,
        })),
      )
      .filter((p) => p.name);
  }, [productSelection.products]);

  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    animationProgress.value = withTiming(newExpanded ? 1 : 0, { duration: 300 });
  };

  const carouselAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(animationProgress.value, [0, 1], [0, CAROUSEL_HEIGHT]),
    opacity: animationProgress.value,
    overflow: 'hidden' as const,
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(animationProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      className="bg-primary/5 rounded-2xl p-4 mb-4 border border-primary/20"
    >
      {/* Skin Type Header */}
      <View className="flex-row items-center mb-2">
        <View className="bg-primary/10 rounded-full p-2 mr-3">
          <Droplets size={20} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-text">{summary.skinTypeLabel}</Text>
          {concerns && <Text className="text-sm text-textMuted">{concerns}</Text>}
        </View>
        {isPregnancySafe && (
          <View className="flex-row items-center bg-success/10 rounded-full px-2 py-1">
            <Baby size={14} color={colors.success} />
            <Text className="text-xs text-success font-medium ml-1">
              {t('routine.summary.pregnancySafe')}
            </Text>
          </View>
        )}
      </View>

      {/* View Products Dropdown */}
      {allProducts.length > 0 && (
        <>
          <Pressable
            onPress={toggleExpand}
            haptic="light"
            className="flex-row items-center justify-between mt-3 pt-3 border-t border-primary/10"
            accessibilityLabel={t('routine.summary.viewProducts')}
          >
            <Text className="text-sm font-medium text-primary">
              {t('routine.summary.viewProducts')} ({summary.totalProducts})
            </Text>
            <Animated.View style={chevronAnimatedStyle}>
              <ChevronDown size={20} color={colors.primary} />
            </Animated.View>
          </Pressable>

          {/* Collapsible Product Carousel */}
          <Animated.View style={carouselAnimatedStyle} className="-mx-4">
            <View className="pt-3">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4"
              >
                {allProducts.map((product) => (
                  <ProductCarouselItem
                    key={`${product.categoryKey}-${product.id}`}
                    category={product.category}
                    productName={product.name}
                    imageUrl={product.imageUrl}
                  />
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
}

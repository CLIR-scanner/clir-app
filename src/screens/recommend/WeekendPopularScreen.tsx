import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import {
  FilterState,
  INITIAL_FILTER_CATEGORIES,
  INITIAL_FILTERS,
} from '../../components/common/FilterBottomSheet';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import { clearAuthToken, UnauthorizedError } from '../../lib/api';
import { getWeekendPopular } from '../../services/recommend.service';
import { useUserStore } from '../../store/user.store';
import { Product, RecommendStackParamList, RiskLevel } from '../../types';

type Props = NativeStackScreenProps<RecommendStackParamList, 'WeekendPopular'>;

const C = {
  bg: Colors.scanLightGreen,
  dark: Colors.searchDarkGreen,
  mid: Colors.searchMutedGreen,
  muted: Colors.scanMutedGreen,
  line: Colors.searchDivider,
  productText: '#044733',
};

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe: Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger: Colors.searchWrong,
};

const PAGE_SIZE = 10;
const CATEGORY_IDS = ['all', ...INITIAL_FILTER_CATEGORIES.map(cat => cat.id)];

function getNumberMeta(product: Product, key: 'favoriteCount' | 'rating'): number {
  const value = (product as Product & Record<typeof key, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useTranslation();
  const color = BADGE_COLOR[level];
  const label = level === 'safe' ? t('scanUi.good') : level === 'caution' ? t('scanUi.poor') : t('scanUi.bad');

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <RiskBadgeIcon level={level} size={13} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function CategoryChip({
  id,
  selected,
  onPress,
}: {
  id: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const label = id === 'all'
    ? t('recommendUi.allCategories')
    : t(`search.categoriesList.${id}`, id);

  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.categoryText, selected && styles.categoryTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function toggleFilterCategory(filters: FilterState, id: string): FilterState {
  if (id === 'all') {
    return {
      ...filters,
      categories: filters.categories.map(cat => ({ ...cat, selected: false })),
    };
  }

  return {
    ...filters,
    categories: filters.categories.map(cat =>
      cat.id === id ? { ...cat, selected: !cat.selected } : cat,
    ),
  };
}

function TrendingRow({
  product,
  index,
  onPress,
}: {
  product: Product;
  index: number;
  onPress: () => void;
}) {
  const rating = getNumberMeta(product, 'rating');
  const favoriteCount = getNumberMeta(product, 'favoriteCount');

  return (
    <TouchableOpacity style={styles.rankRow} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.rankText}>{String(index + 1).padStart(2, '0')}</Text>

      <View style={styles.productBlock}>
        <View style={styles.thumb}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>
          <View style={styles.metaRow}>
            <RiskBadge level={product.riskLevel} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function WeekendPopularScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);

  const selectedCategoryIds = activeFilters.categories
    .filter(cat => cat.selected)
    .map(cat => cat.id);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getWeekendPopular()
      .then(next => {
        if (cancelled) return;
        setProducts(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          clearAuthToken();
          useUserStore.getState().logout();
          return;
        }
        setError(t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilters, query]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const activeCategories = activeFilters.categories
      .filter(cat => cat.selected)
      .map(cat => cat.id);
    return products
      .filter(product => activeCategories.length === 0 || (product.category ? activeCategories.includes(product.category) : false))
      .filter(product => !activeFilters.safeOnly || product.isSafe)
      .filter(product => {
        if (!normalizedQuery) return true;
        return product.name.toLowerCase().includes(normalizedQuery)
          || product.brand.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => getNumberMeta(b, 'favoriteCount') - getNumberMeta(a, 'favoriteCount'));
  }, [activeFilters, products, query]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredProducts.length;

  function loadMore() {
    if (!canLoadMore || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredProducts.length));
    requestAnimationFrame(() => setIsLoadingMore(false));
  }

  function handleClearSearch() {
    setQuery('');
    Keyboard.dismiss();
  }

  function handleProductPress(product: Product) {
    navigation.navigate('RecommendProductDetail', { product });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Week Trend</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {(query.length > 0 || isFocused) && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.sectionTitle}>{t('recommendUi.trending')}</Text>
      </View>

      <View style={styles.fixedCategoryWrap}>
        <FlatList
          data={CATEGORY_IDS}
          keyExtractor={item => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <CategoryChip
              id={item}
              selected={item === 'all' ? selectedCategoryIds.length === 0 : selectedCategoryIds.includes(item)}
              onPress={() => setActiveFilters(prev => toggleFilterCategory(prev, item))}
            />
          )}
        />
        <LinearGradient
          colors={['rgba(253,255,253,0)', 'rgba(253,255,253,0.92)', 'rgba(253,255,253,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.categoryFade}
          pointerEvents="none"
        />
      </View>

      <FlatList
        data={visibleProducts}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 126 },
          filteredProducts.length === 0 && styles.emptyContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={({ item, index }) => (
          <TrendingRow
            product={item}
            index={index}
            onPress={() => handleProductPress(item)}
          />
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color={C.dark} style={styles.footerSpinner} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {isLoading ? (
              <ActivityIndicator size="small" color={C.dark} />
            ) : (
              <Text style={styles.emptyText}>{error ?? t('search.empty')}</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    bottom: 26,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: C.dark,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: 'Pretendard-Regular',
  },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 12,
  },
  searchBox: {
    flex: 1,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 17,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: C.dark,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
  clearButtonText: {
    fontSize: 12,
    color: C.mid,
  },
  titleWrap: {
    paddingHorizontal: 28,
    marginTop: 28,
  },
  sectionTitle: {
    color: C.dark,
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyContent: {
    flexGrow: 1,
  },
  categoryList: {
    paddingHorizontal: 28,
    gap: 5,
  },
  fixedCategoryWrap: {
    backgroundColor: C.bg,
    paddingTop: 8,
    paddingBottom: 28,
    position: 'relative',
  },
  categoryFade: {
    position: 'absolute',
    right: 0,
    top: 8,
    height: 25,
    width: 60,
    zIndex: 1,
  },
  categoryChip: {
    minWidth: 96,
    height: 25,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 50,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  categoryText: {
    color: C.dark,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.228,
  },
  categoryTextActive: {
    color: Colors.white,
    fontFamily: 'Pretendard-Bold',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 28,
    minHeight: 82,
  },
  rankText: {
    width: 44,
    color: C.muted,
    fontSize: 20,
    fontFamily: 'Pretendard-ExtraBold',
    fontStyle: 'italic',
    lineHeight: 30,
    letterSpacing: -0.38,
  },
  productBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 9,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: Colors.searchDivider,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  productName: {
    color: C.productText,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.266,
    marginTop: 6,
  },
  brandName: {
    color: C.productText,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.1,
  },
  scoreText: {
    flex: 1,
    color: C.mid,
    fontSize: 11,
    fontFamily: 'Pretendard-Light',
    lineHeight: 13,
  },
  rowDivider: {
    height: 1,
    backgroundColor: C.line,
    marginLeft: 71,
    marginRight: 54,
    marginVertical: 7,
  },
  emptyBox: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyText: {
    color: C.mid,
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  footerSpinner: {
    paddingVertical: 18,
  },
});

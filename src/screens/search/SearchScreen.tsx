import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { SearchStackParamList, Product, RiskLevel } from '../../types';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import FilterBottomSheet, { FilterState, INITIAL_FILTERS } from '../../components/common/FilterBottomSheet';
import FilterTuneIcon from '../../components/common/FilterTuneIcon';
import { getSearchSuggestions, getAllProducts, searchProducts } from '../../services/search.service';
import { useListStore } from '../../store/list.store';
import { clearAuthToken, UnauthorizedError } from '../../lib/api';
import { useUserStore } from '../../store/user.store';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const SCREEN_W = Dimensions.get('window').width;
const GRID_PAD = 29;
const GRID_GAP  = 10;
const CARD_W    = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_IMG_H = CARD_W * 1.2;

const THUMB_SIZE = 80;

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger:  Colors.searchWrong,
};

const BADGE_LABEL: Record<RiskLevel, string> = {
  safe:    'Good',
  caution: 'Poor',
  danger:  'Bad',
};

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item, onPress, favorited, onFavorite }: {
  item: Product;
  onPress: () => void;
  favorited: boolean;
  onFavorite: () => void;
}) {
  const color = BADGE_COLOR[item.riskLevel];
  const label = BADGE_LABEL[item.riskLevel];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardImg, { height: CARD_IMG_H }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.cardImgPlaceholder} />
        )}

        {/* Bookmark — bottom right */}
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={onFavorite}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.bookmarkIcon, favorited && styles.bookmarkIconActive]}>
            {favorited ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Risk badge pill — dot replaced by RiskBadgeIcon */}
      <View style={[styles.riskBadge, { borderColor: color }]}>
        <RiskBadgeIcon level={item.riskLevel} size={16} />
        <Text style={[styles.riskLabel, { color }]}>{label}</Text>
      </View>

      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
    </TouchableOpacity>
  );
}

function ListDivider() {
  return <View style={styles.listDivider} />;
}

// ── Product Row (검색 결과 리스트용) ─────────────────────────────────────────

function ProductRow({ item, onPress }: { item: Product; onPress: () => void }) {
  const color = BADGE_COLOR[item.riskLevel];
  const label = BADGE_LABEL[item.riskLevel];
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowThumb}>
        {item.image
          ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          : <View style={styles.rowThumbPlaceholder} />
        }
      </View>

      <View style={styles.rowInfo}>
        <Text style={styles.rowProductName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowBrandName}   numberOfLines={1}>{item.brand}</Text>
        <View style={[styles.rowBadge, { borderColor: color }]}>
          <RiskBadgeIcon level={item.riskLevel} size={16} />
          <Text style={[styles.rowBadgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── SearchScreen ─────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query,         setQuery]         = useState('');
  const [isFocused,     setIsFocused]     = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilter,    setShowFilter]    = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [suggestions,   setSuggestions]  = useState<string[]>([]);
  const [items,         setItems]        = useState<Product[]>([]);
  const [hasMore,       setHasMore]      = useState(false);
  const [isAlphabeticalSort, setIsAlphabeticalSort] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const favorites             = useListStore(s => s.favorites);
  const addFavoriteToStore    = useListStore(s => s.addFavorite);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);

  const activeCount =
    activeFilters.categories.filter(c => c.selected).length +
    (activeFilters.safeOnly ? 1 : 0);

  // categories / safeOnly 필터는 BE 서버 사이드 처리.
  // 클라이언트는 알파벳 정렬만 담당.
  const visibleProducts = useMemo(() => {
    if (!isAlphabeticalSort) return items;
    return [...items].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [items, isAlphabeticalSort]);

  // query 또는 activeFilters 변경 시 서버 재조회
  // - categories / safeOnly: 서버 사이드 필터로 전달
  // - 비어있는 query: 즉시 fetch / 아니면 300ms 디바운스
  useEffect(() => {
    const q = query.trim();
    const selectedCats = activeFilters.categories
      .filter(c => c.selected)
      .map(c => c.id);
    const { safeOnly } = activeFilters;
    let cancelled = false;

    setItems([]);
    setHasMore(false);

    const fetch = () => {
      setIsLoading(true);
      (q
        ? searchProducts(q, 0, selectedCats, safeOnly)
        : getAllProducts(0, selectedCats, safeOnly)
      )
        .then(result => {
          if (cancelled) return;
          setItems(result.items);
          setHasMore(result.hasMore);
        })
        .catch((err: unknown) => {
          if (err instanceof UnauthorizedError) {
            clearAuthToken();
            useUserStore.getState().logout();
          }
        })
        .finally(() => { if (!cancelled) setIsLoading(false); });
    };

    if (!q) {
      fetch();
      return () => { cancelled = true; };
    }

    const timer = setTimeout(fetch, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeFilters]);

  // 자동완성: query 변경 시 제안 목록 업데이트
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    let cancelled = false;
    getSearchSuggestions(query)
      .then(next => { if (!cancelled) setSuggestions(next); })
      .catch((err: unknown) => {
        if (!cancelled) setSuggestions([]);
        if (err instanceof UnauthorizedError) {
          clearAuthToken();
          useUserStore.getState().logout();
        }
      });
    return () => { cancelled = true; };
  }, [query]);

  function loadMore() {
    const q = query.trim();
    if (!hasMore || isLoadingMore || isLoading) return;
    const nextOffset = items.length;
    const selectedCats = activeFilters.categories.filter(c => c.selected).map(c => c.id);
    setIsLoadingMore(true);
    (q
      ? searchProducts(q, nextOffset, selectedCats, activeFilters.safeOnly)
      : getAllProducts(nextOffset, selectedCats, activeFilters.safeOnly)
    )
      .then(result => {
        setItems(prev => [...prev, ...result.items]);
        setHasMore(result.hasMore);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMore(false));
  }

  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    setSuggestions([]);
    Keyboard.dismiss();
    const selectedCats = activeFilters.categories.filter(c => c.selected).map(c => c.id);
    setItems([]);
    setHasMore(false);
    setIsLoading(true);
    searchProducts(q, 0, selectedCats, activeFilters.safeOnly)
      .then(result => { setItems(result.items); setHasMore(result.hasMore); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }

  function handleSelectSuggestion(name: string) {
    // setQuery → useEffect [query]가 단일 출처로 fetch 처리.
    // 여기서 searchProducts를 직접 호출하면 useEffect와 중복 fetch race가 발생해
    // 결과가 덮어씌워지거나 stale 상태가 될 수 있음.
    setSuggestions([]);
    Keyboard.dismiss();
    setIsLoading(true); // debounce(300ms) 동안 스피너 표시
    setQuery(name);     // useEffect [query] 트리거 → items 초기화 + 300ms 후 fetch
  }

  function handleClear() {
    setQuery('');
    setSuggestions([]);
    Keyboard.dismiss();
    // query → '' 에 의해 useEffect가 전체 목록 복원을 처리
  }

  function handleSortSelect(nextAlphabetical: boolean) {
    setIsAlphabeticalSort(nextAlphabetical);
    setShowSortMenu(false);
  }

  function handleFavoriteToggle(product: Product) {
    const existing = favorites.find(f => f.productId === product.id);
    if (existing) {
      removeFavoriteFromStore(existing.id);
    } else {
      const newItem: import('../../types').FavoriteItem = {
        id: `fav-${Date.now()}`,
        productId: product.id,
        userId: 'dev-user',
        memo: '',
        addedAt: new Date(),
        product,
      };
      addFavoriteToStore(newItem);
    }
  }

  function renderCard({ item, index }: { item: Product; index: number }) {
    const isLeft   = index % 2 === 0;
    const favorited = !!favorites.find(f => f.productId === item.id);
    return (
      <View style={[styles.cardWrap, isLeft ? { marginRight: GRID_GAP / 2 } : { marginLeft: GRID_GAP / 2 }]}>
        <ProductCard
          item={item}
          onPress={() => navigation.navigate('SearchProductDetail', { product: item })}
          favorited={favorited}
          onFavorite={() => handleFavoriteToggle(item)}
        />
      </View>
    );
  }

  const loadMoreFooter = isLoadingMore ? (
    <ActivityIndicator size="small" color={Colors.searchDarkGreen} style={styles.footerSpinner} />
  ) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tab.search')}</Text>
      </View>

      {/* ── Search bar row ──────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.searchBorder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />

          {(query.length > 0 || isFocused) && (
            <TouchableOpacity
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => {
            setShowSortMenu(false);
            setShowFilter(true);
          }}
          activeOpacity={0.7}
        >
          <FilterTuneIcon active={activeCount > 0} />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Sort + filter pills ─────────────────────────────────── */}
      <View style={styles.toolbar}>
        <View style={styles.sortControl}>
          <TouchableOpacity
            style={[styles.sortPill, isAlphabeticalSort && styles.sortPillActive]}
            onPress={() => setShowSortMenu(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortPillLabel, isAlphabeticalSort && styles.sortPillLabelActive]}>
              {t('search.sortBy')}
            </Text>
            <View style={styles.sortArrowWrap}>
              <Text style={[styles.sortArrow, isAlphabeticalSort && styles.sortPillLabelActive]}>
                {showSortMenu ? '▴' : '▾'}
              </Text>
            </View>
          </TouchableOpacity>

          {showSortMenu && (
            <View style={styles.sortMenu}>
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect(false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.sortOptionText, !isAlphabeticalSort && styles.sortOptionTextActive]}>
                  {t('search.sortDefault')}
                </Text>
                {!isAlphabeticalSort && <View style={styles.sortOptionDot} />}
              </TouchableOpacity>
              <View style={styles.sortOptionDivider} />
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortSelect(true)}
                activeOpacity={0.75}
              >
                <Text style={[styles.sortOptionText, isAlphabeticalSort && styles.sortOptionTextActive]}>
                  {t('search.sortAlphabetical')}
                </Text>
                {isAlphabeticalSort && <View style={styles.sortOptionDot} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Auto-suggest dropdown ───────────────────────────────── */}
      {suggestions.length > 0 && (
        <View style={styles.suggestBox}>
          <FlatList
            data={suggestions.slice(0, 3)}
            keyExtractor={(item, i) => `${item}-${i}`}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestItem}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestIcon}>⌕</Text>
                <Text style={styles.suggestText} numberOfLines={1}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.suggestDivider} />}
          />
        </View>
      )}

      {/* ── 검색 결과 / 전체 그리드 ──────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={Colors.searchDarkGreen}
          style={styles.searchSpinner}
        />
      ) : query.trim() ? (
        /* 검색어 있음 → SearchResultScreen 스타일 리스트 */
        <FlatList
          key="list"
          data={visibleProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={ListDivider}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadMoreFooter}
          renderItem={({ item }) => (
            <ProductRow
              item={item}
              onPress={() => navigation.navigate('SearchProductDetail', { product: item })}
            />
          )}
        />
      ) : (
        /* 검색어 없음 → 2열 그리드 */
        <FlatList
          key="grid"
          data={visibleProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          extraData={favorites}
          contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadMoreFooter}
          renderItem={renderCard}
        />
      )}

      {/* ── Filter bottom sheet ──────────────────────────────────── */}
      <FilterBottomSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={activeFilters}
        onApply={(next) => setActiveFilters(next)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const SEARCH_BAR_H  = 42;
const FILTER_BTN_SZ = 42;
const BORDER_RADIUS = 10;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.searchBackground,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.searchDarkGreen,
    letterSpacing: -0.38,
    textAlign: 'center',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 5,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: SEARCH_BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.searchBackground,
    borderWidth: 1,
    borderColor: Colors.searchDarkGreen,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 16,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.searchDarkGreen,
    padding: 0,
  },
  clearBtn: { padding: 2 },
  clearBtnText: { fontSize: 12, color: Colors.searchMutedGreen },

  filterBtn: {
    width: FILTER_BTN_SZ,
    height: FILTER_BTN_SZ,
    borderRadius: BORDER_RADIUS,
    backgroundColor: Colors.searchBackground,
    borderWidth: 1,
    borderColor: Colors.searchDarkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.searchMutedGreen },
  filterBadge: {
    position: 'absolute',
    top: 6, right: 6,
    minWidth: 14, height: 14,
    borderRadius: 7,
    backgroundColor: Colors.searchWrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  toolbar: {
    paddingHorizontal: 22,
    marginBottom: 45,
    alignItems: 'flex-start',
    zIndex: 40,
  },
  sortControl: {
    position: 'relative',
    zIndex: 40,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.searchMutedGreen,
    borderRadius: 50,
    paddingVertical: 3,
    paddingLeft: 19,
    paddingRight: 12,
    minWidth: 118,
    justifyContent: 'center',
    gap: 10,
  },
  sortPillActive: { backgroundColor: Colors.searchMutedGreen },
  sortPillLabel: { fontSize: 14, fontWeight: '400', color: Colors.searchMutedGreen, letterSpacing: -0.27 },
  sortPillLabelActive: { color: Colors.white },
  sortArrowWrap: { width: 14, height: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sortArrow: { fontSize: 15, color: Colors.searchMutedGreen, lineHeight: 16 },
  sortMenu: {
    position: 'absolute',
    top: 34,
    left: 0,
    width: 178,
    borderWidth: 1,
    borderColor: Colors.searchBorder,
    borderRadius: 10,
    backgroundColor: Colors.searchBackground,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  sortOption: {
    minHeight: 42,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.searchMutedGreen,
  },
  sortOptionTextActive: {
    fontWeight: '700',
    color: Colors.searchDarkGreen,
  },
  sortOptionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.searchMutedGreen,
  },
  sortOptionDivider: {
    height: 1,
    backgroundColor: Colors.searchBorder,
    marginHorizontal: 12,
  },

  // Auto-suggest
  suggestBox: {
    position: 'absolute',
    top: 186,
    left: 22,
    right: 22,
    backgroundColor: Colors.searchBackground,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: Colors.searchBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 99,
    maxHeight: 132,
  },
  suggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  suggestIcon: { fontSize: 16, color: Colors.gray500 },
  suggestText: { flex: 1, fontSize: 14, color: Colors.searchDarkGreen, letterSpacing: -0.27 },
  suggestDivider: { height: 1, backgroundColor: Colors.searchBorder, marginHorizontal: 14 },

  searchSpinner: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 40,
  },
  footerSpinner: {
    paddingVertical: 16,
  },

  // Search result list
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  listDivider: {
    height: 1,
    backgroundColor: Colors.searchBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
    minHeight: 94,
  },
  rowThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    flexShrink: 0,
  },
  rowThumbPlaceholder: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  rowInfo: {
    flex: 1,
    gap: 7,
  },
  rowProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.searchMutedGreen,
    lineHeight: 22,
  },
  rowBrandName: {
    fontSize: 12,
    color: Colors.searchMutedGreen,
    lineHeight: 16,
    marginTop: -7,
  },
  rowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 5,
    paddingHorizontal: 11,
    gap: 6,
    minWidth: 74,
  },
  rowBadgeText: {
    fontSize: 12,
    fontWeight: '400',
  },
  rowChevron: {
    fontSize: 48,
    color: Colors.searchBorder,
    lineHeight: 50,
    marginLeft: 4,
  },

  // Product grid
  gridContent: {
    paddingHorizontal: GRID_PAD,
    paddingTop: 4,
  },
  cardWrap: {
    flex: 1,
    marginBottom: 28,
  },

  // Card
  card: {
    flex: 1,
  },
  cardImg: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.searchBorder,
    backgroundColor: Colors.searchCard,
    overflow: 'hidden',
    marginBottom: 13,
  },
  cardImgPlaceholder: {
    flex: 1,
    backgroundColor: Colors.searchCard,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 5,
    paddingHorizontal: 15,
    gap: 6,
    marginLeft: 5,
    marginTop: 4,
    marginBottom: 5,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.23,
  },
  bookmarkBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.searchBackground,
    borderWidth: 1,
    borderColor: Colors.searchBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 20,
    color: Colors.searchBorder,
    lineHeight: 24,
  },
  bookmarkIconActive: {
    color: Colors.searchWrong,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: 0,
    lineHeight: 22,
    marginLeft: 6,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '300',
    color: Colors.black,
    letterSpacing: 0,
    lineHeight: 13,
    marginLeft: 6,
  },
});

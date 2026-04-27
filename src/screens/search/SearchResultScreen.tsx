import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { SearchStackParamList, Product, RiskLevel } from '../../types';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import { searchProducts } from '../../services/search.service';
import FilterBottomSheet, { FilterState, INITIAL_FILTERS } from '../../components/common/FilterBottomSheet';
import FilterTuneIcon from '../../components/common/FilterTuneIcon';
import { ApiError, clearAuthToken, UnauthorizedError } from '../../lib/api';
import { useUserStore } from '../../store/user.store';

const BADGE_LABEL: Record<RiskLevel, string> = {
  safe:    'Good',
  caution: 'Poor',
  danger:  'Bad',
};

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger:  Colors.searchWrong,
};

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResult'>;

// ── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ riskLevel }: { riskLevel: Product['riskLevel'] }) {
  const color = BADGE_COLOR[riskLevel];
  const label = BADGE_LABEL[riskLevel];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <RiskBadgeIcon level={riskLevel} size={16} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumb}>
        {item.image
          ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          : <View style={styles.thumbPlaceholder} />
        }
      </View>

      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandName}   numberOfLines={1}>{item.brand}</Text>
        <RiskBadge riskLevel={item.riskLevel} />
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── SearchResultScreen ────────────────────────────────────────────────────────

export default function SearchResultScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [query,         setQuery]        = useState(route.params.query);
  const [results,       setResults]      = useState<Product[]>([]);
  const [hasMore,       setHasMore]      = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage,  setErrorMessage] = useState('');
  const [showFilter,    setShowFilter]   = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isAlphabeticalSort, setIsAlphabeticalSort] = useState(false);
  const [showSortMenu,  setShowSortMenu] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const activeCount =
    activeFilters.categories.filter(c => c.selected).length +
    (activeFilters.safeOnly ? 1 : 0);

  const visibleResults = useMemo(() => {
    if (!isAlphabeticalSort) return results;
    return [...results].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }, [results, isAlphabeticalSort]);

  const runSearch = useCallback(async (q: string, offset = 0) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }

    if (offset === 0) {
      setLoading(true);
      setErrorMessage('');
      setResults([]);
      setHasMore(false);
      setIsAlphabeticalSort(false);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await searchProducts(trimmed, offset);
      if (offset === 0) {
        setResults(data.items);
      } else {
        setResults(prev => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
    } catch (err: unknown) {
      if (offset === 0) setResults([]);
      if (err instanceof UnauthorizedError) {
        clearAuthToken();
        useUserStore.getState().logout();
        return;
      }
      if (offset === 0) setErrorMessage(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      if (offset === 0) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [t]);

  function loadMore() {
    if (!hasMore || isLoadingMore || loading) return;
    runSearch(query, results.length);
  }

  // 최초 진입 시 검색 + 프로필 변경 시 자동 재검색 (개인화 판정 갱신)
  const profileVersion = useUserStore(s => s.profileVersion);
  useEffect(() => { runSearch(route.params.query); }, [route.params.query, runSearch, profileVersion]);

  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    runSearch(q);
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }

  function handleSortSelect(nextAlphabetical: boolean) {
    setIsAlphabeticalSort(nextAlphabetical);
    setShowSortMenu(false);
  }

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
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
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

      {/* ── Sort pill ─────────────────────────────────────────────── */}
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
            <Text style={[styles.sortArrow, isAlphabeticalSort && styles.sortPillLabelActive]}>
              {showSortMenu ? '▴' : '▾'}
            </Text>
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

      {/* ── Results ───────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.statusText}>{t('search.loading')}</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => runSearch(query)} activeOpacity={0.7}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleResults}
          keyExtractor={item => item.id}
          contentContainerStyle={visibleResults.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore
            ? <ActivityIndicator size="small" color={Colors.primary} style={styles.footerSpinner} />
            : null
          }
          renderItem={({ item }) => (
            <ProductRow item={item} onPress={() => navigation.navigate('SearchProductDetail', { product: item })} />
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>{t('search.empty')}</Text>
            </View>
          }
        />
      )}

      {/* ── Filter bottom sheet ───────────────────────────────────── */}
      <FilterBottomSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={activeFilters}
        onApply={(next) => setActiveFilters(next)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SEARCH_BAR_H  = 42;
const FILTER_BTN_SZ = 42;
const BORDER_RADIUS = 10;
const THUMB_SIZE    = 80;

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

  // Sort pill
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
    alignSelf: 'flex-start',
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

  // List
  listContent: { paddingHorizontal: 26, paddingTop: 0, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  divider: { height: 1, backgroundColor: Colors.searchBorder, marginHorizontal: 0 },
  footerSpinner: { paddingVertical: 16 },

  // Product row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
    minHeight: 94,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: '#D9D9D9',
  },
  info: {
    flex: 1,
    gap: 7,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.searchMutedGreen,
    letterSpacing: 0,
    lineHeight: 22,
  },
  brandName: {
    fontSize: 12,
    color: Colors.searchMutedGreen,
    letterSpacing: 0,
    lineHeight: 16,
    marginTop: -7,
  },

  // Risk badge
  badge: {
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
  badgeText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
  },

  // Chevron
  chevron: {
    fontSize: 48,
    color: Colors.searchBorder,
    lineHeight: 50,
    marginLeft: 4,
  },

  // Loading / empty
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: Colors.searchMutedGreen,
    letterSpacing: -0.27,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.searchMutedGreen,
    letterSpacing: -0.27,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.black,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
});

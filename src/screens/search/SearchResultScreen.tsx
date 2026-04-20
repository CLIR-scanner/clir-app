import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { RiskLevel } from '../../types';

const BADGE_LABEL: Record<RiskLevel, string> = {
  safe:    'Good',
  caution: 'Poor',
  danger:  'Bad',
};

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    '#4CD964', // 연두색
  caution: '#FF9500', // 주황색
  danger:  '#FF3B30', // 빨간색
};
import { SearchStackParamList, Product } from '../../types';
import { searchProducts } from '../../services/search.service';
import FilterBottomSheet, { FilterState, INITIAL_FILTERS } from '../../components/common/FilterBottomSheet';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResult'>;

// ── Risk Badge ────────────────────────────────────────────────────────────────

function RiskBadge({ riskLevel }: { riskLevel: Product['riskLevel'] }) {
  const color = BADGE_COLOR[riskLevel];
  const label = BADGE_LABEL[riskLevel];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Thumbnail */}
      <View style={styles.thumb}>
        {item.image
          ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={styles.thumbPlaceholder} />
        }
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.brandName}   numberOfLines={1}>{item.brand}</Text>
        <RiskBadge riskLevel={item.riskLevel} />
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── SearchResultScreen ────────────────────────────────────────────────────────

export default function SearchResultScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [query,        setQuery]       = useState(route.params.query);
  const [results,      setResults]     = useState<Product[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [showFilter,   setShowFilter]  = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);

  const inputRef = useRef<TextInput>(null);

  const activeCount =
    activeFilters.categories.filter(c => c.selected).length +
    (activeFilters.safeOnly ? 1 : 0) +
    (activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchProducts(trimmed);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 최초 진입 시 검색
  useEffect(() => { runSearch(query); }, []);

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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Custom Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchIconBox}>
            <Text style={styles.searchIconText}>⌕</Text>
          </View>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.gray500}
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

        {/* Filter button */}
        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterBtnText, activeCount > 0 && styles.filterBtnTextActive]}>⊞</Text>
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Sort pill ─────────────────────────────────────────────── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.sortPill, activeCount > 0 && styles.sortPillActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortPillLabel, activeCount > 0 && styles.sortPillLabelActive]}>
            {t('search.sortBy')}
          </Text>
          <Text style={[styles.sortArrow, activeCount > 0 && styles.sortPillLabelActive]}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* ── Results ───────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.statusText}>{t('search.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          contentContainerStyle={results.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductRow item={item} onPress={() => {/* TODO: navigate to ScanResult */}} />
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

const SEARCH_BAR_H  = 44;
const FILTER_BTN_SZ = 44;
const BORDER_RADIUS = 8;
const THUMB_SIZE    = 80;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 30,
    color: Colors.black,
    lineHeight: 36,
  },
  searchBar: {
    flex: 1,
    height: SEARCH_BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchIconBox: {
    width: 22, height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: { fontSize: 18, color: Colors.gray500, lineHeight: 22 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.black,
    padding: 0,
  },
  clearBtn: { padding: 2 },
  clearBtnText: { fontSize: 12, color: Colors.gray500 },

  filterBtn: {
    width: FILTER_BTN_SZ,
    height: FILTER_BTN_SZ,
    borderRadius: BORDER_RADIUS,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.black },
  filterBtnText: { fontSize: 20, color: Colors.gray700, lineHeight: 24 },
  filterBtnTextActive: { color: Colors.white },
  filterBadge: {
    position: 'absolute',
    top: 5, right: 5,
    minWidth: 14, height: 14,
    borderRadius: 7,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  // Sort pill
  toolbar: { paddingHorizontal: 24, marginBottom: 8 },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 14,
    gap: 6,
  },
  sortPillActive: { backgroundColor: Colors.black },
  sortPillLabel: { fontSize: 14, fontWeight: '400', color: Colors.black, letterSpacing: -0.27 },
  sortPillLabelActive: { color: Colors.white },
  sortArrow: { fontSize: 10, color: Colors.black, lineHeight: 14 },

  // List
  listContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },

  // Product row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 11,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  brandName: {
    fontSize: 12,
    color: Colors.gray500,
    letterSpacing: -0.23,
    marginTop: -4,
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
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.23,
  },

  // Chevron
  chevron: {
    fontSize: 26,
    color: Colors.gray300,
    lineHeight: 30,
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
    color: Colors.gray500,
    letterSpacing: -0.27,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.gray500,
    letterSpacing: -0.27,
  },
});

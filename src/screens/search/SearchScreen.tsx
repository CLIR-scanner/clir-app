import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { SearchStackParamList, Product, RiskLevel } from '../../types';
import FilterBottomSheet, { FilterState, INITIAL_FILTERS } from '../../components/common/FilterBottomSheet';
import { getSearchSuggestions, getAllProducts } from '../../services/search.service';
import { useListStore } from '../../store/list.store';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

const SCREEN_W = Dimensions.get('window').width;
const GRID_PAD = 24;
const GRID_GAP  = 12;
const CARD_W    = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_IMG_H = CARD_W * 1.1;

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    '#4CD964',
  caution: '#FF9500',
  danger:  '#FF3B30',
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
            resizeMode="cover"
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

      {/* Risk badge pill — below image */}
      <View style={[styles.riskBadge, { borderColor: color }]}>
        <View style={[styles.riskDot, { backgroundColor: color }]} />
        <Text style={[styles.riskLabel, { color }]}>{label}</Text>
      </View>

      <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.cardBrand} numberOfLines={1}>{item.brand}</Text>
    </TouchableOpacity>
  );
}

// ── SearchScreen ─────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query,         setQuery]         = useState('');
  const [focused,       setFocused]       = useState(false);
  const [showFilter,    setShowFilter]    = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [suggestions,   setSuggestions]  = useState<string[]>([]);
  const [allProducts,   setAllProducts]  = useState<Product[]>([]);

  const favorites             = useListStore(s => s.favorites);
  const addFavoriteToStore    = useListStore(s => s.addFavorite);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);

  const activeCount =
    activeFilters.categories.filter(c => c.selected).length +
    (activeFilters.safeOnly ? 1 : 0) +
    (activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0);

  // 전체 제품 로드
  useEffect(() => {
    getAllProducts().then(setAllProducts);
  }, []);

  // 자동완성: query 변경 시 제안 목록 업데이트
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    getSearchSuggestions(query).then(setSuggestions);
  }, [query]);

  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    setSuggestions([]);
    navigation.navigate('SearchResult', { query: q });
  }

  function handleSelectSuggestion(name: string) {
    setQuery(name);
    setSuggestions([]);
    navigation.navigate('SearchResult', { query: name });
  }

  function handleClear() {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function handleCancel() {
    setQuery('');
    setSuggestions([]);
    setFocused(false);
    inputRef.current?.blur();
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tab.search')}</Text>
      </View>

      {/* ── Search bar row ──────────────────────────────────────── */}
      <View style={styles.searchRow}>
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
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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

        {focused ? (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterBtnText, activeCount > 0 && styles.filterBtnTextActive]}>
              ⊞
            </Text>
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sort + filter pills ─────────────────────────────────── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.sortPill, activeCount > 0 && styles.sortPillActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortPillLabel, activeCount > 0 && styles.sortPillLabelActive]}>
            {t('search.sortBy')}
          </Text>
          <View style={styles.sortArrowWrap}>
            <Text style={[styles.sortArrow, activeCount > 0 && styles.sortPillLabelActive]}>▾</Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* ── Auto-suggest dropdown ───────────────────────────────── */}
      {suggestions.length > 0 && (
        <View style={styles.suggestBox}>
          <FlatList
            data={suggestions}
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

      {/* ── Product grid ────────────────────────────────────────── */}
      <FlatList
        data={allProducts}
        keyExtractor={item => item.id}
        numColumns={2}
        extraData={favorites}
        contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={renderCard}
      />

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
const SEARCH_BAR_H  = 47;
const FILTER_BTN_SZ = 47;
const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.38,
    textAlign: 'center',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 10,
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
    width: 24, height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: {
    fontSize: 20,
    color: Colors.gray500,
    lineHeight: 24,
  },
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
  filterBtnText: { fontSize: 22, color: Colors.gray700, lineHeight: 26 },
  filterBtnTextActive: { color: Colors.white },
  filterBadge: {
    position: 'absolute',
    top: 6, right: 6,
    minWidth: 14, height: 14,
    borderRadius: 7,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.white },

  cancelBtn: { paddingHorizontal: 4, justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, color: Colors.black, fontWeight: '500' },

  toolbar: {
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 14,
    gap: 6,
  },
  sortPillActive: { backgroundColor: Colors.black },
  sortPillLabel: { fontSize: 13, fontWeight: '400', color: Colors.black, letterSpacing: -0.27 },
  sortPillLabelActive: { color: Colors.white },
  sortArrowWrap: { width: 14, height: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sortArrow: { fontSize: 18, color: Colors.black, lineHeight: 18 },

  // Auto-suggest
  suggestBox: {
    position: 'absolute',
    top: 130,
    left: 24,
    right: 24,
    backgroundColor: Colors.white,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 99,
    maxHeight: 240,
  },
  suggestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  suggestIcon: { fontSize: 16, color: Colors.gray500 },
  suggestText: { flex: 1, fontSize: 14, color: Colors.black, letterSpacing: -0.27 },
  suggestDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 14 },

  // Product grid
  gridContent: {
    paddingHorizontal: GRID_PAD,
    paddingTop: 4,
  },
  cardWrap: {
    flex: 1,
    marginBottom: GRID_GAP,
  },

  // Card
  card: {
    flex: 1,
  },
  cardImg: {
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImgPlaceholder: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 4,
    paddingHorizontal: 9,
    gap: 5,
    marginBottom: 4,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bookmarkBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: {
    fontSize: 15,
    color: Colors.gray500,
  },
  bookmarkIconActive: {
    color: '#FF3B30',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.black,
    letterSpacing: -0.25,
    marginBottom: 2,
  },
  cardBrand: {
    fontSize: 11,
    color: Colors.gray500,
    letterSpacing: -0.2,
  },
});

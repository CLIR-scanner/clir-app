import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { SearchStackParamList } from '../../types';
import FilterBottomSheet, { FilterState, INITIAL_FILTERS } from '../../components/common/FilterBottomSheet';

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query,           setQuery]           = useState('');
  const [showFilter,      setShowFilter]      = useState(false);
  const [activeFilters,   setActiveFilters]   = useState<FilterState>(INITIAL_FILTERS);

  function handleSubmit() {
    const q = query.trim();
    if (!q) return;
    navigation.navigate('SearchResult', { query: q });
  }

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  // Count active filter indicators (selected categories + safeOnly)
  const activeCount =
    activeFilters.categories.filter(c => c.selected).length +
    (activeFilters.safeOnly ? 1 : 0) +
    (activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0);

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

        {/* Filter icon button — opens FilterBottomSheet */}
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
      </View>

      {/* ── Sort pill — opens FilterBottomSheet ─────────────────── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.sortPill, activeCount > 0 && styles.sortPillActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sortPillLabel, activeCount > 0 && styles.sortPillLabelActive]}>
            {t('search.sortBy')}
          </Text>
          <Text style={[styles.sortArrow, activeCount > 0 && styles.sortPillLabelActive]}>
            ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content area ───────────────────────────────────────────*/}
      <View style={styles.contentArea} />

      {/* ── Filter bottom sheet ─────────────────────────────────── */}
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

  // Header
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

  // Search row
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
  clearBtn: {
    padding: 2,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.gray500,
  },

  // Filter button (right of search bar)
  filterBtn: {
    width: FILTER_BTN_SZ,
    height: FILTER_BTN_SZ,
    borderRadius: BORDER_RADIUS,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.black,
  },
  filterBtnText: {
    fontSize: 22,
    color: Colors.gray700,
    lineHeight: 26,
  },
  filterBtnTextActive: {
    color: Colors.white,
  },
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
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },

  // Sort pill
  toolbar: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
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
  sortPillActive: {
    backgroundColor: Colors.black,
  },
  sortPillLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.black,
    letterSpacing: -0.27,
  },
  sortPillLabelActive: {
    color: Colors.white,
  },
  sortArrow: {
    fontSize: 10,
    color: Colors.black,
    lineHeight: 14,
  },

  // Content area
  contentArea: {
    flex: 1,
  },
});

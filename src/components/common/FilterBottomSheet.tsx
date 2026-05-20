import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FilterCategory = { id: string; label: string; selected: boolean };

export interface FilterState {
  categories: FilterCategory[];
  safeOnly: boolean;
  minPrice: string;
  maxPrice: string;
}

// id는 BE products.category 컬럼 값과 정확히 일치해야 함 (OFF 내부 카테고리 기준).
// BE lib/offCategoryMap.ts 참고.
export const INITIAL_FILTER_CATEGORIES: FilterCategory[] = [
  { id: 'beverages',  label: 'Beverages',           selected: false },
  { id: 'snacks',     label: 'Snacks & Chips',       selected: false },
  { id: 'bakery',     label: 'Bakery & Bread',       selected: false },
  { id: 'dairy',      label: 'Dairy Products',       selected: false },
  { id: 'cereals',    label: 'Cereals & Grains',     selected: false },
  { id: 'cookies',    label: 'Cookies & Crackers',   selected: false },
  { id: 'chocolates', label: 'Chocolates & Candy',   selected: false },
  { id: 'spreads',    label: 'Spreads & Jams',       selected: false },
  { id: 'meat',       label: 'Meat & Poultry',       selected: false },
  { id: 'seafood',    label: 'Seafood',              selected: false },
  { id: 'condiments', label: 'Sauces & Condiments',  selected: false },
];

export const INITIAL_FILTERS: FilterState = {
  categories: INITIAL_FILTER_CATEGORIES,
  safeOnly: false,
  minPrice: '',
  maxPrice: '',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (next: FilterState) => void;
}

function SafeSwitch({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <TouchableOpacity
      style={[styles.switchTrack, value && styles.switchTrackOn]}
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
    </TouchableOpacity>
  );
}

// ── FilterBottomSheet ─────────────────────────────────────────────────────────

export default function FilterBottomSheet({ visible, onClose, filters, onApply }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  function updateFilters(next: FilterState) {
    onApply({ ...next, minPrice: '', maxPrice: '' });
  }

  function toggleCategory(index: number) {
    updateFilters({
      ...filters,
      categories: filters.categories.map((cat, i) =>
        i === index ? { ...cat, selected: !cat.selected } : cat,
      ),
    });
  }

  function toggleSafeOnly(next: boolean) {
    updateFilters({ ...filters, safeOnly: next });
  }

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('search.filters')}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.75}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topDivider} />

        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>{t('search.categories')}</Text>
        </View>

        <View style={styles.categoryList}>
          {filters.categories.map((cat, index) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryRow}
              onPress={() => toggleCategory(index)}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox, cat.selected && styles.checkboxSelected]}>
                {cat.selected && (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17L4 12"
                      stroke={Colors.white}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
              <Text style={styles.categoryLabel}>{t(`search.categoriesList.${cat.id}`, cat.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.safeRow}>
          <Text style={styles.safeLabel}>{t('search.safeOnlyLabel')}</Text>
          <SafeSwitch value={filters.safeOnly} onChange={toggleSafeOnly} />
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 630,
    backgroundColor: Colors.searchBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    height: 57,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: 'Pretendard-ExtraBold',
    color: Colors.searchDarkGreen,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 13,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 30,
    color: Colors.searchDarkGreen,
    fontFamily: 'Pretendard-Regular',
  },
  topDivider: {
    height: 1,
    marginLeft: 30,
    marginRight: 31,
    marginTop: 8,
    backgroundColor: Colors.searchBorder,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: Colors.black,
    lineHeight: 22,
  },
  categoryList: {
    paddingLeft: 34,
  },
  categoryRow: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 0.5,
    borderColor: Colors.searchDarkGreen,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.searchDarkGreen,
  },
  categoryLabel: {
    marginLeft: 15,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: Colors.black,
    lineHeight: 27,
  },
  sectionDivider: {
    height: 1,
    marginLeft: 30,
    marginRight: 31,
    marginTop: 19,
    backgroundColor: Colors.searchBorder,
  },
  safeRow: {
    height: 69,
    paddingLeft: 30,
    paddingRight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  safeLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: Colors.black,
    lineHeight: 22,
  },
  switchTrack: {
    width: 52,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.searchBorder,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchTrackOn: {
    backgroundColor: '#044733',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
});

import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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

export const INITIAL_FILTER_CATEGORIES: FilterCategory[] = [
  { id: 'bakery',    label: 'Bakery & Bread',  selected: false },
  { id: 'desserts',  label: 'Desserts & Sweet', selected: false },
  { id: 'beverages', label: 'Beverages',        selected: false },
  { id: 'packaged',  label: 'Packaged Foods',   selected: false },
  { id: 'instant',   label: 'Instant Meals',    selected: false },
  { id: 'dairy',     label: 'Dairy Products',   selected: false },
  { id: 'meat',      label: 'Meat & Poultry',   selected: false },
  { id: 'seafood',   label: 'Seafood',          selected: false },
  { id: 'produce',   label: 'Fresh Produce',    selected: false },
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
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
        </View>

        {/* 카테고리 필터는 BE 미지원 — 시각적으로 표시만 하고 터치 비활성화 */}
        <View style={[styles.categoryList, styles.categoryListDisabled]} pointerEvents="none">
          {filters.categories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.checkbox} />
              <Text style={[styles.categoryLabel, styles.categoryLabelDisabled]}>{cat.label}</Text>
            </View>
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
    height: 532,
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.searchDarkGreen,
    letterSpacing: -0.3,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 18,
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Colors.searchMutedGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 26,
    color: Colors.white,
    fontWeight: '500',
    marginTop: -2,
  },
  topDivider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: Colors.black,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    paddingRight: 24,
    paddingTop: 31,
    paddingBottom: 34,
    gap: 10,
  },
  comingSoonBadge: {
    borderWidth: 1,
    borderColor: Colors.searchBorder,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  comingSoonText: {
    fontSize: 11,
    color: Colors.searchBorder,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 22,
  },
  categoryList: {
    paddingLeft: 34,
  },
  categoryListDisabled: {
    opacity: 0.35,
  },
  categoryRow: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.searchMutedGreen,
  },
  checkmark: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '800',
    lineHeight: 16,
  },
  categoryLabel: {
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.black,
    lineHeight: 27,
  },
  categoryLabelDisabled: {
    color: Colors.searchBorder,
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
    fontWeight: '700',
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
    backgroundColor: Colors.searchMutedGreen,
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

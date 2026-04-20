import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
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

type SectionId = 'categories' | 'safeOnly' | 'priceRange';

const INITIAL_SECTION_ORDER: SectionId[] = ['categories', 'safeOnly', 'priceRange'];

const SECTION_LABELS: Record<SectionId, string> = {
  categories: 'Product Categories',
  safeOnly:   'Show only safe products for me',
  priceRange: 'Price Range',
};

const SECTION_H = 56;

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (next: FilterState) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');
const ITEM_H = 50;

// ── SortBarsIcon ──────────────────────────────────────────────────────────────

function SortBarsIcon({ active }: { active: boolean }) {
  const color = active ? Colors.white : Colors.gray700;
  return (
    <View style={[sortIconStyles.wrap, active && sortIconStyles.wrapActive]}>
      <View style={[sortIconStyles.bar, { width: 16 }, { backgroundColor: color }]} />
      <View style={[sortIconStyles.bar, { width: 11 }, { backgroundColor: color }]} />
      <View style={[sortIconStyles.bar, { width: 6  }, { backgroundColor: color }]} />
    </View>
  );
}

const sortIconStyles = StyleSheet.create({
  wrap: {
    gap: 4,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  wrapActive: { backgroundColor: Colors.black },
  bar: { height: 2, borderRadius: 1 },
});

// ── DragHandleIcon ────────────────────────────────────────────────────────────

function DragHandleIcon({ active }: { active: boolean }) {
  const color = active ? Colors.primary : Colors.gray500;
  return (
    <View style={dragIconStyles.wrap}>
      <View style={[dragIconStyles.bar, { backgroundColor: color }]} />
      <View style={[dragIconStyles.bar, { backgroundColor: color }]} />
      <View style={[dragIconStyles.bar, { backgroundColor: color }]} />
    </View>
  );
}

const dragIconStyles = StyleSheet.create({
  wrap: { gap: 3.5, alignItems: 'center', justifyContent: 'center', paddingLeft: 8 },
  bar:  { width: 16, height: 2, borderRadius: 1 },
});

// ── FilterBottomSheet ─────────────────────────────────────────────────────────

export default function FilterBottomSheet({ visible, onClose, filters, onApply }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ── Animation ──────────────────────────────────────────────────────────────
  const slideOffset    = useRef(new Animated.Value(-SCREEN_H)).current;
  const backdropAnim   = useRef(new Animated.Value(0)).current;
  const keyboardBottom = useRef(new Animated.Value(0)).current;
  const sheetBottom    = useRef(Animated.add(keyboardBottom, slideOffset)).current;

  // ── Draft state ────────────────────────────────────────────────────────────
  const [categories,   setCategories]  = useState<FilterCategory[]>(filters.categories);
  const [safeOnly,     setSafeOnly]    = useState(filters.safeOnly);
  const [minPrice,     setMinPrice]    = useState(filters.minPrice);
  const [maxPrice,     setMaxPrice]    = useState(filters.maxPrice);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(INITIAL_SECTION_ORDER);

  // ── Reorder mode (section-level) ──────────────────────────────────────────
  const [reorderMode,  setReorderMode] = useState(false);
  const reorderModeRef = useRef(false);
  useEffect(() => { reorderModeRef.current = reorderMode; }, [reorderMode]);

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [hoverIndex,    setHoverIndex]    = useState<number | null>(null);

  const sectionOrderRef  = useRef(sectionOrder);
  const activeSectionRef = useRef<SectionId | null>(null);
  const hoverIndexRef    = useRef<number | null>(null);

  useEffect(() => { sectionOrderRef.current = sectionOrder; }, [sectionOrder]);

  // ── Keyboard listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardBottom, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardBottom, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });

    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  // ── Sync draft when sheet opens ────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setCategories(filters.categories);
      setSafeOnly(filters.safeOnly);
      setMinPrice(filters.minPrice);
      setMaxPrice(filters.maxPrice);
      setReorderMode(false);
    }
  }, [visible]);

  // ── Sheet slide animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideOffset,  { toValue: 0,         duration: 320, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 1,         duration: 320, useNativeDriver: true  }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideOffset,  { toValue: -SCREEN_H, duration: 280, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0,          duration: 280, useNativeDriver: true  }),
      ]).start();
    }
  }, [visible]);

  // ── Build PanResponder per section ─────────────────────────────────────────
  function buildSectionDragPR(sectionId: SectionId) {
    function cleanup() {
      activeSectionRef.current = null;
      hoverIndexRef.current    = null;
      setActiveSection(null);
      setHoverIndex(null);
    }

    return PanResponder.create({
      onStartShouldSetPanResponder:            () => reorderModeRef.current,
      onStartShouldSetPanResponderCapture:     () => reorderModeRef.current,
      onMoveShouldSetPanResponder:             () => reorderModeRef.current,
      onMoveShouldSetPanResponderCapture:      () => reorderModeRef.current,

      onPanResponderGrant: () => {
        const idx = sectionOrderRef.current.indexOf(sectionId);
        if (idx === -1) return;
        activeSectionRef.current = sectionId;
        hoverIndexRef.current    = idx;
        setActiveSection(sectionId);
        setHoverIndex(idx);
      },

      onPanResponderMove: (_, gs) => {
        const currentIdx = sectionOrderRef.current.indexOf(sectionId);
        if (currentIdx === -1) return;
        const newHover = Math.max(
          0,
          Math.min(sectionOrderRef.current.length - 1, currentIdx + Math.round(gs.dy / SECTION_H)),
        );
        if (newHover !== hoverIndexRef.current) {
          hoverIndexRef.current = newHover;
          setHoverIndex(newHover);
        }
      },

      onPanResponderRelease: () => {
        const from = sectionOrderRef.current.indexOf(sectionId);
        const to   = hoverIndexRef.current;
        if (from !== -1 && to !== null && from !== to) {
          setSectionOrder(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            sectionOrderRef.current = next;
            return next;
          });
        }
        cleanup();
      },

      onPanResponderTerminate: cleanup,
    });
  }

  const sectionPRs = useRef<Record<SectionId, ReturnType<typeof PanResponder.create>>>(
    {} as Record<SectionId, ReturnType<typeof PanResponder.create>>,
  );
  useEffect(() => {
    INITIAL_SECTION_ORDER.forEach(id => {
      sectionPRs.current[id] = buildSectionDragPR(id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ───────────────────────────────────────────────────────────────
  function toggleCategory(index: number) {
    setCategories(prev => prev.map((c, i) => i === index ? { ...c, selected: !c.selected } : c));
  }

  function handleApply() {
    onApply({ categories, safeOnly, minPrice, maxPrice });
    onClose();
  }

  function handleReset() {
    setCategories(INITIAL_FILTER_CATEGORIES);
    setSafeOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setReorderMode(false);
    setSectionOrder(INITIAL_SECTION_ORDER);
  }

  // ── Section content renderers ──────────────────────────────────────────────
  function renderCategoriesContent() {
    return (
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('search.categories')}</Text>
          <TouchableOpacity
            onPress={() => setReorderMode(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SortBarsIcon active={false} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryList}>
          {categories.map((cat, index) => (
            <View key={cat.id} style={styles.categoryRow}>
              <TouchableOpacity
                onPress={() => toggleCategory(index)}
                style={styles.checkboxTouch}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, cat.selected && styles.checkboxChecked]}>
                  {cat.selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
      </View>
    );
  }

  function renderSafeOnlyContent() {
    return (
      <View>
        <View style={styles.safeRow}>
          <Text style={styles.safeLabel}>{t('search.safeOnlyLabel')}</Text>
          <Switch
            value={safeOnly}
            onValueChange={setSafeOnly}
            trackColor={{ false: Colors.gray300, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  function renderPriceRangeContent() {
    return (
      <View style={styles.priceSection}>
        <Text style={styles.sectionTitle}>{t('search.priceRange')}</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>{t('search.minPrice')}</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceBoxInput}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="0"
                placeholderTextColor={Colors.gray500}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.priceDash} />

          <View style={styles.priceBox}>
            <Text style={styles.priceBoxLabel}>{t('search.maxPrice')}</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.priceDollar}>$</Text>
              <TextInput
                style={styles.priceBoxInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="999"
                placeholderTextColor={Colors.gray500}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* ── Sheet ─────────────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.sheet,
          { bottom: sheetBottom, paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerSide}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('search.filters')}</Text>

          <TouchableOpacity
            onPress={reorderMode ? () => setReorderMode(false) : handleReset}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerSide}
          >
            <Text style={[styles.resetBtn, reorderMode && styles.doneBtn]}>
              {reorderMode ? 'Done' : t('search.reset')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {reorderMode ? (
          // ── Section reorder mode ─────────────────────────────────────────
          <View>
            <Text style={styles.reorderHint}>Drag to reorder sections</Text>

            {sectionOrder.map((sectionId, index) => {
              const isDragging   = activeSection === sectionId;
              const isHoverAbove = hoverIndex === index && activeSection !== null && !isDragging &&
                sectionOrder.indexOf(activeSection) > index;
              const isHoverBelow = hoverIndex === index && activeSection !== null && !isDragging &&
                sectionOrder.indexOf(activeSection) < index;
              const pr = sectionPRs.current[sectionId];

              return (
                <View key={sectionId}>
                  {isHoverAbove && <View style={styles.dropIndicator} />}

                  <View
                    style={[styles.sectionDragRow, isDragging && styles.sectionDragRowActive]}
                    {...(pr?.panHandlers ?? {})}
                  >
                    <Text style={[styles.sectionDragLabel, isDragging && styles.sectionDragLabelActive]}>
                      {SECTION_LABELS[sectionId]}
                    </Text>
                    <DragHandleIcon active={isDragging} />
                  </View>

                  {isHoverBelow && <View style={styles.dropIndicator} />}
                </View>
              );
            })}
          </View>
        ) : (
          // ── Normal filter view ───────────────────────────────────────────
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {sectionOrder.map(sectionId => {
              if (sectionId === 'categories') return <View key="categories">{renderCategoriesContent()}</View>;
              if (sectionId === 'safeOnly')   return <View key="safeOnly">{renderSafeOnlyContent()}</View>;
              if (sectionId === 'priceRange') return <View key="priceRange">{renderPriceRangeContent()}</View>;
              return null;
            })}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Apply button */}
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>{t('search.apply')}</Text>
        </TouchableOpacity>
      </Animated.View>
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
    left: 0, right: 0,
    maxHeight: SCREEN_H * 0.9,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  handleBar: {
    width: 40, height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerSide:  { minWidth: 44 },
  closeBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  resetBtn: {
    fontSize: 13,
    color: Colors.gray500,
    textAlign: 'right',
  },
  doneBtn: {
    color: Colors.black,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
    marginVertical: 2,
  },

  // Section reorder rows
  reorderHint: {
    fontSize: 12,
    color: Colors.gray500,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionDragRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SECTION_H,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionDragRowActive: {
    backgroundColor: Colors.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  sectionDragLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  sectionDragLabelActive: {
    color: Colors.primary,
  },

  dropIndicator: {
    height: 2,
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    borderRadius: 1,
  },

  // Normal view
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.3,
  },

  categoryList: { paddingBottom: 8 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_H,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  checkboxTouch: { marginRight: 14, padding: 4 },
  checkbox: {
    width: 20, height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  catLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    letterSpacing: -0.27,
  },

  safeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 12,
  },
  safeLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    letterSpacing: -0.3,
  },

  priceSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  priceBox: {
    flex: 1,
    height: 44,
    borderWidth: 0.5,
    borderColor: '#ACACAC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 6,
    justifyContent: 'flex-start',
  },
  priceBoxLabel: {
    fontSize: 10,
    color: Colors.gray500,
    letterSpacing: -0.19,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  priceDollar: {
    fontSize: 14,
    color: Colors.black,
    marginRight: 2,
  },
  priceBoxInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    letterSpacing: -0.27,
    padding: 0,
  },
  priceDash: {
    width: 12,
    height: 1.5,
    backgroundColor: Colors.gray300,
  },

  applyBtn: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: Colors.black,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
});

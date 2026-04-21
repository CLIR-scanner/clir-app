import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecommendStackParamList, RiskLevel } from '../../types';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<RecommendStackParamList, 'Recommend'>;

// ── Constants ─────────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');
const SECTION_ROW_H = 56;

const TABS = ['Week Trends', 'Similar Trends', 'Q&A', 'Magazine'] as const;
type Tab = typeof TABS[number];

const SECTION_LABEL: Record<Tab, string> = {
  'Week Trends':    'Trending This Week',
  'Similar Trends': "Similar Users' Picks",
  'Q&A':            'Q&A',
  'Magazine':       'Clir Magazine',
};

// ── Dummy Data ────────────────────────────────────────────────────────────────

type DummyProduct = {
  id: string;
  name: string;
  brand: string;
  riskLevel: RiskLevel;
  rating: number;
  reviewCount: number;
  image: string;
};

type QAItem       = { id: string; title: string; user: string; date: string };
type MagazineItem = { id: string; title: string; description: string; image: string };

const TRENDING_PRODUCTS: DummyProduct[] = [
  { id: 't1', name: 'Oreo Original',     brand: 'Mondelez',  riskLevel: 'danger',  rating: 4.93, reviewCount: 2391,
    image: 'https://loremflickr.com/200/200/oreo,cookie?lock=11' },
  { id: 't2', name: 'Pringles Original', brand: "Kellogg's", riskLevel: 'caution', rating: 4.87, reviewCount: 1842,
    image: 'https://loremflickr.com/200/200/pringles,chips?lock=12' },
  { id: 't3', name: "Lay's Classic",     brand: 'PepsiCo',   riskLevel: 'safe',    rating: 4.93, reviewCount: 3105,
    image: 'https://loremflickr.com/200/200/lays,potato,chips?lock=13' },
];

const SIMILAR_PRODUCTS: (DummyProduct & { featuredReview?: string })[] = [
  { id: 's1', name: 'Nutella',             brand: 'Ferrero',   riskLevel: 'danger',  rating: 4.90, reviewCount: 2391,
    image: 'https://loremflickr.com/200/200/nutella,chocolate,spread?lock=21',
    featuredReview: '"This spread is absolutely delicious but contains dairy and hazelnuts. Always check the label carefully before purchasing for allergy concerns."' },
  { id: 's2', name: 'PopCorners Sea Salt', brand: 'PepsiCo',   riskLevel: 'safe',    rating: 4.90, reviewCount: 2391,
    image: 'https://loremflickr.com/200/200/popcorn,snack?lock=22' },
  { id: 's3', name: 'Snickers Bar',        brand: 'Mars',      riskLevel: 'danger',  rating: 4.90, reviewCount: 2395,
    image: 'https://loremflickr.com/200/200/snickers,chocolate,bar?lock=23' },
];

const QA_ITEMS: QAItem[] = [
  { id: 'q1', title: 'Is oat milk safe for dairy allergy?',      user: 'sarah_m',     date: '2026.04.18' },
  { id: 'q2', title: 'Best gluten-free snacks recommendation?',  user: 'john_k',      date: '2026.04.16' },
  { id: 'q3', title: 'Hidden peanut ingredients to watch out',   user: 'allergy_dad', date: '2026.04.14' },
];

const MAGAZINE_ITEMS: MagazineItem[] = [
  { id: 'm1', title: 'Top 10 Allergen-Free Snacks of 2026',
    description: 'Discover the best snacks that are free from the top 8 allergens without sacrificing taste.',
    image: 'https://loremflickr.com/400/240/healthy,snack,food?lock=31' },
  { id: 'm2', title: 'Reading Food Labels Like a Pro',
    description: 'A complete guide to understanding ingredient lists and hidden allergen warnings on packaging.',
    image: 'https://loremflickr.com/400/240/food,label,package?lock=32' },
  { id: 'm3', title: 'Vegan Substitutes That Actually Work',
    description: 'From dairy to eggs, these plant-based swaps will make your recipes just as delicious.',
    image: 'https://loremflickr.com/400/240/vegan,plant,food?lock=33' },
];

const BADGE_LABEL: Record<RiskLevel, string> = { safe: 'Good', caution: 'Poor', danger: 'Bad' };
const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    '#4CD964',
  caution: '#FF9500',
  danger:  '#FF3B30',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const color = BADGE_COLOR[riskLevel];
  return (
    <View style={[styles.riskBadge, { borderColor: color }]}>
      <View style={[styles.riskDot, { backgroundColor: color }]} />
      <Text style={[styles.riskLabel, { color }]}>{BADGE_LABEL[riskLevel]}</Text>
    </View>
  );
}

function ProductRow({ item, featuredReview }: { item: DummyProduct; featuredReview?: string }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        <View style={styles.productThumb}>
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productBrand}>{item.brand}</Text>
          <View style={styles.productMeta}>
            <RiskBadge riskLevel={item.riskLevel} />
            <Text style={styles.productRating}>★ {item.rating.toFixed(2)} ({item.reviewCount.toLocaleString()})</Text>
          </View>
        </View>
        <View style={styles.productThumbSm}>
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      </View>
      {featuredReview && (
        <Text style={styles.featuredReview}>{featuredReview}</Text>
      )}
    </View>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionArrow}>›</Text>
    </TouchableOpacity>
  );
}

function CategoryPill() {
  return (
    <TouchableOpacity style={styles.categoryPill} activeOpacity={0.7}>
      <Text style={styles.categoryPillText}>All categories</Text>
      <Text style={styles.categoryPillArrow}>▾</Text>
    </TouchableOpacity>
  );
}

function DragHandleIcon({ active }: { active: boolean }) {
  const color = active ? Colors.primary : Colors.gray300;
  return (
    <View style={dragStyles.wrap}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[dragStyles.bar, { backgroundColor: color }]} />
      ))}
    </View>
  );
}
const dragStyles = StyleSheet.create({
  wrap: { gap: 3.5, alignItems: 'center', justifyContent: 'center', padding: 8 },
  bar:  { width: 18, height: 2, borderRadius: 1 },
});

// ── Reorder Bottom Sheet ──────────────────────────────────────────────────────

function ReorderSheet({
  visible, order, onClose, onApply,
}: {
  visible: boolean;
  order: Tab[];
  onClose: () => void;
  onApply: (next: Tab[]) => void;
}) {
  const slideOffset  = useRef(new Animated.Value(-SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [draft, setDraft]             = useState<Tab[]>(order);
  const [activeId, setActiveId]       = useState<Tab | null>(null);
  const [hoverIdx, setHoverIdx]       = useState<number | null>(null);
  const draftRef    = useRef(draft);
  const activeIdRef = useRef<Tab | null>(null);
  const hoverIdxRef = useRef<number | null>(null);

  useEffect(() => { draftRef.current = draft; }, [draft]);

  useEffect(() => {
    if (visible) {
      setDraft(order);
      Animated.parallel([
        Animated.timing(slideOffset,  { toValue: 0,         duration: 300, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 1,         duration: 300, useNativeDriver: true  }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideOffset,  { toValue: -SCREEN_H, duration: 260, useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0,          duration: 260, useNativeDriver: true  }),
      ]).start();
    }
  }, [visible]);

  function buildPR(id: Tab) {
    function cleanup() {
      activeIdRef.current = null; hoverIdxRef.current = null;
      setActiveId(null); setHoverIdx(null);
    }
    return PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => true,
      onPanResponderGrant: () => {
        const idx = draftRef.current.indexOf(id);
        if (idx === -1) return;
        activeIdRef.current = id; hoverIdxRef.current = idx;
        setActiveId(id); setHoverIdx(idx);
      },
      onPanResponderMove: (_, gs) => {
        const cur = draftRef.current.indexOf(id);
        if (cur === -1) return;
        const next = Math.max(0, Math.min(draftRef.current.length - 1, cur + Math.round(gs.dy / SECTION_ROW_H)));
        if (next !== hoverIdxRef.current) { hoverIdxRef.current = next; setHoverIdx(next); }
      },
      onPanResponderRelease: () => {
        const from = draftRef.current.indexOf(id);
        const to   = hoverIdxRef.current;
        if (from !== -1 && to !== null && from !== to) {
          setDraft(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            draftRef.current = next;
            return next;
          });
        }
        cleanup();
      },
      onPanResponderTerminate: cleanup,
    });
  }

  const prs = useRef<Record<Tab, ReturnType<typeof PanResponder.create>>>(
    {} as Record<Tab, ReturnType<typeof PanResponder.create>>,
  );
  useEffect(() => {
    TABS.forEach(id => { prs.current[id] = buildPR(id); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[sheetStyles.backdrop, { opacity: backdropAnim }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View style={[sheetStyles.sheet, { bottom: slideOffset }]}>
        <View style={sheetStyles.handle} />

        <View style={sheetStyles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={sheetStyles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={sheetStyles.title}>Reorder Sections</Text>
          <TouchableOpacity onPress={() => { onApply(draft); onClose(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={sheetStyles.doneBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={sheetStyles.divider} />
        <Text style={sheetStyles.hint}>Drag to reorder sections</Text>

        {draft.map((id, index) => {
          const isDragging   = activeId === id;
          const isHoverAbove = hoverIdx === index && activeId !== null && !isDragging && draft.indexOf(activeId) > index;
          const isHoverBelow = hoverIdx === index && activeId !== null && !isDragging && draft.indexOf(activeId) < index;
          return (
            <View key={id}>
              {isHoverAbove && <View style={sheetStyles.dropLine} />}
              <View
                style={[sheetStyles.row, isDragging && sheetStyles.rowActive]}
                {...(prs.current[id]?.panHandlers ?? {})}
              >
                <Text style={[sheetStyles.rowLabel, isDragging && sheetStyles.rowLabelActive]}>
                  {SECTION_LABEL[id]}
                </Text>
                <DragHandleIcon active={isDragging} />
              </View>
              {isHoverBelow && <View style={sheetStyles.dropLine} />}
            </View>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  handle:   { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title:    { fontSize: 16, fontWeight: '700', color: Colors.black },
  closeBtn: { fontSize: 14, fontWeight: '600', color: Colors.black, minWidth: 44 },
  doneBtn:  { fontSize: 14, fontWeight: '700', color: Colors.black, textAlign: 'right', minWidth: 44 },
  divider:  { height: 1, backgroundColor: Colors.border, marginHorizontal: 12 },
  hint:     { fontSize: 12, color: Colors.gray500, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', height: SECTION_ROW_H,
    paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  rowActive:      { backgroundColor: Colors.gray100 },
  rowLabel:       { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.black },
  rowLabelActive: { color: Colors.primary },
  dropLine:       { height: 2, backgroundColor: Colors.primary, marginHorizontal: 24, borderRadius: 1 },
});

// ── CommunityScreen ───────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState<Tab>('Week Trends');
  const [sectionOrder, setSectionOrder] = useState<Tab[]>([...TABS]);
  const [showReorder,  setShowReorder]  = useState(false);

  const mainScrollRef   = useRef<ScrollView>(null);
  const tabScrollRef    = useRef<ScrollView>(null);
  const sectionY        = useRef<Partial<Record<Tab, number>>>({});
  const tabX            = useRef<Partial<Record<Tab, number>>>({});
  const activeTabRef    = useRef<Tab>('Week Trends');
  const isProgrammatic  = useRef(false);
  // sectionOrder의 최신값을 클로저 없이 참조
  const sectionOrderRef = useRef<Tab[]>([...TABS]);

  function onSectionLayout(tab: Tab) {
    return (e: LayoutChangeEvent) => { sectionY.current[tab] = e.nativeEvent.layout.y; };
  }
  function onTabLayout(tab: Tab) {
    return (e: LayoutChangeEvent) => { tabX.current[tab] = e.nativeEvent.layout.x; };
  }

  function scrollTabIntoView(tab: Tab) {
    const x = tabX.current[tab] ?? 0;
    tabScrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }

  function handleTabPress(tab: Tab) {
    isProgrammatic.current = true;
    activeTabRef.current = tab;
    setActiveTab(tab);
    scrollTabIntoView(tab);
    mainScrollRef.current?.scrollTo({ y: sectionY.current[tab] ?? 0, animated: true });
  }

  function handleScrollEnd() { isProgrammatic.current = false; }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const order = sectionOrderRef.current;

    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 50) {
      const last = order[order.length - 1];
      if (last !== activeTabRef.current) {
        activeTabRef.current = last; setActiveTab(last); scrollTabIntoView(last);
      }
      return;
    }
    const scrollY = contentOffset.y + 60;
    let current: Tab = order[0];
    for (const tab of order) {
      const offset = sectionY.current[tab];
      if (offset !== undefined && scrollY >= offset) current = tab;
    }
    if (current !== activeTabRef.current) {
      activeTabRef.current = current; setActiveTab(current); scrollTabIntoView(current);
    }
  }

  function renderSection(tab: Tab) {
    switch (tab) {
      case 'Week Trends':
        return (
          <View style={styles.section}>
            <SectionHeader title="Trending This Week" onPress={() => navigation.navigate('WeekendPopular')} />
            <CategoryPill />
            {TRENDING_PRODUCTS.map(item => <ProductRow key={item.id} item={item} />)}
          </View>
        );
      case 'Similar Trends':
        return (
          <View style={styles.section}>
            <SectionHeader title="Similar Users' Picks" onPress={() => navigation.navigate('SimilarUsersFavorites')} />
            <CategoryPill />
            {SIMILAR_PRODUCTS.map(item => <ProductRow key={item.id} item={item} featuredReview={item.featuredReview} />)}
          </View>
        );
      case 'Q&A':
        return (
          <View style={styles.section}>
            <SectionHeader title="Q&A" />
            {QA_ITEMS.map(item => (
              <TouchableOpacity key={item.id} style={styles.qaRow} activeOpacity={0.7}>
                <View style={styles.qaInfo}>
                  <Text style={styles.qaTitle}>{item.title}</Text>
                  <Text style={styles.qaMeta}>{item.user}</Text>
                </View>
                <Text style={styles.qaDate}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'Magazine':
        return (
          <View style={styles.section}>
            <SectionHeader title="Clir Magazine" />
            <FlatList
              data={MAGAZINE_ITEMS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.magazineList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.magazineCard} activeOpacity={0.8}>
                  <View style={styles.magazineImg}>
                    <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </View>
                  <View style={styles.magazineBody}>
                    <Text style={styles.magazineTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.magazineDesc}  numberOfLines={3}>{item.description}</Text>
                    <Text style={styles.magazineSeeMore}>See more</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        );
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity
          onPress={() => setShowReorder(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your Product"
            placeholderTextColor={Colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ── Tab pills (follows sectionOrder) ───────────────────────────── */}
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {sectionOrder.map(tab => (
          <TouchableOpacity
            key={tab}
            onLayout={onTabLayout(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Main scroll ────────────────────────────────────────────────── */}
      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Banner Ad ─────────────────────────────────────────────────── */}
        <View style={styles.bannerWrap}>
          <View style={styles.banner}>
            <Image
              source={{ uri: 'https://loremflickr.com/800/320/healthy,food,market?lock=99' }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerInner}>
              <Text style={styles.bannerTag}>AD</Text>
              <Text style={styles.bannerHeadline}>Discover Allergen-Free Products</Text>
              <Text style={styles.bannerSub}>Safe picks curated just for you</Text>
              <View style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>Shop Now →</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Sections in dynamic order ─────────────────────────────────── */}
        {sectionOrder.map((tab, i) => (
          <View key={`${i}-${tab}`} onLayout={onSectionLayout(tab)}>
            {renderSection(tab)}
            {i < sectionOrder.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>

      {/* ── Reorder bottom sheet ───────────────────────────────────────── */}
      <ReorderSheet
        visible={showReorder}
        order={sectionOrder}
        onClose={() => setShowReorder(false)}
        onApply={(next) => {
          sectionOrderRef.current = next;
          setSectionOrder(next);
          const first = next[0];
          activeTabRef.current = first;
          setActiveTab(first);
          // sectionY 초기화 — 재렌더 후 onLayout이 새 위치로 다시 채움
          sectionY.current = {};
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.black, letterSpacing: -0.38 },
  menuIcon:    { fontSize: 24, color: Colors.black },

  searchBarWrap: { paddingHorizontal: 24, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray100, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon:  { fontSize: 18, color: Colors.gray500 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black, padding: 0 },

  tabScroll:        { maxHeight: 44 },
  tabScrollContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  tabActive:     { backgroundColor: Colors.black, borderColor: Colors.black },
  tabText:       { fontSize: 13, fontWeight: '500', color: Colors.gray500 },
  tabTextActive: { color: Colors.white, fontWeight: '700' },

  scroll:  { flex: 1, marginTop: 12 },
  section: { paddingHorizontal: 24, paddingVertical: 16 },
  divider: { height: 1, backgroundColor: Colors.border },

  // Banner
  bannerWrap: { paddingHorizontal: 24, paddingBottom: 4 },
  banner: {
    height: 160, borderRadius: 16,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerInner:    { alignItems: 'center', gap: 6 },
  bannerTag:      { fontSize: 10, fontWeight: '800', color: '#FFD60A', letterSpacing: 1.5, textTransform: 'uppercase' },
  bannerHeadline: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  bannerSub:      { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  bannerCta: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 7,
    backgroundColor: '#FFFFFF', borderRadius: 20,
  },
  bannerCtaText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: Colors.black, letterSpacing: -0.3 },
  sectionArrow:  { fontSize: 24, color: Colors.gray300, lineHeight: 28 },

  // Category pill
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, gap: 4, marginBottom: 12,
    backgroundColor: Colors.white,
  },
  categoryPillText:  { fontSize: 13, color: Colors.black },
  categoryPillArrow: { fontSize: 11, color: Colors.gray500 },

  // Product card
  productCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  productRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productThumb:   { width: 64, height: 64, borderRadius: 10, flexShrink: 0, overflow: 'hidden', backgroundColor: Colors.gray100 },
  productThumbSm: { width: 44, height: 44, borderRadius: 8,  flexShrink: 0, overflow: 'hidden', backgroundColor: Colors.gray100 },
  productInfo:    { flex: 1, gap: 2 },
  productName:    { fontSize: 14, fontWeight: '700', color: Colors.black },
  productBrand:   { fontSize: 12, color: Colors.gray500 },
  productMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productRating:  { fontSize: 12, color: Colors.gray500 },

  riskBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 28, paddingVertical: 4, paddingHorizontal: 9, gap: 5,
  },
  riskDot:   { width: 8, height: 8, borderRadius: 4 },
  riskLabel: { fontSize: 11, fontWeight: '600', letterSpacing: -0.2 },

  featuredReview: { fontSize: 13, color: Colors.gray700, lineHeight: 19, marginTop: 10, fontStyle: 'italic' },

  // Q&A
  qaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  qaInfo:  { flex: 1, gap: 3 },
  qaTitle: { fontSize: 14, fontWeight: '600', color: Colors.black },
  qaMeta:  { fontSize: 12, color: Colors.gray500 },
  qaDate:  { fontSize: 12, color: Colors.gray500, marginLeft: 12 },

  // Magazine
  magazineList: { gap: 12 },
  magazineCard: {
    width: 200, backgroundColor: Colors.white, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
  },
  magazineImg: { width: '100%', height: 120, backgroundColor: Colors.gray100, overflow: 'hidden' },
  magazineBody:     { padding: 12, gap: 4 },
  magazineTitle:    { fontSize: 13, fontWeight: '700', color: Colors.black, lineHeight: 18 },
  magazineDesc:     { fontSize: 11, color: Colors.gray500, lineHeight: 16 },
  magazineSeeMore:  { fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '600' },
});

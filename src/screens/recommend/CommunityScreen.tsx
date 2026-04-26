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
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';

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

// ── Design tokens (from Figma) ────────────────────────────────────────────────

const C = {
  bg:      Colors.scanLightGreen,   // #F9FFF3
  dark:    Colors.searchDarkGreen,  // #1C3A19
  mid:     Colors.searchMutedGreen, // #556C53
  muted:   Colors.scanMutedGreen,   // #A9B6A8
  cardBg:  'rgba(169,182,168,0.3)',
  thumbBg: '#D9D9D9',
  line:    '#D9D9D9',
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

const SIMILAR_PRODUCTS: (DummyProduct & { featuredReview: string })[] = [
  { id: 's1', name: 'Nutella',             brand: 'Ferrero',   riskLevel: 'danger',  rating: 4.90, reviewCount: 2391,
    image: 'https://loremflickr.com/200/200/nutella,chocolate,spread?lock=21',
    featuredReview: '"This spread is absolutely delicious, but contains dairy and hazelnuts. Always check the label carefully before purchasing if you have allergy concerns."' },
  { id: 's2', name: 'PopCorners Sea Salt', brand: 'PepsiCo',   riskLevel: 'safe',    rating: 4.90, reviewCount: 2391,
    image: 'https://loremflickr.com/200/200/popcorn,snack?lock=22',
    featuredReview: '"Great allergen-free snack! Light and crispy with just the right amount of salt. I buy these every week — safe for my whole family including the kids."' },
  { id: 's3', name: 'Snickers Bar',        brand: 'Mars',      riskLevel: 'danger',  rating: 4.90, reviewCount: 2395,
    image: 'https://loremflickr.com/200/200/snickers,chocolate,bar?lock=23',
    featuredReview: '"Tastes amazing but definitely not safe for peanut allergies. The label is clear about it. Would love a peanut-free version — please make one, Mars!"' },
];

const QA_ITEMS: QAItem[] = [
  { id: 'q1', title: 'Is oat milk safe for dairy allergy?',      user: 'sarah_m',     date: '2026.04.19' },
  { id: 'q2', title: 'Best gluten-free snacks recommendation?',  user: 'john_k',      date: '2026.04.19' },
  { id: 'q3', title: 'Hidden peanut ingredients to watch out',   user: 'allergy_dad', date: '2026.04.19' },
];

const MAGAZINE_ITEMS: MagazineItem[] = [
  { id: 'm1', title: 'Top 10 Allergen-Free Snacks of 2026',
    description: "Magazine's contents will be placed here. Discover the best snacks free from top 8 allergens.",
    image: 'https://loremflickr.com/400/240/healthy,snack,food?lock=31' },
  { id: 'm2', title: 'Reading Food Labels Like a Pro',
    description: "Magazine's contents will be placed here. A complete guide to ingredient lists and allergen warnings.",
    image: 'https://loremflickr.com/400/240/food,label,package?lock=32' },
  { id: 'm3', title: 'Vegan Substitutes That Actually Work',
    description: "Magazine's contents will be placed here. Plant-based swaps that make recipes just as delicious.",
    image: 'https://loremflickr.com/400/240/vegan,plant,food?lock=33' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const BADGE_LABEL: Record<RiskLevel, string> = { safe: 'Good', caution: 'Poor', danger: 'Bad' };
const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger:  Colors.searchWrong,
};

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const color = BADGE_COLOR[riskLevel];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <RiskBadgeIcon level={riskLevel} size={16} />
      <Text style={[styles.badgeText, { color }]}>{BADGE_LABEL[riskLevel]}</Text>
    </View>
  );
}

function ProductRow({
  item,
  showChevron = false,
}: {
  item: DummyProduct;
  showChevron?: boolean;
}) {
  return (
    <View style={styles.productRow}>
      <View style={styles.productThumb}>
        <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.productMeta}>
          <RiskBadge riskLevel={item.riskLevel} />
          <Text style={styles.productRating}>
            ⭐️ {item.rating.toFixed(2)} ({item.reviewCount.toLocaleString()})
          </Text>
        </View>
      </View>
      {showChevron && <Text style={styles.rowChevron}>›</Text>}
    </View>
  );
}

// 각 카드 리뷰가 순서대로 1개씩 표시
function SimilarList() {
  const [activeIdx, setActiveIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setActiveIdx(prev => (prev + 1) % SIMILAR_PRODUCTS.length);
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.cardList}>
      {SIMILAR_PRODUCTS.map((item, i) => (
        <View key={item.id} style={styles.simCard}>
          <View style={styles.simCardTop}>
            <ProductRow item={item} showChevron />
          </View>
          {i === activeIdx && (
            <Animated.View style={[styles.reviewBox, { opacity }]}>
              <Text style={styles.reviewText}>{item.featuredReview}</Text>
            </Animated.View>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

function BannerAd() {
  return (
    <View style={bannerSt.wrap}>
      <Image
        source={{ uri: 'https://loremflickr.com/800/380/healthy,food,grocery?lock=77' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={bannerSt.overlay} />
      <Text style={bannerSt.tag}>FEATURED</Text>
      <Text style={bannerSt.title}>{'Eat Smart,\nLive Allergy-Free'}</Text>
      <Text style={bannerSt.sub}>Scan any product to check ingredients instantly</Text>
    </View>
  );
}

const bannerSt = StyleSheet.create({
  wrap: {
    height: 190,
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#25FF81',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
});

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionChevron}>›</Text>
    </TouchableOpacity>
  );
}

function CategoryPill() {
  return (
    <TouchableOpacity style={styles.categoryPill} activeOpacity={0.7}>
      <Text style={styles.categoryPillText}>All categories</Text>
    </TouchableOpacity>
  );
}

function DragHandleIcon({ active }: { active: boolean }) {
  const color = active ? C.dark : C.muted;
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
  handle:   { width: 40, height: 4, backgroundColor: C.muted, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title:    { fontSize: 16, fontWeight: '700', color: C.dark },
  closeBtn: { fontSize: 14, fontWeight: '600', color: C.dark, minWidth: 44 },
  doneBtn:  { fontSize: 14, fontWeight: '700', color: C.dark, textAlign: 'right', minWidth: 44 },
  divider:  { height: 1, backgroundColor: C.line, marginHorizontal: 12 },
  hint:     { fontSize: 12, color: C.muted, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', height: SECTION_ROW_H,
    paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: C.line,
    backgroundColor: Colors.white,
  },
  rowActive:      { backgroundColor: '#F0F5EF' },
  rowLabel:       { flex: 1, fontSize: 15, fontWeight: '600', color: C.dark },
  rowLabelActive: { color: C.mid },
  dropLine:       { height: 2, backgroundColor: C.mid, marginHorizontal: 24, borderRadius: 1 },
});

// ── CommunityScreen ───────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState<Tab>('Week Trends');
  const [sectionOrder, setSectionOrder] = useState<Tab[]>([...TABS]);
  const [showReorder,  setShowReorder]  = useState(false);

  const mainScrollRef    = useRef<ScrollView>(null);
  const sectionY         = useRef<Partial<Record<Tab, number>>>({});
  const sectionViewRefs  = useRef<Partial<Record<Tab, View | null>>>({});
  const scrollOffset     = useRef(0);
  const activeTabRef     = useRef<Tab>('Week Trends');
  const isProgrammatic   = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionOrderRef  = useRef<Tab[]>([...TABS]);

  function onSectionLayout(tab: Tab) {
    return (e: LayoutChangeEvent) => { sectionY.current[tab] = e.nativeEvent.layout.y; };
  }

  // 섹션 Y 위치를 화면 측정으로 정밀 보정 (onLayout 오차 보완)
  function remeasureSections() {
    const scroll = mainScrollRef.current;
    if (!scroll) return;
    (scroll as unknown as { measure: (cb: (...n: number[]) => void) => void })
      .measure((...sv: number[]) => {
        const vPageY = sv[5] ?? 0;
        sectionOrderRef.current.forEach(tab => {
          const view = sectionViewRefs.current[tab];
          if (!view) return;
          view.measure((_x: number, _y: number, _w: number, _h: number, _px: number, sPageY: number) => {
            sectionY.current[tab] = sPageY - vPageY + scrollOffset.current;
          });
        });
      });
  }

  useEffect(() => {
    const timer = setTimeout(remeasureSections, 600);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabPress(tab: Tab) {
    isProgrammatic.current = true;
    activeTabRef.current = tab;
    setActiveTab(tab);

    if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
    programmaticTimer.current = setTimeout(() => {
      isProgrammatic.current = false;
    }, 900);

    const sectionView = sectionViewRefs.current[tab];
    const scrollView  = mainScrollRef.current;

    if (sectionView && scrollView) {
      sectionView.measure((_x: number, _y: number, _w: number, _h: number, _px: number, sPageY: number) => {
        (scrollView as unknown as { measure: (cb: (...n: number[]) => void) => void })
          .measure((...n: number[]) => {
            const vPageY = n[5] ?? 0;
            const targetY = Math.max(0, sPageY - vPageY + scrollOffset.current);
            scrollView.scrollTo({ y: targetY, animated: true });
          });
      });
      return;
    }
    scrollView?.scrollTo({ y: sectionY.current[tab] ?? 0, animated: true });
  }

  function handleScrollEnd() {
    isProgrammatic.current = false;
    if (programmaticTimer.current) { clearTimeout(programmaticTimer.current); programmaticTimer.current = null; }
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
    if (isProgrammatic.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const order = sectionOrderRef.current;

    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 50) {
      const last = order[order.length - 1];
      if (last !== activeTabRef.current) { activeTabRef.current = last; setActiveTab(last); }
      return;
    }
    const scrollY = contentOffset.y + layoutMeasurement.height * 0.25;
    let current: Tab = order[0];
    for (const tab of order) {
      const offset = sectionY.current[tab];
      if (offset !== undefined && scrollY >= offset) current = tab;
    }
    if (current !== activeTabRef.current) { activeTabRef.current = current; setActiveTab(current); }
  }

  function renderSection(tab: Tab) {
    switch (tab) {
      case 'Week Trends':
        return (
          <View style={styles.section}>
            <SectionHeader title="Trending This Week" onPress={() => navigation.navigate('WeekendPopular')} />
            <CategoryPill />
            <View style={styles.trendList}>
              {TRENDING_PRODUCTS.map((item, idx) => (
                <View key={item.id}>
                  <ProductRow item={item} />
                  {idx < TRENDING_PRODUCTS.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </View>
          </View>
        );

      case 'Similar Trends':
        return (
          <View style={styles.section}>
            <SectionHeader title="Similar Users' Picks" onPress={() => navigation.navigate('SimilarUsersFavorites')} />
            <CategoryPill />
            <SimilarList />
          </View>
        );

      case 'Q&A':
        return (
          <View style={styles.section}>
            <SectionHeader title="Q&A" />
            {QA_ITEMS.map((item, idx) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.qaRow} activeOpacity={0.7}>
                  <Text style={styles.qaTitle}>{item.title}</Text>
                  <View style={styles.qaMeta}>
                    <Text style={styles.qaUser}>{item.user}</Text>
                    <Text style={styles.qaDate}>{item.date}</Text>
                  </View>
                </TouchableOpacity>
                {idx < QA_ITEMS.length - 1 && <View style={styles.rowDivider} />}
              </View>
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
              contentContainerStyle={styles.magList}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.magCard} activeOpacity={0.85}>
                  <View style={styles.magImgBox}>
                    <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  </View>
                  <View style={styles.magContent}>
                    <Text style={styles.magTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.magDesc}  numberOfLines={4}>{item.description}</Text>
                    <Text style={styles.magSeeMore}>See more</Text>
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
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Products"
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          style={styles.searchFilterBtn}
          onPress={() => setShowReorder(true)}
          activeOpacity={0.7}
        >
          <View style={styles.sortLine} />
          <View style={[styles.sortLine, { width: 13 }]} />
          <View style={[styles.sortLine, { width: 8 }]} />
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {sectionOrder.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
              {isActive && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.tabBarLine} />

      {/* ── Main scroll ────────────────────────────────────────────────── */}
      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onContentSizeChange={remeasureSections}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Promotional banner ─────────────────────────────────────── */}
        <View style={styles.bannerWrap}>
          <BannerAd />
        </View>

        {/* ── Sections ──────────────────────────────────────────────── */}
        {sectionOrder.map((tab, i) => (
          <View
            key={`${i}-${tab}`}
            ref={r => { sectionViewRefs.current[tab] = r; }}
            onLayout={onSectionLayout(tab)}
          >
            {renderSection(tab)}
            {i < sectionOrder.length - 1 && <View style={styles.sectionDivider} />}
          </View>
        ))}
      </ScrollView>

      {/* ── Reorder bottom sheet ───────────────────────────────────────── */}
      <ReorderSheet
        visible={showReorder}
        order={sectionOrder}
        onClose={() => setShowReorder(false)}
        onApply={next => {
          sectionOrderRef.current = next;
          setSectionOrder(next);
          const first = next[0];
          activeTabRef.current = first;
          setActiveTab(first);
          sectionY.current = {};
          setTimeout(remeasureSections, 600);
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.dark,
    letterSpacing: -0.38,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 25,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: C.muted,
    padding: 0,
  },
  searchFilterBtn: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sortLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.dark,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.muted,
    lineHeight: 18,
  },
  tabTextActive: {
    color: C.dark,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.dark,
    borderRadius: 1,
  },
  tabBarLine: {
    height: 1,
    backgroundColor: C.line,
    marginBottom: 4,
  },

  // Scroll / Sections
  scroll:        { flex: 1 },
  section:       { paddingHorizontal: 27, paddingTop: 36, paddingBottom: 32 },
  sectionDivider:{ height: 14, backgroundColor: '#E6EBE5' },

  // Banner
  bannerWrap: { paddingHorizontal: 23, paddingTop: 16, paddingBottom: 8 },
  banner:     { height: 190, borderRadius: 9, backgroundColor: C.thumbBg },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: C.dark },
  sectionChevron:{ fontSize: 18, color: C.dark, fontWeight: '400' },

  // Category pill
  categoryPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 50,
    paddingHorizontal: 19,
    paddingVertical: 3,
    marginBottom: 18,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.dark,
    letterSpacing: -0.228,
  },

  // Product row (shared for Trending + Similar inner)
  productRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  productThumb: {
    width: 68,
    height: 68,
    borderRadius: 9,
    backgroundColor: C.thumbBg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  productInfo:  { flex: 1, gap: 3 },
  productName:  { fontSize: 14, fontWeight: '700', color: C.mid, letterSpacing: -0.266 },
  productBrand: { fontSize: 10, color: C.mid, letterSpacing: -0.19 },
  productMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  productRating:{ fontSize: 10, color: C.mid, letterSpacing: -0.19 },
  rowChevron:   { fontSize: 18, color: C.dark, marginLeft: 4 },

  // Trending list
  trendList: { gap: 0 },
  rowDivider:{ height: 1, backgroundColor: C.line, marginVertical: 14 },

  // Similar cards
  cardList: { gap: 12 },
  simCard: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 20,
    overflow: 'hidden',
  },
  simCardTop: { padding: 14 },
  reviewBox: {
    backgroundColor: C.cardBg,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.mid,
    letterSpacing: -0.285,
    lineHeight: 21,
  },

  // Q&A
  qaRow:   { paddingVertical: 12 },
  qaTitle: { fontSize: 14, fontWeight: '700', color: C.dark, letterSpacing: -0.266, marginBottom: 4 },
  qaMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  qaUser:  { fontSize: 10, color: C.dark, letterSpacing: -0.19 },
  qaDate:  { fontSize: 10, color: C.dark, letterSpacing: -0.19 },

  // Risk badge (icon + text, search-tab style)
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
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Review cycling dots
  reviewDots: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 10,
  },
  reviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.muted,
  },
  reviewDotActive: {
    width: 16,
    backgroundColor: C.mid,
  },

  // Magazine
  magList: { gap: 11 },
  magCard: {
    width: 288,
    height: 229,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 11,
    backgroundColor: C.cardBg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  magImgBox: {
    width: 145,
    margin: 9,
    borderRadius: 8,
    backgroundColor: C.dark,
    overflow: 'hidden',
  },
  magContent: {
    flex: 1,
    paddingTop: 19,
    paddingRight: 10,
    paddingBottom: 10,
  },
  magTitle:   { fontSize: 15, fontWeight: '700', color: C.dark, lineHeight: 20 },
  magDesc:    { fontSize: 10, color: C.mid, lineHeight: 14, marginTop: 8 },
  magSeeMore: { fontSize: 10, color: C.dark, textDecorationLine: 'underline', marginTop: 8 },

});

import React, { useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecommendStackParamList, RiskLevel } from '../../types';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<RecommendStackParamList, 'Recommend'>;

// ── Dummy Data ────────────────────────────────────────────────────────────────

type DummyProduct = {
  id: string;
  name: string;
  brand: string;
  riskLevel: RiskLevel;
  rating: number;
  reviewCount: number;
};

type QAItem    = { id: string; title: string; user: string; date: string };
type MagazineItem = { id: string; title: string; description: string };

const TRENDING_PRODUCTS: DummyProduct[] = [
  { id: 't1', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.93, reviewCount: 2391 },
  { id: 't2', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.92, reviewCount: 2388 },
  { id: 't3', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.93, reviewCount: 2395 },
];

const SIMILAR_PRODUCTS: (DummyProduct & { featuredReview?: string })[] = [
  {
    id: 's1', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.90, reviewCount: 2391,
    featuredReview: '"This juice is amazing taste blabla. I want to go home this is 10pm right now haha I want to go home. Coffee is delicious. Reviews Summary."',
  },
  { id: 's2', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.90, reviewCount: 2391 },
  { id: 's3', name: 'Product Name', brand: 'Brand Name', riskLevel: 'danger', rating: 4.90, reviewCount: 2395 },
];

const QA_ITEMS: QAItem[] = [
  { id: 'q1', title: 'Question Title', user: 'User Name', date: '2026.04.10' },
  { id: 'q2', title: 'Question Title', user: 'User Name', date: '2026.04.10' },
  { id: 'q3', title: 'Question Title', user: 'User Name', date: '2026.04.31' },
];

const MAGAZINE_ITEMS: MagazineItem[] = [
  { id: 'm1', title: 'Magazine title is placed here', description: 'Magazine contents are placed here drkj2lsndj2s drkjlsndj2s drkjlsndj2s' },
  { id: 'm2', title: 'Magazine title is placed here', description: 'Magazine contents are placed here drkj2lsndj2s drkjlsndj2s drkjlsndj2s' },
  { id: 'm3', title: 'Magazine title is placed here', description: 'Magazine contents are placed here drkj2lsndj2s drkjlsndj2s drkjlsndj2s' },
];

const TABS = ['Week Trends', 'Similar Trends', 'Q&A', 'Magazine'] as const;
type Tab = typeof TABS[number];

const SECTION_TAB: Tab[] = ['Week Trends', 'Similar Trends', 'Q&A', 'Magazine'];

const RISK_LABEL: Record<RiskLevel, string> = { safe: 'Good', caution: 'Poor', danger: 'Bad' };
const RISK_COLOR: Record<RiskLevel, string> = { safe: '#4CD964', caution: '#FF9500', danger: '#FF3B30' };

// ── Sub-components ────────────────────────────────────────────────────────────

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const color = RISK_COLOR[riskLevel];
  return (
    <View style={[styles.riskBadge, { backgroundColor: color }]}>
      <Text style={styles.riskBadgeText}>{RISK_LABEL[riskLevel]}</Text>
    </View>
  );
}

function ProductRow({ item, featuredReview }: { item: DummyProduct; featuredReview?: string }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productRow}>
        <View style={styles.productThumb} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productBrand}>{item.brand}</Text>
          <View style={styles.productMeta}>
            <RiskBadge riskLevel={item.riskLevel} />
            <Text style={styles.productRating}>★ {item.rating.toFixed(2)} ({item.reviewCount.toLocaleString()})</Text>
          </View>
        </View>
        <View style={styles.productThumbSm} />
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

// ── CommunityScreen ───────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab,   setActiveTab]   = useState<Tab>('Week Trends');
  const [searchQuery, setSearchQuery] = useState('');

  const mainScrollRef = useRef<ScrollView>(null);
  const tabScrollRef  = useRef<ScrollView>(null);

  const sectionY          = useRef<Partial<Record<Tab, number>>>({});
  const tabX              = useRef<Partial<Record<Tab, number>>>({});
  const activeTabRef      = useRef<Tab>('Week Trends');
  // 탭 클릭으로 인한 프로그래밍 스크롤 중에는 scroll-spy 비활성화
  const isProgrammatic    = useRef(false);

  function onSectionLayout(tab: Tab) {
    return (e: LayoutChangeEvent) => {
      sectionY.current[tab] = e.nativeEvent.layout.y;
    };
  }

  function onTabLayout(tab: Tab) {
    return (e: LayoutChangeEvent) => {
      tabX.current[tab] = e.nativeEvent.layout.x;
    };
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
    const y = sectionY.current[tab] ?? 0;
    mainScrollRef.current?.scrollTo({ y, animated: true });
  }

  function handleScrollEnd() {
    isProgrammatic.current = false;
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isProgrammatic.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;

    // 바닥 근처면 마지막 탭 활성화
    const isNearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    if (isNearBottom) {
      const lastTab = SECTION_TAB[SECTION_TAB.length - 1];
      if (lastTab !== activeTabRef.current) {
        activeTabRef.current = lastTab;
        setActiveTab(lastTab);
        scrollTabIntoView(lastTab);
      }
      return;
    }

    const scrollY = contentOffset.y + 60;
    let current: Tab = SECTION_TAB[0];
    for (const tab of SECTION_TAB) {
      const offset = sectionY.current[tab];
      if (offset !== undefined && scrollY >= offset) current = tab;
    }
    if (current !== activeTabRef.current) {
      activeTabRef.current = current;
      setActiveTab(current);
      scrollTabIntoView(current);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

      {/* ── Tab pills ──────────────────────────────────────────────────── */}
      <ScrollView
        ref={tabScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
      >
        {TABS.map(tab => (
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

        {/* ── Trending This Week ──────────────────────────────────────── */}
        <View onLayout={onSectionLayout('Week Trends')} style={styles.section}>
          <SectionHeader
            title="Trending This Week"
            onPress={() => navigation.navigate('WeekendPopular')}
          />
          <CategoryPill />
          {TRENDING_PRODUCTS.map(item => (
            <ProductRow key={item.id} item={item} />
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Similar Users' Picks ────────────────────────────────────── */}
        <View onLayout={onSectionLayout('Similar Trends')} style={styles.section}>
          <SectionHeader
            title="Similar Users' Picks"
            onPress={() => navigation.navigate('SimilarUsersFavorites')}
          />
          <CategoryPill />
          {SIMILAR_PRODUCTS.map(item => (
            <ProductRow key={item.id} item={item} featuredReview={item.featuredReview} />
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Q&A ─────────────────────────────────────────────────────── */}
        <View onLayout={onSectionLayout('Q&A')} style={styles.section}>
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

        <View style={styles.divider} />

        {/* ── Clir Magazine ───────────────────────────────────────────── */}
        <View onLayout={onSectionLayout('Magazine')} style={styles.section}>
          <SectionHeader title="Clir Magazine" />
          <FlatList
            data={MAGAZINE_ITEMS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.magazineList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.magazineCard} activeOpacity={0.8}>
                <View style={styles.magazineImg} />
                <View style={styles.magazineBody}>
                  <Text style={styles.magazineTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.magazineDesc}  numberOfLines={3}>{item.description}</Text>
                  <Text style={styles.magazineSeeMore}>See more</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: Colors.black, letterSpacing: -0.38 },
  menuIcon:    { fontSize: 22, color: Colors.black },

  searchBarWrap: { paddingHorizontal: 24, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon:  { fontSize: 18, color: Colors.gray500 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.black, padding: 0 },

  tabScroll:        { maxHeight: 44 },
  tabScrollContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  tabActive:      { backgroundColor: Colors.black, borderColor: Colors.black },
  tabText:        { fontSize: 13, fontWeight: '500', color: Colors.gray500 },
  tabTextActive:  { color: Colors.white, fontWeight: '700' },

  scroll:   { flex: 1, marginTop: 12 },
  section:  { paddingHorizontal: 24, paddingVertical: 16 },
  divider:  { height: 1, backgroundColor: Colors.border },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.black, letterSpacing: -0.3 },
  sectionArrow: { fontSize: 24, color: Colors.gray300, lineHeight: 28 },

  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  categoryPillText:  { fontSize: 13, color: Colors.black },
  categoryPillArrow: { fontSize: 11, color: Colors.gray500 },

  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productThumb:  { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.gray100, flexShrink: 0 },
  productThumbSm:{ width: 44, height: 44, borderRadius: 8,  backgroundColor: Colors.gray100, flexShrink: 0 },
  productInfo:   { flex: 1, gap: 2 },
  productName:   { fontSize: 14, fontWeight: '700', color: Colors.black },
  productBrand:  { fontSize: 12, color: Colors.gray500 },
  productMeta:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productRating: { fontSize: 12, color: Colors.gray500 },

  riskBadge:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  riskBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  featuredReview: { fontSize: 13, color: Colors.gray700, lineHeight: 19, marginTop: 10, fontStyle: 'italic' },

  qaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  qaInfo:  { flex: 1, gap: 3 },
  qaTitle: { fontSize: 14, fontWeight: '600', color: Colors.black },
  qaMeta:  { fontSize: 12, color: Colors.gray500 },
  qaDate:  { fontSize: 12, color: Colors.gray500, marginLeft: 12 },

  magazineList: { gap: 12 },
  magazineCard: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  magazineImg:    { width: '100%', height: 120, backgroundColor: Colors.gray100 },
  magazineBody:   { padding: 12, gap: 4 },
  magazineTitle:  { fontSize: 13, fontWeight: '700', color: Colors.black, lineHeight: 18 },
  magazineDesc:   { fontSize: 11, color: Colors.gray500, lineHeight: 16 },
  magazineSeeMore:{ fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '600' },
});

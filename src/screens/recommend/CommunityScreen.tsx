import React, { useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
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
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MagazineItem, Product, Profile, QAQuestion, RecommendStackParamList, RiskLevel } from '../../types';
import { Colors } from '../../constants/colors';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import { getMagazineItems, getQAQuestions, getSimilarUsersFavorites, getWeekendPopular } from '../../services/recommend.service';
import { INITIAL_FILTER_CATEGORIES } from '../../components/common/FilterBottomSheet';
import { useUserStore } from '../../store/user.store';
import { getAllergenDisplayName } from '../../lib/display-names';
import { DIET_LABELS } from '../../constants/dietary';

type Props = NativeStackScreenProps<RecommendStackParamList, 'Recommend'>;

// ── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

const TABS = ['Week Trends', 'Similar Trends', 'Q&A', 'Magazine'] as const;
type Tab = typeof TABS[number];

const SECTION_LABEL_KEY: Record<Tab, string> = {
  'Week Trends':    'recommendUi.trendingTab',
  'Similar Trends': 'recommendUi.similarPicksTab',
  'Q&A':            'recommendUi.qa',
  'Magazine':       'recommendUi.magazineTab',
};
const CATEGORY_IDS = ['all', ...INITIAL_FILTER_CATEGORIES.map(cat => cat.id)];

// ── Design tokens (from Figma) ────────────────────────────────────────────────

const C = {
  bg:      Colors.scanLightGreen,   // #F9FFF3
  dark:    Colors.searchDarkGreen,  // #1C3A19
  productText: '#044733',
  mid:     Colors.searchMutedGreen, // #556C53
  muted:   Colors.scanMutedGreen,   // #A9B6A8
  cardBg:  'rgba(169,182,168,0.3)',
  reviewBg: 'rgba(4,71,51,0.08)',
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
  category?: string;
};

type ProductPreview = DummyProduct;
type SimilarPreview = ProductPreview & {
  similarityTag: string;
  featuredReview: string;
};


// ── Sub-components ────────────────────────────────────────────────────────────

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe:    Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger:  Colors.searchWrong,
};

function getNumberMeta(product: Product, key: 'favoriteCount' | 'rating'): number {
  const value = (product as Product & Record<typeof key, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

function toPreviewProduct(product: Product): ProductPreview {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    riskLevel: product.riskLevel,
    rating: getNumberMeta(product, 'rating'),
    reviewCount: getNumberMeta(product, 'favoriteCount'),
    image: product.image ?? '',
    category: product.category,
  };
}

function makeSimilarityReasons(profile: Profile, language: string): string[] {
  const reasons: string[] = [];
  const isKorean = language.startsWith('ko');

  profile.dietaryRestrictions.forEach(dietId => {
    const dietLabel = DIET_LABELS[dietId] ?? dietId.replace(/_/g, ' ');
    reasons.push(isKorean ? `나와 같은 ${dietLabel} 선호` : `Same ${dietLabel} preference`);
  });

  profile.allergyProfile.forEach(allergenId => {
    const allergenLabel = getAllergenDisplayName(allergenId, language);
    reasons.push(isKorean ? `나와 같은 ${allergenLabel} 알러지` : `Same ${allergenLabel} allergy`);
  });

  if (profile.sensitivityLevel === 'strict') {
    reasons.push(isKorean ? '나와 같은 strict 민감도' : 'Same strict sensitivity');
  }

  return reasons.length > 0
    ? reasons
    : [isKorean ? '나와 비슷한 식품 안전 프로필' : 'Similar food safety profile'];
}

function toSimilarPreview(product: Product, index: number, profile: Profile, language: string): SimilarPreview {
  const reasons = makeSimilarityReasons(profile, language);
  const reason = reasons[index % reasons.length];
  const isKorean = language.startsWith('ko');
  const intro = isKorean
    ? `${reason}을 가진 사용자가 남긴 리뷰예요.`
    : `Review from a user with ${reason.toLowerCase()}.`;

  return {
    ...toPreviewProduct(product),
    similarityTag: reason,
    featuredReview: `"${intro} The ingredient list felt clear, and this matched the same profile settings I check before buying."`,
  };
}

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const { t } = useTranslation();
  const color = BADGE_COLOR[riskLevel];
  const label = riskLevel === 'safe' ? t('scanUi.good') : riskLevel === 'caution' ? t('scanUi.poor') : t('scanUi.bad');
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <RiskBadgeIcon level={riskLevel} size={16} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
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
        </View>
      </View>
      {showChevron && <Text style={styles.rowChevron}>›</Text>}
    </View>
  );
}

// 각 카드 리뷰가 순서대로 1개씩 표시
function SimilarList({ items }: { items: SimilarPreview[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (items.length === 0) return undefined;
    const t = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setActiveIdx(prev => (prev + 1) % items.length);
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, 3500);
    return () => clearInterval(t);
  }, [items.length, opacity]);

  if (items.length === 0) return null;

  return (
    <View style={styles.cardList}>
      {items.map((item, i) => (
        <View key={item.id} style={styles.simCard}>
          <View style={styles.simCardTop}>
            <ProductRow item={item} showChevron />
          </View>
          {i === activeIdx && (
            <Animated.View style={[styles.reviewBox, { opacity }]}>
              <Text style={styles.reviewTag}>{item.similarityTag}</Text>
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
  const { t } = useTranslation();
  return (
    <View style={bannerSt.wrap}>
      <Image
        source={{ uri: 'https://loremflickr.com/800/380/healthy,food,grocery?lock=77' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={bannerSt.overlay} />
      <Text style={bannerSt.tag}>{t('recommendUi.featured')}</Text>
      <Text style={bannerSt.title}>{t('recommendUi.bannerTitle')}</Text>
      <Text style={bannerSt.sub}>{t('recommendUi.featuredSubtitle')}</Text>
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
    fontFamily: 'Pretendard-Bold',
    color: '#25FF81',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
});

function SectionHeader({ title, onPress, showChevron = true }: { title: string; onPress?: () => void; showChevron?: boolean }) {
  return (
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress && showChevron && (
        <View style={styles.sectionMoreButton}>
          <Text style={styles.sectionChevron}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryPill({
  id,
  selected = false,
  onPress,
}: {
  id: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const label = id === 'all'
    ? t('recommendUi.allCategories')
    : t(`search.categoriesList.${id}`, id);

  return (
    <TouchableOpacity
      style={[styles.categoryPill, selected && styles.categoryPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.categoryPillText, selected && styles.categoryPillTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CategoryPreviewList({
  selectedCategory,
  onSelect,
  onMorePress,
}: {
  selectedCategory: string;
  onSelect: (id: string) => void;
  onMorePress?: () => void;
}) {
  return (
    <View style={styles.categoryRowWrap}>
      <FlatList
        data={CATEGORY_IDS}
        keyExtractor={item => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPreviewList}
        renderItem={({ item }) => (
          <CategoryPill
            id={item}
            selected={selectedCategory === item}
            onPress={() => onSelect(item)}
          />
        )}
      />
      <LinearGradient
        colors={['rgba(253,255,253,0)', 'rgba(253,255,253,0.92)', 'rgba(253,255,253,1)']}
        locations={onMorePress ? [0, 0.42, 0.68] : undefined}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={onMorePress ? styles.categoryFadeWithMore : styles.categoryFade}
        pointerEvents="none"
      />
      {onMorePress && (
        <TouchableOpacity
          style={styles.categoryMoreButton}
          onPress={onMorePress}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryMoreChevron}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── CommunityScreen ───────────────────────────────────────────────────────────

export default function CommunityScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const activeProfile = useUserStore(state => state.activeProfile);
  const language = useUserStore(state => state.currentUser.language);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [activeTab,    setActiveTab]    = useState<Tab>('Week Trends');
  const [trendingProducts,  setTrendingProducts]  = useState<ProductPreview[]>([]);
  const [similarProducts,   setSimilarProducts]   = useState<Product[]>([]);
  const [trendingCategory,  setTrendingCategory]  = useState('all');
  const [qaPreview,         setQaPreview]         = useState<QAQuestion[]>([]);
  const [magazinePreview,   setMagazinePreview]   = useState<MagazineItem[]>([]);

  const mainScrollRef    = useRef<ScrollView>(null);
  const sectionY         = useRef<Partial<Record<Tab, number>>>({});
  const sectionViewRefs  = useRef<Partial<Record<Tab, View | null>>>({});
  const scrollOffset     = useRef(0);
  const activeTabRef     = useRef<Tab>('Week Trends');
  const isProgrammatic   = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        TABS.forEach(tab => {
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

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWeekendPopular(), getSimilarUsersFavorites(), getQAQuestions(), getMagazineItems()])
      .then(([products, similar, questions, magazines]) => {
        if (cancelled) return;
        setTrendingProducts(products.map(toPreviewProduct));
        setSimilarProducts(similar);
        setQaPreview(questions.filter(question => !question.isNotice).slice(0, 3));
        setMagazinePreview(magazines.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) {
          setTrendingProducts([]);
          setSimilarProducts([]);
          setQaPreview([]);
          setMagazinePreview([]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const trendingPreview = trendingProducts
    .filter(product => trendingCategory === 'all' || product.category === trendingCategory)
    .slice(0, 9);
  const similarPreview = similarProducts
    .slice(0, 3)
    .map((product, index) => toSimilarPreview(product, index, activeProfile, language));

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
    const order = TABS;

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
          <View style={[styles.section, styles.weekSection]}>
            <SectionHeader title={t('recommendUi.trending')} onPress={() => navigation.navigate('WeekendPopular')} showChevron={false} />
            <CategoryPreviewList
              selectedCategory={trendingCategory}
              onSelect={setTrendingCategory}
              onMorePress={() => navigation.navigate('WeekendPopular')}
            />
            <View style={styles.trendScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendList}
              >
                {[0, 1, 2].map(colIdx => {
                  const colItems = trendingPreview.slice(colIdx * 3, colIdx * 3 + 3);
                  if (colItems.length === 0) return null;
                  return (
                    <View key={colIdx} style={styles.trendCard}>
                      {colItems.map((item, idx) => (
                        <View key={item.id}>
                          <ProductRow item={item} />
                          {idx < colItems.length - 1 && <View style={styles.rowDivider} />}
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
              <LinearGradient
                colors={['rgba(253,255,253,0)', 'rgba(253,255,253,0.6)', 'rgba(253,255,253,1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trendFade}
                pointerEvents="none"
              />
            </View>
          </View>
        );

      case 'Similar Trends':
        return (
          <View style={styles.section}>
            <SectionHeader title={t('recommendUi.similarPicks')} onPress={() => navigation.navigate('SimilarUsersFavorites')} showChevron={false} />
            <CategoryPreviewList
              selectedCategory="all"
              onSelect={() => {}}
              onMorePress={() => navigation.navigate('SimilarUsersFavorites')}
            />
            <SimilarList items={similarPreview} />
          </View>
        );

      case 'Q&A':
        return (
          <View style={[styles.section, styles.qaSection]}>
            <SectionHeader title={t('recommendUi.qa')} onPress={() => navigation.navigate('QAScreen')} />
            {qaPreview.map((item, idx) => (
              <View key={item.id}>
                <TouchableOpacity
                  style={styles.qaRow}
                  onPress={() => navigation.navigate('QADetail', { questionId: item.id })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qaTitle}>{item.title}</Text>
                  <Text style={styles.qaBody} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.qaMeta}>
                    <Text style={styles.qaUser}>{item.author}</Text>
                  </View>
                </TouchableOpacity>
                {idx < qaPreview.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        );

      case 'Magazine':
        return (
          <View style={[styles.section, styles.magazineSection]}>
            <SectionHeader title={t('recommendUi.magazine')} onPress={() => navigation.navigate('MagazineScreen')} />
            <View style={styles.magScrollWrap}>
              <FlatList
                data={magazinePreview}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.magList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.magCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('MagazineDetail', { articleId: item.id })}
                  >
                    <View style={styles.magImgBox}>
                      <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    </View>
                    <View style={styles.magContent}>
                      <Text style={styles.magTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.magDesc}  numberOfLines={4}>{item.body}</Text>
                      <Text style={styles.magSeeMore}>{t('recommendUi.seeMore')}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
              <LinearGradient
                colors={['rgba(253,255,253,0)', 'rgba(253,255,253,0.6)', 'rgba(253,255,253,1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.magFade}
                pointerEvents="none"
              />
            </View>
          </View>
        );


    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('recommendUi.community')}</Text>
      </View>

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                {t(SECTION_LABEL_KEY[tab])}
              </Text>
              {isActive && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
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
        onContentSizeChange={remeasureSections}
        contentContainerStyle={{ paddingBottom: insets.bottom + 18 }}
      >
        {/* ── Promotional banner ─────────────────────────────────────── */}
        <View style={styles.bannerWrap}>
          <BannerAd />
        </View>

        {/* ── Sections ──────────────────────────────────────────────── */}
        {TABS.map((tab, i) => (
          <View
            key={tab}
            ref={r => { sectionViewRefs.current[tab] = r; }}
            onLayout={onSectionLayout(tab)}
          >
            {renderSection(tab)}
            {i < TABS.length - 1 && (
              <View style={[styles.sectionGap, (tab === 'Similar Trends' || tab === 'Q&A') && styles.sectionGapLarge]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: C.dark,
    letterSpacing: -0.38,
  },

  // Search
  searchRow: {
    paddingHorizontal: 22,
    marginBottom: 24,
  },
  searchInputWrap: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: C.muted,
    padding: 0,
  },
  // Tabs
  tabScroll: {
    maxHeight: 40,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingBottom: 3,
    gap: 24,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 4,
    flexShrink: 0,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: C.muted,
    lineHeight: 20,
  },
  tabTextActive: {
    color: C.dark,
    fontFamily: 'Pretendard-SemiBold',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: C.dark,
    borderRadius: 1,
  },
  tabBarLine: {
    height: 1,
    backgroundColor: C.line,
    marginBottom: 0,
  },

  // Scroll / Sections
  scroll:        { flex: 1 },
  section:       { paddingHorizontal: 27, paddingTop: 12, paddingBottom: 12 },
  weekSection:   { paddingTop: 40, paddingBottom: 0 },
  qaSection:     { paddingBottom: 0 },
  magazineSection:{ paddingBottom: 0 },
  sectionGap:    { height: 0, backgroundColor: C.bg },
  sectionGapLarge:{ height: 24 },

  // Banner
  bannerWrap: { paddingHorizontal: 23, paddingTop: 14, paddingBottom: 8 },
  banner:     { height: 190, borderRadius: 9, backgroundColor: C.thumbBg },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle:  { fontSize: 18, fontFamily: 'Pretendard-Bold', color: C.dark, letterSpacing: -0.38 },
  sectionMoreButton: {
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionChevron:{ fontSize: 30, lineHeight: 30, color: C.dark, fontFamily: 'Pretendard-Regular' },

  // Category pill
  categoryPill: {
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 50,
    minWidth: 96,
    height: 30,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  categoryRowWrap: {
    position: 'relative',
    marginBottom: 18,
  },
  categoryPreviewList: {
    gap: 5,
    paddingRight: 74,
  },
  categoryFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 36,
    height: 30,
  },
  categoryFadeWithMore: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 104,
    height: 30,
    zIndex: 1,
  },
  categoryMoreButton: {
    position: 'absolute',
    right: 0,
    top: -19,
    width: 42,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  categoryMoreChevron: {
    fontSize: 30,
    lineHeight: 30,
    color: C.dark,
    fontFamily: 'Pretendard-Regular',
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: C.dark,
    letterSpacing: -0.228,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontFamily: 'Pretendard-Bold',
  },

  // Product row (shared for Trending + Similar inner)
  productRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  productThumb: {
    width: 86,
    height: 86,
    borderRadius: 9,
    backgroundColor: C.thumbBg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  productInfo:  { flex: 1, gap: 4 },
  productName:  { fontSize: 16, fontFamily: 'Pretendard-Bold', color: C.productText, letterSpacing: -0.266, marginTop: 6 },
  productBrand: { fontSize: 12, color: C.productText, letterSpacing: -0.19 },
  productMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  productRating:{ fontSize: 10, color: C.mid, letterSpacing: -0.19 },
  rowChevron:   { fontSize: 18, color: C.dark, marginLeft: 4 },

  // Trending list
  trendScrollWrap: { position: 'relative' },
  trendFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
  },
  trendList: { gap: 10, paddingVertical: 4 },
  trendCard: {
    width: SCREEN_W - 130,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowDivider:{ height: 1, backgroundColor: C.line, marginVertical: 6 },

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
    backgroundColor: C.reviewBg,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  reviewTag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    color: C.mid,
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: -0.2,
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: C.mid,
    letterSpacing: -0.285,
    lineHeight: 21,
  },

  // Q&A
  qaRow:   { paddingVertical: 12, paddingRight: 30 },
  qaTitle: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: C.dark, letterSpacing: -0.266, marginBottom: 5 },
  qaBody:  { fontSize: 14, fontFamily: 'Pretendard-Regular', color: C.mid, lineHeight: 20, marginBottom: 8 },
  qaMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  qaUser:  { fontSize: 12, color: C.dark, letterSpacing: -0.19 },

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
    fontFamily: 'Pretendard-SemiBold',
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
  magScrollWrap: { position: 'relative' },
  magList: { gap: 11, paddingRight: 60 },
  magFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
  },
  magCard: {
    width: 320,
    height: 250,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 11,
    backgroundColor: C.reviewBg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  magImgBox: {
    width: 162,
    margin: 9,
    marginRight: 14,
    borderRadius: 8,
    backgroundColor: C.dark,
    overflow: 'hidden',
  },
  magContent: {
    flex: 1,
    paddingTop: 17,
    paddingRight: 11,
    paddingBottom: 10,
  },
  magTitle:   { fontSize: 17, fontFamily: 'Pretendard-Bold', color: C.dark, lineHeight: 22 },
  magDesc:    { fontSize: 12, color: C.mid, lineHeight: 17, marginTop: 8 },
  magSeeMore: {
    position: 'absolute',
    left: 0,
    bottom: 18,
    fontSize: 12,
    color: C.dark,
    textDecorationLine: 'underline',
  },

});

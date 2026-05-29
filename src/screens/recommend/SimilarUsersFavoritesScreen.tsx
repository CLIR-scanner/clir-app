import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { ApiError, clearAuthToken, UnauthorizedError } from '../../lib/api';
import { getAllergenDisplayName } from '../../lib/display-names';
import Skeleton from '../../components/common/Skeleton';
import { getSimilarUsersFavorites } from '../../services/recommend.service';
import { useUserStore } from '../../store/user.store';
import { Product, Profile, RecommendStackParamList, RiskLevel, SimilarUserReview } from '../../types';
import { INITIAL_FILTER_CATEGORIES } from '../../components/common/FilterBottomSheet';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import i18n from '../../i18n';

type Props = NativeStackScreenProps<RecommendStackParamList, 'SimilarUsersFavorites'>;

const C = {
  bg: Colors.scanLightGreen,
  dark: Colors.searchDarkGreen,
  mid: Colors.searchMutedGreen,
  muted: Colors.scanMutedGreen,
  card: Colors.searchCard,
  soft: Colors.profileCard,
  line: Colors.searchDivider,
};

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe: Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger: Colors.searchWrong,
};

const CATEGORY_IDS = ['all', ...INITIAL_FILTER_CATEGORIES.map(cat => cat.id)];

/**
 * 리뷰 시스템 (작성·좋아요·댓글 카운트) UI 노출 토글.
 * BE /reviews / /products/{id}/likes 연결 PR 완료 시 true.
 * 현재 false: writeReview CTA + ReviewCard 의 like/comment actionRow 가림.
 */
const REVIEW_FEATURES_ENABLED = false;

const REVIEW_COPY = [
  {
    author: 'Elena S.',
    location: 'San Francisco, CA',
    body: '"This has become my default snack after scanning it in Clir. The label is easy to read, and users with a similar profile seem to trust it too."',
    likeCount: 125,
    commentCount: 12,
  },
  {
    author: 'Mina K.',
    location: 'Seattle, WA',
    body: '"I liked that the ingredient list was short and the community notes matched my eating preferences. It made the choice feel much easier in the store."',
    likeCount: 98,
    commentCount: 8,
  },
  {
    author: 'Chris L.',
    location: 'Austin, TX',
    body: '"The review helped me double-check the may-contain warning before buying. Helpful on strict allergy days when I do not want to guess."',
    likeCount: 76,
    commentCount: 5,
  },
] as const;

function getNumberMeta(product: Product, key: 'favoriteCount' | 'rating'): number {
  const value = (product as Product & Record<typeof key, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

function makeSimilarityReasons(profile: Profile, language: string): string[] {
  const reasons: string[] = [];
  const isKorean = language.startsWith('ko');

  profile.dietaryRestrictions.forEach(dietId => {
    const dietLabel = i18n.t(`survey.dietTitles.${dietId}`, { defaultValue: dietId.replace(/_/g, ' ') });
    reasons.push(isKorean ? `나와 같은 ${dietLabel} 선호` : `Same ${dietLabel} preference`);
  });

  profile.allergyProfile.forEach(allergenId => {
    const allergenLabel = getAllergenDisplayName(allergenId, language);
    reasons.push(isKorean ? `나와 같은 ${allergenLabel} 알레르기` : `Same ${allergenLabel} allergy`);
  });

  if (profile.sensitivityLevel === 'strict') {
    reasons.push(isKorean ? '나와 같은 strict 민감도' : 'Same strict sensitivity');
  }

  return reasons.length > 0
    ? reasons
    : [isKorean ? '나와 비슷한 식품 안전 프로필' : 'Similar food safety profile'];
}

function makePersonalizedBody(baseBody: string, reason: string, language: string): string {
  const unquoted = baseBody.replace(/^"|"$/g, '');
  if (language.startsWith('ko')) {
    return `"${reason}을 가진 사용자의 리뷰예요. ${unquoted}"`;
  }
  return `"Review from a user with ${reason.toLowerCase()}. ${unquoted}"`;
}

function buildReviews(products: Product[], profile: Profile, language: string): SimilarUserReview[] {
  const reasons = makeSimilarityReasons(profile, language);
  return products.map((product, index) => {
    const copy = REVIEW_COPY[index % REVIEW_COPY.length];
    const reason = reasons[index % reasons.length];
    return {
      id: `review-${product.id}`,
      product,
      rating: Math.min(5, Math.max(0, getNumberMeta(product, 'rating'))),
      ...copy,
      tag: reason,
      body: makePersonalizedBody(copy.body, reason, language),
    };
  });
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useTranslation();
  const color = BADGE_COLOR[level];
  const label = level === 'safe' ? t('scanUi.good') : level === 'caution' ? t('scanUi.poor') : t('scanUi.bad');

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <RiskBadgeIcon level={level} size={16} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function CategoryChip({
  id,
  selected,
  onPress,
}: {
  id: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const label = id === 'all'
    ? t('recommendUi.allCategories')
    : t(`search.categoriesList.${id}`, id);

  return (
    <TouchableOpacity
      style={[styles.categoryChip, selected && styles.categoryChipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.categoryText, selected && styles.categoryTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProductSummary({
  product,
  expanded,
  onToggle,
  onProductPress,
}: {
  product: Product;
  expanded: boolean;
  onToggle: () => void;
  onProductPress: () => void;
}) {
  const rating = getNumberMeta(product, 'rating');
  const favoriteCount = getNumberMeta(product, 'favoriteCount');

  return (
    <View style={[styles.productHeader, expanded ? styles.productHeaderOpen : styles.productHeaderClosed]}>
      <TouchableOpacity
        style={styles.productTapArea}
        onPress={onProductPress}
        activeOpacity={0.78}
      >
        <View style={styles.thumb}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.brandName} numberOfLines={1}>{product.brand}</Text>
          <View style={styles.metaRow}>
            <RiskBadge level={product.riskLevel} />
          </View>
        </View>
      </TouchableOpacity>
      {/* 리뷰 본문 expand 토글 — 리뷰 시스템 미구현 동안 가림. */}
      {REVIEW_FEATURES_ENABLED && (
        <TouchableOpacity
          style={styles.chevronButton}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide review' : 'Show review'}
          activeOpacity={0.7}
        >
          <Text style={[styles.chevron, !expanded && { transform: [{ scaleY: -1 }] }]}>⌃</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


function ViewIcon() {
  return (
    <Svg width={16} height={11} viewBox="0 0 16 11" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.3475 5.25C15.3475 4.93587 15.1778 4.73025 14.8383 4.31725C13.5958 2.80875 10.8553 0 7.67375 0C4.49225 0 1.75175 2.80875 0.50925 4.31725C0.16975 4.73025 0 4.93587 0 5.25C0 5.56413 0.16975 5.76975 0.50925 6.18275C1.75175 7.69125 4.49225 10.5 7.67375 10.5C10.8553 10.5 13.5958 7.69125 14.8383 6.18275C15.1778 5.76975 15.3475 5.56413 15.3475 5.25ZM7.67375 7.875C8.36994 7.875 9.03762 7.59844 9.52991 7.10616C10.0222 6.61387 10.2988 5.94619 10.2988 5.25C10.2988 4.55381 10.0222 3.88613 9.52991 3.39384C9.03762 2.90156 8.36994 2.625 7.67375 2.625C6.97756 2.625 6.30988 2.90156 5.81759 3.39384C5.32531 3.88613 5.04875 4.55381 5.04875 5.25C5.04875 5.94619 5.32531 6.61387 5.81759 7.10616C6.30988 7.59844 6.97756 7.875 7.67375 7.875Z"
        fill={C.mid}
      />
    </Svg>
  );
}

function CommentIcon() {
  return (
    <Svg width={13} height={12} viewBox="0 0 13 12" fill="none">
      <Path
        d="M0.802063 4.25093C0.802063 3.57078 0.802063 3.08393 0.834145 2.70295C0.864624 2.32678 0.922372 2.08857 1.02022 1.89688L0.306388 1.53274C0.141163 1.85597 0.0689773 2.21209 0.0336865 2.63798C-1.46408e-07 3.05907 0 3.58442 0 4.25093H0.802063ZM0.802063 5.21341V4.25093H0V5.21341H0.802063ZM0 5.21341V9.22373H0.802063V5.21341H0ZM0 9.22373V10.7589H0.802063V9.22373H0ZM0 10.7589C0 11.4374 0.820511 11.7775 1.30095 11.2971L0.733888 10.73C0.740789 10.7254 0.748365 10.7219 0.756345 10.7196L0.777199 10.7212C0.783857 10.725 0.789514 10.7303 0.793699 10.7367C0.797884 10.7431 0.800477 10.7505 0.801261 10.7581L0 10.7589ZM1.30095 11.2971L2.85615 9.74186L2.28909 9.1748L0.733086 10.7308L1.30095 11.2971ZM8.58207 8.82269H3.13927V9.62476H8.58207V8.82269ZM10.9361 8.60453C10.7444 8.70238 10.5062 8.76013 10.1301 8.79141C9.74827 8.82269 9.26222 8.82269 8.58207 8.82269V9.62476C9.24939 9.62476 9.77394 9.62476 10.195 9.59027C10.6209 9.55578 10.977 9.48359 11.3003 9.31917L10.9361 8.60453ZM11.812 7.72788C11.6198 8.10495 11.3132 8.41233 10.9361 8.60453L11.3003 9.31917C11.8287 9.05 12.2583 8.62041 12.5274 8.09201L11.812 7.72788ZM12.0309 5.37382C12.0309 6.05397 12.0309 6.54082 11.9989 6.9218C11.9684 7.29797 11.9106 7.53618 11.812 7.72788L12.5274 8.09201C12.6918 7.76878 12.764 7.41267 12.7985 6.98677C12.833 6.56569 12.833 6.04034 12.833 5.37382H12.0309ZM12.0309 4.25093V5.37382H12.833V4.25093H12.0309ZM11.812 1.89688C11.9098 2.08857 11.9684 2.32678 11.9997 2.70295C12.0309 3.08393 12.0309 3.57078 12.0309 4.25093H12.833C12.833 3.58362 12.833 3.05907 12.7985 2.63798C12.764 2.21209 12.6918 1.85597 12.5274 1.53274L11.812 1.89688ZM10.9361 1.02022C11.3133 1.21264 11.6199 1.51951 11.812 1.89688L12.5274 1.53274C12.2583 1.00434 11.8287 0.574756 11.3003 0.305586L10.9361 1.02022ZM8.58207 0.802063C9.26222 0.802063 9.74827 0.802063 10.1301 0.834146C10.5062 0.864624 10.7444 0.922372 10.9361 1.02022L11.3003 0.305586C10.977 0.140361 10.6209 0.0689773 10.195 0.0336865C9.77394 -1.46408e-07 9.24859 0 8.58207 0V0.802063ZM4.25093 0.802063H8.58207V0H4.25093V0.802063ZM1.89688 1.02022C2.08857 0.923174 2.32678 0.864624 2.70295 0.833344C3.08393 0.802063 3.57078 0.802063 4.25093 0.802063V0C3.58362 0 3.05907 1.76287e-07 2.63799 0.0344889C2.21209 0.0689776 1.85597 0.141163 1.53274 0.305586L1.89688 1.02022ZM1.02022 1.89688C1.2125 1.51939 1.51939 1.2125 1.89688 1.02022L1.53274 0.305586C1.00447 0.574547 0.575694 1.00464 0.306388 1.53274L1.02022 1.89688ZM2.85615 9.74186C2.9313 9.66689 3.03312 9.62478 3.13927 9.62476V8.82269C2.8203 8.82297 2.5145 8.94991 2.28909 9.1756L2.85615 9.74186Z"
        fill={C.mid}
      />
      <Path
        d="M3.60938 3.60938H9.22382M3.60938 6.01556H7.61969"
        stroke={C.mid}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// reviewWrap(border + radius 20) + productHeader(104 min height, padding 12) 와
// 동일한 외곽 사이즈. 데이터 로드 후 layout 이 그대로 유지된다.
function ReviewCardSkeleton() {
  return (
    <View style={styles.reviewWrap}>
      <View style={[styles.productHeader, styles.productHeaderClosed]}>
        <View style={styles.productTapArea}>
          <Skeleton width={82} height={82} borderRadius={9} />
          <View style={styles.productInfo}>
            <Skeleton width="78%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width="50%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
            <Skeleton width={72} height={24} borderRadius={28} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ReviewCard({
  review,
  expanded,
  onToggle,
  onProductPress,
}: {
  review: SimilarUserReview;
  expanded: boolean;
  onToggle: () => void;
  onProductPress: () => void;
}) {
  // 리뷰 시스템 미구현 동안 expand 비활성 → 항상 카드 closed 상태.
  const effectiveExpanded = REVIEW_FEATURES_ENABLED && expanded;
  return (
    <View style={styles.reviewWrap}>
      <ProductSummary
        product={review.product}
        expanded={effectiveExpanded}
        onToggle={onToggle}
        onProductPress={onProductPress}
      />
      {/* 리뷰 본문(작성자·태그·리뷰 텍스트·좋아요/댓글) — 리뷰 시스템 미구현 동안 가림.
          향후 BE /reviews 연결 시 REVIEW_FEATURES_ENABLED=true 로 부활. */}
      {effectiveExpanded && (
        <View style={styles.reviewBody}>
          <View style={styles.reviewerRow}>
            <View style={styles.avatar} />
            <View style={styles.reviewerText}>
              <Text style={styles.author}>{review.author}</Text>
              <Text style={styles.location}>{review.location}</Text>
            </View>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText} numberOfLines={1}>{review.tag}</Text>
          </View>
          <Text style={styles.reviewText}>{review.body}</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <ViewIcon />
              <Text style={styles.actionText}>{review.likeCount}</Text>
            </View>
            <View style={styles.actionItem}>
              <CommentIcon />
              <Text style={styles.actionText}>{review.commentCount}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SimilarUsersFavoritesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const activeProfile = useUserStore(state => state.activeProfile);
  const language = useUserStore(state => state.currentUser.language);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getSimilarUsersFavorites()
      .then(next => {
        if (cancelled) return;
        setProducts(next);
        setExpandedIds(new Set(next.slice(0, 1).map(product => `review-${product.id}`)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          clearAuthToken();
          useUserStore.getState().logout();
          return;
        }
        if (__DEV__) {
          const msg = err instanceof ApiError ? `${err.code}: ${err.message}` : String(err);
          console.warn('[SimilarUsersFavorites] feed load failed:', msg);
        }
        setError(t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [t]);

  const reviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return buildReviews(products, activeProfile, language)
      .filter(review => selectedCategory === 'all' || review.product.category === selectedCategory)
      .filter(review => {
        if (!normalizedQuery) return true;
        return review.product.name.toLowerCase().includes(normalizedQuery)
          || review.product.brand.toLowerCase().includes(normalizedQuery)
          || review.body.toLowerCase().includes(normalizedQuery);
      });
  }, [activeProfile, language, products, query, selectedCategory]);

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        {/* 리뷰 시스템 미구현 동안 화면 타이틀은 'Similar Users\' Picks' (similarPicks 키).
            BE /reviews 연결 시 'reviewsTitle' 로 복귀. */}
        <Text style={styles.headerTitle}>{t('recommendUi.similarPicks')}</Text>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 118 },
          reviews.length === 0 && styles.emptyContent,
        ]}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <ReviewCard
              review={item}
              expanded={expandedIds.has(item.id)}
              onToggle={() => toggleExpanded(item.id)}
              onProductPress={() => navigation.navigate('RecommendProductDetail', { product: item.product })}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('search.placeholder')}
                  placeholderTextColor={C.muted}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {REVIEW_FEATURES_ENABLED && (
              <View style={styles.shareBanner}>
                <Text style={styles.shareIcon}>💬</Text>
                <Text style={styles.shareText}>{t('recommendUi.shareStory')}</Text>
                <TouchableOpacity style={styles.writeButton} activeOpacity={0.8}>
                  <Text style={styles.writeButtonText}>{t('recommendUi.writeReview')}</Text>
                  <Text style={styles.writeIcon}>↗</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 'similarReviews' 섹션 타이틀 — 리뷰 시스템 미구현 동안 가림 (헤더 타이틀과 중복도 회피). */}
            {REVIEW_FEATURES_ENABLED && (
              <View style={styles.titleWrap}>
                <Text style={styles.sectionTitle}>{t('recommendUi.similarReviews')}</Text>
              </View>
            )}

            <View style={styles.categoryWrap}>
              <FlatList
                data={CATEGORY_IDS}
                keyExtractor={item => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
                renderItem={({ item }) => (
                  <CategoryChip
                    id={item}
                    selected={selectedCategory === item}
                    onPress={() => setSelectedCategory(item)}
                  />
                )}
              />
              <LinearGradient
                colors={['rgba(253,255,253,0)', 'rgba(253,255,253,0.92)', 'rgba(253,255,253,1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.categoryFade}
                pointerEvents="none"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[0, 1, 2, 3, 4].map(idx => (
                <View key={idx} style={styles.reviewItem}>
                  <ReviewCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{error ?? t('search.empty')}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    bottom: 26,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: C.dark,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: 'Pretendard-Regular',
  },
  headerTitle: {
    marginTop: 8,
    color: C.dark,
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  listHeader: {
    backgroundColor: C.bg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 12,
  },
  searchBox: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: C.dark,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchInput: {
    color: C.muted,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    padding: 0,
  },
  shareBanner: {
    height: 70,
    marginHorizontal: 22,
    marginTop: 14,
    borderRadius: 13,
    backgroundColor: C.dark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 15,
  },
  shareIcon: {
    color: Colors.white,
    fontSize: 14,
    marginRight: 8,
  },
  shareText: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.304,
  },
  writeButton: {
    height: 36,
    minWidth: 150,
    borderRadius: 10,
    backgroundColor: C.mid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  writeButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.228,
  },
  writeIcon: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 16,
  },
  titleWrap: {
    paddingHorizontal: 28,
    marginTop: 28,
  },
  sectionTitle: {
    color: C.dark,
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.38,
  },
  categoryWrap: {
    backgroundColor: C.bg,
    paddingTop: 12,
    paddingBottom: 18,
    position: 'relative',
  },
  categoryList: {
    paddingHorizontal: 28,
    gap: 5,
  },
  categoryChip: {
    minWidth: 96,
    height: 30,
    borderWidth: 1,
    borderColor: C.mid,
    borderRadius: 50,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  categoryText: {
    color: C.dark,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.228,
  },
  categoryFade: {
    position: 'absolute',
    right: 0,
    top: 12,
    height: 30,
    width: 60,
    zIndex: 1,
  },
  categoryTextActive: {
    color: Colors.white,
    fontFamily: 'Pretendard-Bold',
  },
  listContent: {
    paddingTop: 0,
  },
  emptyContent: {
    flexGrow: 1,
  },
  reviewItem: {
    marginHorizontal: 22,
    marginBottom: 7,
  },
  reviewWrap: {
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  productHeader: {
    minHeight: 104,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  productHeaderOpen: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  productHeaderClosed: {
    borderRadius: 20,
  },
  productTapArea: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 82,
    height: 82,
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 9,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: C.line,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  productName: {
    color: C.mid,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 22,
    letterSpacing: -0.266,
  },
  brandName: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 17,
    letterSpacing: -0.19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
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
  scoreText: {
    flex: 1,
    color: C.mid,
    fontSize: 11,
    fontFamily: 'Pretendard-Light',
    lineHeight: 13,
  },
  chevronButton: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  chevron: {
    color: C.muted,
    fontSize: 25,
    lineHeight: 25,
    textAlign: 'center',
  },
  reviewBody: {
    minHeight: 245,
    paddingTop: 15,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: C.bg,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: C.line,
    marginRight: 17,
  },
  reviewerText: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    color: C.mid,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    lineHeight: 22,
  },
  location: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    letterSpacing: -0.228,
  },
  tag: {
    alignSelf: 'flex-start',
    height: 28,
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: C.muted,
    borderRadius: 20,
    backgroundColor: C.soft,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: 13,
  },
  tagText: {
    color: C.mid,
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 20,
  },
  reviewText: {
    color: C.mid,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 22,
    letterSpacing: -0.285,
    marginTop: 7,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    color: C.mid,
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 18,
  },
  emptyBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyText: {
    color: C.mid,
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
});

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ListStackParamList, FavoriteItem, RiskLevel } from '../../types';
import { useListStore } from '../../store/list.store';
import { useUserStore } from '../../store/user.store';
import { getFavorites, removeFavorite } from '../../services/list.service';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';

type Props = NativeStackScreenProps<ListStackParamList, 'Favorites'>;

// ── Design tokens (Figma: node 223:9179) ──────────────────────────────────────
const BG         = '#F9FFF3';
const DARK_GREEN = '#1C3A19';
const MID_GREEN  = '#556C53';

const BADGE_LABEL: Record<RiskLevel, string> = {
  safe:    'Good',
  caution: 'Poor',
  danger:  'Bad',
};

export default function FavoritesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets                  = useSafeAreaInsets();
  const favorites               = useListStore(s => s.favorites);
  const setFavorites            = useListStore(s => s.setFavorites);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isError,    setIsError]    = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function fetchFavorites() {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    getFavorites()
      .then(data  => {
        if (cancelled) return;
        const localFavorites = useListStore.getState().favorites.filter(f => f.id.startsWith('fav-local-'));
        const merged = [
          ...localFavorites.filter(local =>
            !data.some(item => item.productId === local.productId || item.product?.id === local.product?.id),
          ),
          ...data,
        ];
        setFavorites(merged);
      })
      .catch(()   => { if (!cancelled) setIsError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }

  // 화면 포커스 진입 + 프로필 변경 시 재조회 — 두 트리거 모두 커버
  const profileVersion = useUserStore(s => s.profileVersion);
  useFocusEffect(
    useCallback(() => {
      return fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileVersion]),
  );

  async function handleDelete(item: FavoriteItem) {
    if (deletingId) return;
    setDeletingId(item.id);
    try {
      if (!item.id.startsWith('fav-local-')) {
        await removeFavorite(item.id);
      }
      removeFavoriteFromStore(item.id);
    } catch {
      Alert.alert('삭제 실패', '다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = useMemo(
    () => [...favorites].sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    ),
    [favorites],
  );

  function handleItemPress(item: FavoriteItem) {
    navigation.navigate('FavoriteProductDetail', { product: item.product });
  }

  function renderItem({ item, index }: { item: FavoriteItem; index: number }) {
    const riskLevel = item.product.riskLevel ?? 'safe';
    const badgeLbl  = BADGE_LABEL[riskLevel] ?? BADGE_LABEL.safe;
    const isLast    = index === sorted.length - 1;

    return (
      <View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          {/* Product thumbnail */}
          <View style={styles.thumb}>
            {item.product.image ? (
              <Image
                source={{ uri: item.product.image }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <Text style={styles.brandName} numberOfLines={1}>
              {item.product.brand || '—'}
            </Text>

            {/* Risk badge — image 인증마크 + 텍스트 */}
            <View style={styles.badge}>
              <RiskBadgeIcon level={riskLevel} size={16} style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{badgeLbl}</Text>
            </View>
          </View>

          {/* Chevron */}
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {!isLast && <View style={styles.divider} />}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Title ───────────────────────────────────────────────────────────── */}
      <Text style={styles.title}>List</Text>

      {/* ── List / Loading / Error ──────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={DARK_GREEN} />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('favorites.errorLoad')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchFavorites}>
            <Text style={styles.retryText}>{t('favorites.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.pillWrap}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>My Favorite Products</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Title
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GREEN,
    lineHeight: 32,
    marginTop: 8,
    marginBottom: 16,
  },

  // List
  listContent: { paddingHorizontal: 26, paddingTop: 4 },

  // "My Favorite Products" pill
  pillWrap: { marginBottom: 20 },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: DARK_GREEN,
    borderRadius: 50,
    paddingVertical: 3,
    paddingHorizontal: 19,
  },
  pillText: { fontSize: 13, fontWeight: '500', color: DARK_GREEN, lineHeight: 18 },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },

  // Product thumbnail
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    flexShrink: 0,
  },

  // Info block
  info:        { flex: 1, gap: 12 },
  productName: { fontSize: 16, fontWeight: '700', color: MID_GREEN, lineHeight: 22 },
  brandName:   { fontSize: 12, fontWeight: '400', color: MID_GREEN, lineHeight: 16, marginTop: -8 },

  // Risk badge — 이미지 인증마크
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: MID_GREEN,
    borderRadius: 28,
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 18,
    gap: 6,
  },
  badgeIcon: { width: 16, height: 16 },
  badgeText: { fontSize: 12, fontWeight: '400', color: MID_GREEN },

  // Chevron
  chevron: { fontSize: 22, color: DARK_GREEN, fontWeight: '300' },

  // Divider
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D0D0C8' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Retry button
  retryBtn:  { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: DARK_GREEN },
  retryText: { fontSize: 14, fontWeight: '600', color: DARK_GREEN },

  // Empty / error state
  empty:     { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#888' },
});

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
import { ListStackParamList, FavoriteItem, RiskLevel } from '../../types';
import { useListStore } from '../../store/list.store';
import { getFavorites, removeFavorite } from '../../services/list.service';

type Props = NativeStackScreenProps<ListStackParamList, 'Favorites'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG        = '#F9FFF3';
const TITLE_CLR = '#1A2E1A';

const BADGE: Record<RiskLevel, { dot: string; label: string }> = {
  danger:  { dot: '#FF0000', label: 'Bad'  },
  safe:    { dot: '#25FF81', label: 'Good' },
  caution: { dot: '#FF9D00', label: 'Poor' },
};

export default function FavoritesScreen({ navigation }: Props) {
  const insets       = useSafeAreaInsets();
  const favorites             = useListStore(s => s.favorites);
  const setFavorites          = useListStore(s => s.setFavorites);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isError,    setIsError]    = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function fetchFavorites() {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    getFavorites()
      .then(data  => { if (!cancelled) setFavorites(data); })
      .catch(()   => { if (!cancelled) setIsError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }

  useFocusEffect(
    useCallback(() => {
      return fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  async function handleDelete(item: FavoriteItem) {
    if (deletingId) return;
    setDeletingId(item.id);
    try {
      await removeFavorite(item.id);
      removeFavoriteFromStore(item.id);
    } catch {
      Alert.alert('삭제 실패', '다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  }

  // 최신순 정렬
  const sorted = useMemo(
    () => [...favorites].sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    ),
    [favorites],
  );

  function handleItemPress(item: FavoriteItem) {
    // ListStack 내부의 HistoryProductDetail로 이동 — back 시 Favorites로 정상 복귀
    navigation.navigate('HistoryProductDetail', { product: item.product });
  }

  function renderItem({ item, index }: { item: FavoriteItem; index: number }) {
    const badge  = BADGE[item.product.riskLevel] ?? BADGE.safe;
    const isLast = index === sorted.length - 1;
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
            <View style={[styles.badge, { borderColor: badge.dot }]}>
              <View style={[styles.dot, { backgroundColor: badge.dot }]} />
              <Text style={[styles.badgeText, { color: badge.dot }]}>
                {badge.label}
              </Text>
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
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerSide} />
        <Text style={styles.title}>List</Text>
        <View style={styles.headerSide} />
      </View>

      {/* ── List / Loading / Error ──────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TITLE_CLR} />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>즐겨찾기를 불러오지 못했습니다.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchFavorites}>
            <Text style={styles.retryText}>다시 시도</Text>
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
              <Text style={styles.emptyText}>아직 즐겨찾기가 없습니다.</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerSide: { width: 36 },
  title:      { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: TITLE_CLR },

  // List
  listContent: { paddingHorizontal: 20, paddingTop: 8 },

  // "My Favorite Products" pill
  pillWrap: { marginBottom: 16 },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: TITLE_CLR,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: TITLE_CLR },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },

  // Product thumbnail
  thumb: {
    width: 72, height: 72,
    borderRadius: 12,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    flexShrink: 0,
  },

  // Info block
  info:        { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 3 },
  brandName:   { fontSize: 13, color: '#666666', marginBottom: 8 },

  // Risk badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 5,
  },
  dot:       { width: 10, height: 10, borderRadius: 5 },
  badgeText: { fontSize: 12, fontWeight: '600' },

  // Chevron
  chevron: { fontSize: 22, color: '#1A1A1A', fontWeight: '300' },

  // Divider
  divider: { height: 1, backgroundColor: '#D0D0C8' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Retry button
  retryBtn:  { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1.5, borderColor: TITLE_CLR },
  retryText: { fontSize: 14, fontWeight: '600', color: TITLE_CLR },

  // Empty / error state
  empty:     { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#888' },

});

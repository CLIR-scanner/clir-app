import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList, ScanHistory, RiskLevel } from '../../types';
import { useScanStore } from '../../store/scan.store';
import { getScanHistory } from '../../services/scan.service';

type Props = NativeStackScreenProps<ScanStackParamList, 'ScanHistory'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG          = '#F0F5EF';   // 연한 민트/크림 배경
const TITLE_COLOR = '#1A2E1A';   // 진한 그린 계열 타이틀

const BADGE: Record<RiskLevel, { dot: string; label: string; text: string; border: string }> = {
  danger:  { dot: '#FF0000', label: 'Bad',  text: '#FF0000', border: '#FF0000' },
  safe:    { dot: '#25FF81', label: 'Good', text: '#25FF81', border: '#25FF81' },
  caution: { dot: '#FF9D00', label: 'Poor', text: '#FF9D00', border: '#FF9D00' },
};

export default function ScanHistoryScreen({ navigation }: Props) {
  const insets     = useSafeAreaInsets();
  const history    = useScanStore(s => s.history);
  const setHistory = useScanStore(s => s.setHistory);
  const [isLoading, setIsLoading] = useState(true);
  const [isError,   setIsError]   = useState(false);

  function fetchHistory() {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    getScanHistory()
      .then(data => { if (!cancelled) setHistory(data); })
      .catch(() => { if (!cancelled) setIsError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }

  // 화면 포커스될 때마다 최신 이력 fetch (초기 진입 + 재방문 모두 대응)
  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchHistory);
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  // 최신순 정렬 (store는 이미 최신순이지만 방어적으로 정렬)
  const sorted = useMemo(
    () => [...history].sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
    ),
    [history],
  );

  function handleItemPress(item: ScanHistory) {
    navigation.navigate('HistoryProductDetail', { product: item.product });
  }

  function renderItem({ item, index }: { item: ScanHistory; index: number }) {
    const badge  = BADGE[item.result] ?? BADGE.safe;
    const isLast = index === sorted.length - 1;

    return (
      <View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          {/* Product image */}
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
            {/* Risk badge */}
            <View style={[styles.badge, { borderColor: badge.border }]}>
              <View style={[styles.dot, { backgroundColor: badge.dot }]} />
              <Text style={[styles.badgeText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Chevron */}
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Divider */}
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        {/* 우측 여백 균형용 */}
        <View style={styles.backBtn} />
      </View>

      {/* ── List / Loading / Error ──────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={TITLE_COLOR} />
        </View>
      ) : isError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>이력을 불러오지 못했습니다.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponent={
          <View style={styles.pillWrap}>
            <View style={styles.historyPill}>
              <Text style={styles.historyPillText}>Your Scan History</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 스캔한 제품이 없습니다.</Text>
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
  root: {
    flex: 1,
    backgroundColor: BG,
  },


  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, color: TITLE_COLOR },
  title:     { fontSize: 20, fontWeight: '700', color: TITLE_COLOR },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // "Your Scan History" pill
  pillWrap: { marginBottom: 16 },
  historyPill: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: TITLE_COLOR,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  historyPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: TITLE_COLOR,
  },

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
  retryBtn:  { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1.5, borderColor: TITLE_COLOR },
  retryText: { fontSize: 14, fontWeight: '600', color: TITLE_COLOR },

  // Empty state
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
});

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScanStackParamList, ScanHistory, RiskLevel } from '../../types';
import { useScanStore, HISTORY_CACHE_TTL_MS } from '../../store/scan.store';
import { useUserStore } from '../../store/user.store';
import { getScanHistory } from '../../services/scan.service';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';
import PullToRefreshList from '../../components/common/PullToRefreshList';
import { Colors } from '../../constants/colors';

type Props = NativeStackScreenProps<ScanStackParamList, 'ScanHistory'>;

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG          = '#FDFFFD';   // 연한 민트/크림 배경
const TITLE_COLOR = '#1A2E1A';   // 진한 그린 계열 타이틀
const MID_GREEN   = '#556C53';

const BADGE_COLOR: Record<RiskLevel, string> = {
  safe: Colors.scanCorrect,
  caution: Colors.searchPoor,
  danger: Colors.searchWrong,
};

export default function ScanHistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets     = useSafeAreaInsets();
  const history    = useScanStore(s => s.history);
  const setHistory = useScanStore(s => s.setHistory);
  // store에 데이터가 있으면 초기 로딩 스피너 생략
  const [isLoading, setIsLoading] = useState(() => useScanStore.getState().history.length === 0);
  const [isError,   setIsError]   = useState(false);

  function fetchHistory() {
    let cancelled = false;
    setIsLoading(true);
    setIsError(false);
    getScanHistory()
      .then(data => {
        if (cancelled) return;
        setHistory(data);
        useScanStore.getState().markHistorySynced();
        syncedProfileRef.current = profileVersion;
      })
      .catch(() => { if (!cancelled) setIsError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }

  // 풀-투-리프레시용 — 전체 스피너 없이 진행바만, 완료까지 Promise 유지
  async function refresh() {
    setIsError(false);
    try {
      setHistory(await getScanHistory());
      useScanStore.getState().markHistorySynced();
      syncedProfileRef.current = profileVersion;
    } catch {
      setIsError(true);
    }
  }

  // 매 진입 fetch 방지 — dirty(스캔 완료·프로필 변경) / 최초 미동기화 /
  // TTL(5분) 경과 / 프로필 버전 변화 중 하나라도면 재조회, 아니면 캐시 사용.
  const profileVersion = useUserStore(s => s.profileVersion);
  const syncedProfileRef = useRef<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      const s = useScanStore.getState();
      const stale =
        s.historyDirty ||
        s.historySyncedAt === null ||
        Date.now() - s.historySyncedAt > HISTORY_CACHE_TTL_MS ||
        syncedProfileRef.current !== profileVersion;
      if (!stale) return;          // 캐시 신선 → API 호출 생략
      return fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileVersion]),
  );

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
    const badgeColor = BADGE_COLOR[item.result];
    const badgeLabel = t(`scanUi.${item.result === 'safe' ? 'good' : item.result === 'caution' ? 'poor' : 'bad'}`);
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
            <View style={[styles.badge, { borderColor: badgeColor }]}>
              <RiskBadgeIcon level={item.result} size={16} style={styles.badgeIcon} />
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
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
        <Text style={styles.title}>{t('scanUi.history')}</Text>
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
          <Text style={styles.emptyText}>{t('scanUi.historyLoadError')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchHistory}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <PullToRefreshList
        onRefresh={refresh}
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
              <Text style={styles.historyPillText}>{t('scanUi.historyPill')}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('scanUi.historyEmpty')}</Text>
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
  title:     { fontSize: 20, fontFamily: 'Pretendard-Bold', color: TITLE_COLOR },

  // List
  listContent: {
    paddingHorizontal: 26,
    paddingTop: 4,
  },

  // "Your Scan History" pill
  pillWrap: { marginBottom: 12 },
  historyPill: {
    alignSelf: 'flex-start',
    height: 32,
    borderWidth: 1,
    borderColor: TITLE_COLOR,
    borderRadius: 50,
    paddingHorizontal: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyPillText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: TITLE_COLOR,
    letterSpacing: -0.3,
  },

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
  productName: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: MID_GREEN, lineHeight: 22 },
  brandName:   { fontSize: 12, fontFamily: 'Pretendard-Regular', color: MID_GREEN, lineHeight: 16, marginTop: -8 },

  // Risk badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 18,
    gap: 6,
  },
  badgeIcon: { width: 16, height: 16 },
  badgeText: { fontSize: 12, fontFamily: 'Pretendard-SemiBold' },

  // Chevron
  chevron: { fontSize: 22, color: '#1A1A1A', fontFamily: 'Pretendard-Light' },

  // Divider
  divider: { height: 1, backgroundColor: '#D0D0C8' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Retry button
  retryBtn:  { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1.5, borderColor: TITLE_COLOR },
  retryText: { fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: TITLE_COLOR },

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

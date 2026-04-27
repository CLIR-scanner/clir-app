import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList, Product, AnalysisResult } from '../../types';
import { Colors } from '../../constants/colors';
import { ApiError } from '../../lib/api';
import { scanBarcode, analyzeProduct, saveScanHistory, getAlternatives } from '../../services/scan.service';
import { addFavorite, getFavorites } from '../../services/list.service';
import { useScanStore } from '../../store/scan.store';
import { useListStore } from '../../store/list.store';
import { useUserStore } from '../../store/user.store';

type Props = NativeStackScreenProps<ScanStackParamList, 'ScanResult'>;

// ── Layout constants (matches ScanScreen guide box for visual consistency) ────
const GUIDE_W    = 264;
const GUIDE_H    = 148;
const GUIDE_TOP  = 185;  // dark area above guide box
const CORNER_LEN = 32;
const CORNER_W   = 4;
const CIRCLE_D   = 152;  // verdict circle diameter
const CIRCLE_R   = CIRCLE_D / 2;
const DARK_BG    = '#1A0800';  // warm dark background (camera feel)
const DIM        = 'rgba(0,0,0,0.38)';

export default function ScanResultScreen({ navigation, route }: Props) {
  const { productId, fromHistory, ocrProduct } = route.params;
  const insets = useSafeAreaInsets();

  const [product,  setProduct]  = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState(false);
  const [favorited,  setFavorited]  = useState(false);

  // Animations
  const circleScale = useRef(new Animated.Value(0)).current;
  const sheetY      = useRef(new Animated.Value(320)).current;

  const addHistory              = useScanStore(s => s.addHistory);
  const addFavoriteToStore      = useListStore(s => s.addFavorite);
  const setFavoritesInStore     = useListStore(s => s.setFavorites);
  const profileVersion          = useUserStore(s => s.profileVersion);

  // 최초 mount: 전체 로드(스캔·분석·이력 저장).
  // 프로필 변경 시(profileVersion 증가): 분석 + 대체제품만 재계산. 이력 중복 저장 안 함.
  const didInitialLoad = useRef(false);
  useEffect(() => {
    loadData(didInitialLoad.current);
    didInitialLoad.current = true;
  }, [profileVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData(skipHistorySave: boolean) {
    try {
      setLoading(true);
      setError(null);
      circleScale.setValue(0);
      sheetY.setValue(320);

      let prod: Product;
      if (ocrProduct) {
        prod = ocrProduct;
      } else {
        prod = await scanBarcode(productId);
      }

      const ingredientIds = prod.ingredients.map(i => i.id);
      const result = await analyzeProduct({ productId: prod.id, ingredientIds });

      // 대체 제품 조회(danger/caution 전용) + 스캔 이력 저장을 병렬 실행해 대기 최소화.
      // 프로필 변경 후 재실행(skipHistorySave=true) 시엔 이력 중복 저장 안 함.
      const [alts] = await Promise.all([
        result.verdict !== 'safe'
          ? getAlternatives(prod.id).catch((): Product[] => [])
          : Promise.resolve([] as Product[]),
        !fromHistory && !skipHistorySave
          ? saveScanHistory({ productId: prod.id, result: result.verdict })
              .then(item => addHistory(item))
              .catch(() => {})
          : Promise.resolve(),
      ]);

      setProduct({ ...prod, alternatives: alts });
      setAnalysis(result);

      // 이미 즐겨찾기에 있는지 확인 — store가 비어있으면 API에서 직접 조회
      let currentFavorites = useListStore.getState().favorites;
      if (currentFavorites.length === 0) {
        try {
          currentFavorites = await getFavorites();
          setFavoritesInStore(currentFavorites);
        } catch {
          // 조회 실패 시 store 그대로 유지
        }
      }
      if (currentFavorites.some(f => f.productId === prod.id || f.product?.id === prod.id)) {
        setFavorited(true);
      }

      // Animate circle + sheet simultaneously
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: 0,
          duration: 330,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      setError('Failed to load product information.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite() {
    if (!product || favLoading || favorited) return;
    setFavLoading(true);
    try {
      const apiItem = await addFavorite(product.id);
      // POST /favorites 응답에는 product 상세 없음 — 현재 화면의 product로 보완해 스토어에 저장
      addFavoriteToStore({ ...apiItem, product });
      setFavorited(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // 이미 즐겨찾기에 있음 — BE의 existing 레코드로 store를 보충해 favoriteId 확보
        const existing = (err.body as { existing?: { id: string; productId: string; addedAt: string } } | undefined)?.existing;
        if (existing && !useListStore.getState().favorites.some(f => f.id === existing.id)) {
          addFavoriteToStore({
            id: existing.id,
            productId: existing.productId,
            userId: '',
            addedAt: new Date(existing.addedAt),
            product,
          });
        }
        setFavorited(true);
      }
      // 그 외 에러는 무시
    } finally {
      setFavLoading(false);
    }
  }

  function handleSeeDetail() {
    if (!product || !analysis) return;
    // analysis 결과를 product에 반영 — triggeredBy를 riskLevel 기준으로 분리
    // danger → riskIngredients (직접 알러겐)
    // caution → mayContainIngredients (trace, strict 모드 한정)
    const toIngredient = (t: (typeof analysis.triggeredBy)[number]) => ({
      id: t.id, name: t.name, nameKo: t.nameKo,
      description: '', riskLevel: t.riskLevel, sources: [] as [],
    });
    const detailProduct = {
      ...product,
      isSafe: analysis.isSafe,
      riskLevel: analysis.verdict,
      riskIngredients:       analysis.triggeredBy.filter(t => t.riskLevel === 'danger').map(toIngredient),
      mayContainIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'caution').map(toIngredient),
    };
    navigation.navigate('HistoryProductDetail', { product: detailProduct });
  }

  const isSafe       = analysis?.isSafe ?? true;
  const verdictColor = analysis?.verdict === 'caution' ? Colors.caution : isSafe ? Colors.safe : Colors.danger;
  const hasAlts      = !isSafe && (product?.alternatives.length ?? 0) > 0;
  const ready        = !loading && !error && !!product && !!analysis;

  return (
    <View style={styles.root}>

      {/* ── Dark camera-like background ──────────────────────────────────── */}

      {/* Dim "scan window" overlay — darkens outside the guide box */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dimTop} />
        <View style={styles.dimMiddle}>
          <View style={styles.dimSide} />
          {/* Guide box window (transparent — slightly lighter than surroundings) */}
          <View style={styles.guideBox}>
            <ScanCorner pos="topLeft"     />
            <ScanCorner pos="topRight"    />
            <ScanCorner pos="bottomLeft"  />
            <ScanCorner pos="bottomRight" />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom} />
      </View>

      {/* ── Back button ───────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 14 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator color={Colors.white} size="large" />
          <Text style={styles.loadingText}>Analyzing…</Text>
        </View>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <View style={styles.centerOverlay}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(didInitialLoad.current)}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Verdict circle ────────────────────────────────────────────────── */}
      {ready && (
        <Animated.View
          style={[styles.verdictWrap, { transform: [{ scale: circleScale }] }]}
          pointerEvents="none"
        >
          {/* Outer decorative ring */}
          <View style={[styles.verdictOuterRing, { borderColor: verdictColor }]} />

          {/* Main badge circle */}
          <View
            style={[
              styles.verdictBadge,
              { borderColor: verdictColor, backgroundColor: `${verdictColor}2A` },
            ]}
          >
            {/* Icon circle */}
            <View style={[styles.verdictIconCircle, { backgroundColor: verdictColor }]}>
              <Text style={styles.verdictIconText}>{isSafe ? '✓' : '✕'}</Text>
            </View>
            {/* Verdict label */}
            <Text style={[styles.verdictLabel, { color: verdictColor }]}>
              {isSafe ? 'Good!' : 'Bad!'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Bottom sheet ──────────────────────────────────────────────────── */}
      {ready && (
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: sheetY }] },
          ]}
        >
          {/* Close */}
          <TouchableOpacity style={styles.sheetClose} onPress={() => navigation.goBack()}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Product row */}
          <View style={styles.productRow}>
            {/* Image placeholder */}
            <View style={styles.productImg}>
              {product!.image ? (
                <Image
                  source={{ uri: product!.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            {/* Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{product!.name}</Text>
              <Text style={styles.productBrand} numberOfLines={1}>{product!.brand}</Text>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.favBtn, favorited && styles.favBtnActive]}
                  onPress={handleFavorite}
                  disabled={favLoading || favorited}
                >
                  {favLoading ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Text style={[styles.favBtnText, favorited && styles.favBtnTextActive]}>
                      {favorited ? '♥' : '♡'} Add to Favorites
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSeeDetail}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.seeDetailText}>see more detail</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Alternative products — Bad only */}
          {hasAlts && (
            <View style={styles.altSection}>
              <Text style={styles.altTitle}>Alternative products</Text>
              <View style={styles.altRow}>
                {product!.alternatives.slice(0, 3).map(alt => (
                  <TouchableOpacity
                    key={alt.id}
                    style={styles.altThumb}
                    onPress={() => navigation.navigate('HistoryProductDetail', { product: alt, hideTitle: true })}
                    activeOpacity={0.7}
                  >
                    {alt.image ? (
                      <Image
                        source={{ uri: alt.image }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.altThumbText} numberOfLines={3}>
                        {alt.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ── Corner mark ───────────────────────────────────────────────────────────────
type CornerPos = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function ScanCorner({ pos }: { pos: CornerPos }) {
  const isTop  = pos === 'topLeft' || pos === 'topRight';
  const isLeft = pos === 'topLeft' || pos === 'bottomLeft';
  return (
    <View
      style={[
        styles.corner,
        isTop  ? { top: 0 }    : { bottom: 0 },
        isLeft ? { left: 0 }   : { right: 0 },
        {
          borderTopWidth:          isTop  ? CORNER_W : 0,
          borderBottomWidth:       isTop  ? 0 : CORNER_W,
          borderLeftWidth:         isLeft ? CORNER_W : 0,
          borderRightWidth:        isLeft ? 0 : CORNER_W,
          borderTopLeftRadius:     pos === 'topLeft'     ? 3 : 0,
          borderTopRightRadius:    pos === 'topRight'    ? 3 : 0,
          borderBottomLeftRadius:  pos === 'bottomLeft'  ? 3 : 0,
          borderBottomRightRadius: pos === 'bottomRight' ? 3 : 0,
          borderColor: Colors.white,
        },
      ]}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },

  // Dim overlay
  dimTop:    { height: GUIDE_TOP, backgroundColor: DIM },
  dimMiddle: { flexDirection: 'row', height: GUIDE_H },
  dimSide:   { flex: 1, backgroundColor: DIM },
  dimBottom: { flex: 1, backgroundColor: DIM },
  guideBox:  { width: GUIDE_W, height: GUIDE_H },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_LEN },

  // Back button
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: Colors.white },

  // Center overlay (loading / error)
  centerOverlay: {
    position: 'absolute',
    top: GUIDE_TOP + GUIDE_H / 2 - 60,
    left: 0, right: 0,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  errorIcon:   { fontSize: 44 },
  errorText:   { color: Colors.white, fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 21 },
  retryBtn:    { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  retryBtnText:{ color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Verdict circle
  verdictWrap: {
    position: 'absolute',
    // Center vertically on the guide box
    top: GUIDE_TOP + GUIDE_H / 2 - CIRCLE_R,
    left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictOuterRing: {
    position: 'absolute',
    width: CIRCLE_D + 22,
    height: CIRCLE_D + 22,
    borderRadius: (CIRCLE_D + 22) / 2,
    borderWidth: 2,
    opacity: 0.45,
  },
  verdictBadge: {
    width: CIRCLE_D,
    height: CIRCLE_D,
    borderRadius: CIRCLE_R,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  verdictIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  verdictIconText: { fontSize: 30, color: Colors.white, fontWeight: '900', lineHeight: 34 },
  verdictLabel:    { fontSize: 22, fontWeight: '800', letterSpacing: 0.4 },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  sheetClose: {
    position: 'absolute', top: 14, right: 16,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCloseText: { color: Colors.white, fontSize: 12, lineHeight: 14 },

  // Product row
  productRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingRight: 36 },
  productImg:    { width: 64, height: 64, borderRadius: 10, backgroundColor: Colors.gray100, marginRight: 12, overflow: 'hidden' },
  productInfo:   { flex: 1 },
  productName:   { fontSize: 16, fontWeight: '700', color: Colors.black, marginBottom: 2 },
  productBrand:  { fontSize: 13, color: Colors.gray500, marginBottom: 8 },
  productActions:{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },

  favBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.gray300,
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10,
  },
  favBtnActive:    { borderColor: Colors.danger },
  favBtnText:      { fontSize: 12, color: Colors.gray700 },
  favBtnTextActive:{ color: Colors.danger },

  seeDetailText: { fontSize: 12, color: Colors.gray500, textDecorationLine: 'underline' },

  // Alternatives
  altSection: { paddingBottom: 4 },
  altTitle:   { fontSize: 13, fontWeight: '600', color: Colors.black, marginBottom: 10 },
  altRow:     { flexDirection: 'row', gap: 10 },
  altThumb:   {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: Colors.gray100, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  altThumbText: { fontSize: 10, color: Colors.gray500, textAlign: 'center' },
});

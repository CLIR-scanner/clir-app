import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Animated, Dimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScanStackParamList, Product, FavoriteItem } from '../../types';
import { Colors } from '../../constants/colors';
import { recognizeIngredients, analyzeProduct, saveScanHistory } from '../../services/scan.service';
import { ApiError } from '../../lib/api';
import { ScanHeader } from './ScanScreen';
import { useListStore } from '../../store/list.store';
import { useScanStore } from '../../store/scan.store';
import { addFavorite as apiFavorite } from '../../services/list.service';
import { useUserStore } from '../../store/user.store';

type Props = NativeStackScreenProps<ScanStackParamList, 'OCRCapture'>;
type ScreenState = 'idle' | 'preview' | 'analyzing' | 'result' | 'error';

// ── Layout ─────────────────────────────────────────────────────────────────────
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const DIM_TOP_H    = 160;
const DIM_BOTTOM_H = 130;
const GUIDE_W      = SCREEN_W - 40;
const GUIDE_H      = SCREEN_H - DIM_TOP_H - DIM_BOTTOM_H;
const CORNER_LEN   = 32;
const CORNER_W     = 4;
const CIRCLE_D     = 160;
const DIM          = 'rgba(0,0,0,0.50)';
const GOOD_COLOR   = '#25FF81';
const BAD_COLOR    = '#FF0000';

// ── Mock ───────────────────────────────────────────────────────────────────────
const USE_MOCK = false;
let _ocrToggle = false;

const MOCK_GOOD: Product = {
  id: 'ocr-sprite-zero',
  name: 'Sprite Zero',
  brand: 'The Coca-Cola Company',
  ingredients: [],
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [],
  mayContainIngredients: [],
  alternatives: [],
  dataCompleteness: 'partial',
};
const MOCK_BAD: Product = {
  id: 'ocr-coca-cola',
  name: 'Coca-Cola Original',
  brand: 'The Coca-Cola Company',
  ingredients: [],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [
    { id: 'ing-milk',   name: 'Milk',    nameKo: '우유', description: '', riskLevel: 'danger', sources: [] },
    { id: 'ing-peanut', name: 'Peanuts', nameKo: '땅콩', description: '', riskLevel: 'danger', sources: [] },
  ],
  mayContainIngredients: [],
  alternatives: [
    { id: 'alt-1', name: 'Alt Product 1', brand: '', ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
    { id: 'alt-2', name: 'Alt Product 2', brand: '', ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
    { id: 'alt-3', name: 'Alt Product 3', brand: '', ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
  ],
  dataCompleteness: 'partial',
};

// ── Corner component ──────────────────────────────────────────────────────────
type CornerPos = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
function OCRCorner({ pos, color }: { pos: CornerPos; color: string }) {
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
          borderColor: color,
        },
      ]}
    />
  );
}

export default function OCRCaptureScreen({ navigation, route }: Props) {
  const { barcode, photoUri: initialPhotoUri } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const currentUser   = useUserStore(s => s.currentUser);
  const addFavToStore = useListStore(s => s.addFavorite);
  const favorites     = useListStore(s => s.favorites);
  const addHistory    = useScanStore(s => s.addHistory);

  const [state, setState]             = useState<ScreenState>(initialPhotoUri ? 'preview' : 'idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(initialPhotoUri ?? null);
  const [ocrProduct, setOcrProduct]   = useState<Product | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [favorited, setFavorited]     = useState(false);
  const [favLoading, setFavLoading]   = useState(false);

  const circleAnim  = useRef(new Animated.Value(0)).current;
  const sheetAnim   = useRef(new Animated.Value(400)).current;
  const cancelledRef = useRef(false);

  // ── Capture ───────────────────────────────────────────────────────────────────
  async function handleCapture() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedUri(photo.uri);
      setState('preview');
    } catch {
      setErrorMsg('Failed to capture photo. Please try again.');
      setState('error');
    }
  }

  // ── Cancel analysis ───────────────────────────────────────────────────────────
  function handleCancel() {
    cancelledRef.current = true;
    setState('preview');
  }

  // ── Analyze ───────────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!capturedUri) return;
    cancelledRef.current = false;
    setState('analyzing');
    try {
      let product: Product;
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 800));
        _ocrToggle = !_ocrToggle;
        product = _ocrToggle ? MOCK_GOOD : MOCK_BAD;
      } else {
        const ocrResult = await recognizeIngredients(capturedUri);
        const analysis  = await analyzeProduct({
          ingredientIds: ocrResult.ingredients.map(i => i.id),
        });
        const toIngredient = (t: (typeof analysis.triggeredBy)[number]) => ({
          id: t.id, name: t.name, nameKo: t.nameKo,
          description: '', riskLevel: t.riskLevel, sources: [] as [],
          // may-contain 성분(ing-may-xxx)은 relatedAllergenId를 설정해야
          // HistoryProductDetailScreen의 성분 상세 조회 시 올바른 ID(ing-xxx)로 검색됨
          ...(t.id.startsWith('ing-may-') ? { relatedAllergenId: t.id.replace('ing-may-', 'ing-') } : {}),
        });
        product = {
          id: barcode ?? `ocr-${Date.now()}`,
          name: 'Scanned Product',
          brand: '',
          image: capturedUri ?? undefined,
          ingredients: ocrResult.ingredients.map(i => ({
            id: i.id, name: i.name, nameKo: i.nameKo,
            description: '', riskLevel: 'safe' as const, sources: [],
          })),
          isSafe: analysis.isSafe,
          riskLevel: analysis.verdict,
          riskIngredients:       analysis.triggeredBy.filter(t => t.riskLevel === 'danger').map(toIngredient),
          mayContainIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'caution').map(toIngredient),
          alternatives: [],
          dataCompleteness: 'partial',
        };
      }

      // 스캔 이력 저장 — OCR 제품은 productId 없이 저장 (product_id = null)
      // barcode가 있어도 products 테이블에 미등록이므로 FK 위반 방지를 위해 omit
      try {
        const historyItem = await saveScanHistory({ result: product.riskLevel });
        addHistory({ ...historyItem, product });
      } catch { /* silent — 이력 저장 실패 시 분석 결과 표시는 유지 */ }

      if (cancelledRef.current) return;

      setOcrProduct(product);
      setFavorited(favorites.some(f => f.productId === product.id));

      circleAnim.setValue(0);
      sheetAnim.setValue(400);
      setState('result');
      Animated.parallel([
        Animated.spring(circleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(sheetAnim,  { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start();
    } catch (err) {
      if (cancelledRef.current) return;
      setState('preview');
      if (err instanceof ApiError && err.code === 'OCR_FAILED') {
        Alert.alert('인식 실패', '성분표를 더 밝고 선명하게 촬영해주세요.');
      } else {
        Alert.alert('오류', '분석에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────
  function handleReset() {
    if (initialPhotoUri) {
      // ScanScreen에서 촬영 후 진입한 경우 → 뒤로가기 (재촬영은 ScanScreen에서)
      navigation.goBack();
      return;
    }
    setCapturedUri(null);
    setOcrProduct(null);
    setErrorMsg('');
    setFavorited(false);
    setState('idle');
  }

  // ── Add to Favorites ──────────────────────────────────────────────────────────
  async function handleFavorite() {
    if (!ocrProduct || favorited || favLoading) return;
    setFavLoading(true);
    try {
      if (!USE_MOCK) {
        try {
          await apiFavorite(ocrProduct.id);
        } catch {
          // OCR 제품은 products 테이블에 없어 FK violation으로 API 실패.
          // API 실패 여부와 무관하게 로컬 store에는 저장 (세션 내 즐겨찾기 유지).
        }
      }
      const item: FavoriteItem = {
        id: `fav-${Date.now()}`,
        productId: ocrProduct.id,
        userId: currentUser.id,
        addedAt: new Date(),
        product: ocrProduct,
      };
      addFavToStore(item);
      setFavorited(true);
    } finally {
      setFavLoading(false);
    }
  }

  // ── Permission loading ────────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Permission denied ─────────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>
          CLIR needs camera access to photograph ingredient labels.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <View style={styles.root}>
        <ScanHeader
          insetTop={insets.top}
          subtitle="Scan OCR of the product"
          onBack={() => navigation.goBack()}
          onHistory={() => navigation.navigate('ScanHistory')}
        />
        <View style={styles.center}>
          <Text style={styles.errIcon}>⚠️</Text>
          <Text style={styles.errMsg}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleReset}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────────
  if (state === 'result' && ocrProduct) {
    const isSafe     = ocrProduct.isSafe;
    const frameColor = isSafe ? GOOD_COLOR : BAD_COLOR;
    const hasAlts    = !isSafe && ocrProduct.alternatives.length > 0;

    return (
      <View style={styles.root}>
        {/* Background photo — full screen */}
        <Image
          source={{ uri: capturedUri! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Dim overlay + frame corners + verdict circle */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.dimTop} />
          <View style={styles.dimMiddle}>
            <View style={styles.dimSide} />
            <View style={styles.guideBox}>
              <OCRCorner pos="topLeft"     color={frameColor} />
              <OCRCorner pos="topRight"    color={frameColor} />
              <OCRCorner pos="bottomLeft"  color={frameColor} />
              <OCRCorner pos="bottomRight" color={frameColor} />
              {/* Single verdict circle, centered in frame */}
              <Animated.View
                style={[
                  styles.verdictCircle,
                  { backgroundColor: frameColor, transform: [{ scale: circleAnim }] },
                ]}
              >
                <Text style={styles.verdictIcon}>{isSafe ? '✓' : '✕'}</Text>
                <Text style={styles.verdictLabel}>{isSafe ? 'Good!' : 'Bad!'}</Text>
              </Animated.View>
            </View>
            <View style={styles.dimSide} />
          </View>
          <View style={styles.dimBottom} />
        </View>

        {/* Header */}
        <ScanHeader
          insetTop={insets.top}
          subtitle="Scan OCR of the product"
          onBack={handleReset}
          onHistory={() => navigation.navigate('ScanHistory')}
        />

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: sheetAnim }], paddingBottom: insets.bottom + 16 },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.sheetClose} onPress={handleReset}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Product row */}
          <View style={styles.productRow}>
            <View style={styles.productImageBox}>
              {capturedUri && (
                <Image
                  source={{ uri: capturedUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{ocrProduct.name}</Text>
              <Text style={styles.brandName}   numberOfLines={1}>{ocrProduct.brand}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.favBtn, favorited && styles.favBtnActive]}
                  onPress={handleFavorite}
                  disabled={favLoading || favorited}
                >
                  {favLoading
                    ? <ActivityIndicator size="small" color={Colors.gray500} />
                    : (
                      <Text style={[styles.favBtnText, favorited && styles.favBtnTextActive]}>
                        {favorited ? '♥ Favorited' : '♡ Add to Favorites'}
                      </Text>
                    )
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('HistoryProductDetail', { product: ocrProduct })}
                >
                  <Text style={styles.detailText}>see more detail</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Alternatives — Bad only */}
          {hasAlts && (
            <View style={styles.altsSection}>
              <Text style={styles.altsLabel}>Alternative products</Text>
              <View style={styles.altsRow}>
                {ocrProduct.alternatives.slice(0, 3).map(alt => (
                  <View key={alt.id} style={styles.altBox}>
                    <Text style={styles.altText}>Image</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    );
  }

  // ── Preview / Analyzing ───────────────────────────────────────────────────────
  if (state === 'preview' || state === 'analyzing') {
    return (
      <View style={styles.root}>
        <View style={styles.previewHeaderBg}>
          <ScanHeader
            insetTop={insets.top}
            subtitle="Scan OCR of the product"
            onBack={handleReset}
            onHistory={() => navigation.navigate('ScanHistory')}
          />
        </View>
        <View style={styles.previewContainer}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
          )}
          {state === 'analyzing' && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator color={Colors.white} size="large" />
              <Text style={styles.analyzingText}>분석 중...</Text>
            </View>
          )}
        </View>
        <View style={[styles.previewActions, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.retakePill}
            onPress={state === 'analyzing' ? handleCancel : handleReset}
          >
            <Text style={styles.retakePillText}>
              {state === 'analyzing' ? '취소' : '↺  Retake'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.analyzeBtn, state === 'analyzing' && styles.analyzeBtnOff]}
            onPress={handleAnalyze}
            disabled={state === 'analyzing'}
          >
            {state === 'analyzing'
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.analyzeBtnText}>Analyze</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Idle: full-screen camera with guide frame ─────────────────────────────────
  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dim overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dimTop} />
        <View style={styles.dimMiddle}>
          <View style={styles.dimSide} />
          <View style={styles.guideBox}>
            <OCRCorner pos="topLeft"     color={Colors.white} />
            <OCRCorner pos="topRight"    color={Colors.white} />
            <OCRCorner pos="bottomLeft"  color={Colors.white} />
            <OCRCorner pos="bottomRight" color={Colors.white} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom} />
      </View>

      {/* Header */}
      <ScanHeader
        insetTop={insets.top}
        subtitle="Scan OCR of the product"
        onBack={() => navigation.goBack()}
        onHistory={() => navigation.navigate('ScanHistory')}
      />

      {/* Shutter */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture} activeOpacity={0.8}>
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36,
  },

  // Permission
  permIcon:    { fontSize: 52, marginBottom: 16 },
  permTitle:   { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 12, textAlign: 'center' },
  permDesc:    { fontSize: 14, color: Colors.gray300, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  permBtn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Error
  errIcon:       { fontSize: 48, marginBottom: 16 },
  errMsg:        { fontSize: 15, color: Colors.gray300, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retakeBtn:     { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 36 },
  retakeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Dim overlay (idle + result)
  dimTop:    { height: DIM_TOP_H, backgroundColor: DIM },
  dimMiddle: { flexDirection: 'row', height: GUIDE_H },
  dimSide:   { flex: 1, backgroundColor: DIM },
  dimBottom: { height: DIM_BOTTOM_H, backgroundColor: DIM },
  guideBox:  { width: GUIDE_W, height: GUIDE_H },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_LEN },

  // Verdict circle — centered inside guideBox via absolute position
  verdictCircle: {
    position: 'absolute',
    top:  (GUIDE_H - CIRCLE_D) / 2,
    left: (GUIDE_W - CIRCLE_D) / 2,
    width:  CIRCLE_D,
    height: CIRCLE_D,
    borderRadius: CIRCLE_D / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  verdictIcon:  { fontSize: 52, color: Colors.white, fontWeight: '700', lineHeight: 60 },
  verdictLabel: { fontSize: 22, color: Colors.white, fontWeight: '800', marginTop: -4 },

  // Shutter
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingTop: 16,
  },
  shutterBtn: {},
  shutterOuter: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 5, elevation: 6,
  },
  shutterInner: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2.5, borderColor: Colors.gray300,
  },

  // Preview / Analyzing
  previewHeaderBg:  { backgroundColor: '#000' },
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewImage:     { flex: 1, width: '100%' },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  analyzingText: { fontSize: 15, color: Colors.white, fontWeight: '600' },
  previewActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingTop: 20, paddingHorizontal: 24, backgroundColor: '#111',
  },
  retakePill:     { borderWidth: 1.5, borderColor: Colors.white, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28 },
  retakePillText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  analyzeBtn:     { backgroundColor: Colors.primary, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 36, minWidth: 120, alignItems: 'center' },
  analyzeBtnOff:  { opacity: 0.6 },
  analyzeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Result — bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20,
  },
  sheetClose: {
    position: 'absolute', top: 16, right: 16,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  sheetCloseText: { fontSize: 13, color: Colors.black, fontWeight: '600' },

  productRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  productImageBox: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: Colors.gray100, flexShrink: 0, overflow: 'hidden',
  },
  productInfo: { flex: 1, gap: 4 },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.black },
  brandName:   { fontSize: 13, color: Colors.gray500 },
  actionRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' },

  favBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.white,
  },
  favBtnActive:     { borderColor: Colors.black, backgroundColor: Colors.black },
  favBtnText:       { fontSize: 12, color: Colors.gray700, fontWeight: '600' },
  favBtnTextActive: { color: Colors.white },

  detailText: { fontSize: 12, color: Colors.gray500, textDecorationLine: 'underline' },

  // Alternatives (Bad only)
  altsSection: { borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: 14, marginBottom: 4 },
  altsLabel:   { fontSize: 14, fontWeight: '700', color: Colors.black, marginBottom: 10 },
  altsRow:     { flexDirection: 'row', gap: 10 },
  altBox: {
    flex: 1, aspectRatio: 1,
    backgroundColor: Colors.gray100, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  altText: { fontSize: 12, color: Colors.gray300 },
});

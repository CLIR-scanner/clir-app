import React, { useCallback, useRef, useState, createRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScanStackParamList, Product, AnalysisResult } from '../../types';
import { Colors } from '../../constants/colors';
import { scanBarcode, analyzeProduct, saveScanHistory } from '../../services/scan.service';
import { addFavorite } from '../../services/list.service';
import { useScanStore } from '../../store/scan.store';
import { useListStore } from '../../store/list.store';

type Props = NativeStackScreenProps<ScanStackParamList, 'Scan'>;

const BARCODE_TYPES = [
  'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr',
] as const;

// ── Layout constants ──────────────────────────────────────────────────────────
const GUIDE_W    = 264;
const GUIDE_H    = 148;
const GUIDE_TOP  = 190;
const CORNER_LEN = 32;
const CORNER_W   = 4;
const CIRCLE_D   = 120;
const BADGE_D    = 54;
const DIM        = 'rgba(0,0,0,0.52)';
const GOOD_COLOR = '#25FF81';
const BAD_COLOR  = '#FF0000';

export default function ScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [processing, setProcessing]           = useState(false);
  const [scanResult, setScanResult]           = useState<{ product: Product; analysis: AnalysisResult } | null>(null);
  const [favLoading, setFavLoading]           = useState(false);
  const [favorited,  setFavorited]            = useState(false);

  const [cameraActive, setCameraActive] = useState(true);

  const processingRef    = useRef(false);
  const latestBarcodeRef = useRef<string | null>(null);
  const cameraRef        = createRef<CameraView>();

  // Animations
  const circleScale = useRef(new Animated.Value(0)).current;
  const sheetY      = useRef(new Animated.Value(320)).current;

  const addHistory         = useScanStore(s => s.addHistory);
  const history            = useScanStore(s => s.history);
  const favorites          = useListStore(s => s.favorites);
  const addFavoriteToStore = useListStore(s => s.addFavorite);

  const lastProductImage = history[0]?.product.image;

  // ── Focus / blur: camera lifecycle ───────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      // Screen focused → activate camera + reset all scan state
      setCameraActive(true);
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
      setScanResult(null);
      circleScale.setValue(0);
      sheetY.setValue(320);

      return () => {
        // Screen blurred → deactivate camera + stop scanning
        setCameraActive(false);
        processingRef.current = false;
      };
    }, [circleScale, sheetY]),
  );

  // ── Overlay animation helpers ─────────────────────────────────────────────

  function showOverlay(product: Product, analysis: AnalysisResult) {
    setScanResult({ product, analysis });
    setFavorited(false);
    circleScale.setValue(0);
    sheetY.setValue(320);
    Animated.parallel([
      Animated.spring(circleScale, {
        toValue: 1, tension: 80, friction: 6, useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 0, duration: 330,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }

  function dismissOverlay() {
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY,      { toValue: 320, duration: 240, useNativeDriver: true }),
    ]).start(() => {
      setScanResult(null);
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
    });
  }

  // ── Core barcode processing ───────────────────────────────────────────────

  async function processBarcode(barcode: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    setBarcodeDetected(true);
    setProcessing(true);

    try {
      const product        = await scanBarcode(barcode);
      const ingredientIds  = product.ingredients.map(i => i.id);
      const analysis       = await analyzeProduct({ productId: product.id, ingredientIds });

      // Save history silently
      try {
        const historyItem = await saveScanHistory({ productId: product.id, result: analysis.verdict });
        addHistory(historyItem);
      } catch { /* silent */ }

      setProcessing(false);
      showOverlay(product, analysis);
    } catch {
      // Product not in DB → OCR fallback
      navigation.navigate('OCRCapture', { barcode });
      setTimeout(() => {
        processingRef.current    = false;
        latestBarcodeRef.current = null;
        setBarcodeDetected(false);
        setProcessing(false);
      }, 1500);
    }
  }

  // ── Back button ───────────────────────────────────────────────────────────

  function handleBack() {
    if (scanResult) {
      dismissOverlay();
    } else if (processingRef.current || barcodeDetected) {
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
    } else {
      navigation.canGoBack() && navigation.goBack();
    }
  }

  // ── Auto barcode scan ─────────────────────────────────────────────────────

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      // URL 형태 QR 코드는 제품 바코드가 아님 (Expo 개발 QR 등)
      if (/^https?:\/\/|^exp:\/\//.test(result.data)) return;
      latestBarcodeRef.current = result.data;
      if (processingRef.current) return;
      processBarcode(result.data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Manual camera button ──────────────────────────────────────────────────

  async function handleManualCapture() {
    if (processingRef.current) return;
    if (latestBarcodeRef.current) {
      processBarcode(latestBarcodeRef.current);
      return;
    }
    // No barcode in view → hand off to OCRCapture
    if (cameraRef.current) {
      try { await cameraRef.current.takePictureAsync({ quality: 0.8 }); }
      catch { /* ignore */ }
    }
    navigation.navigate('OCRCapture', {});
  }

  // ── Add to Favorites ──────────────────────────────────────────────────────

  async function handleFavorite() {
    if (!scanResult || favLoading || favorited) return;
    const { product } = scanResult;
    // Already in favorites?
    if (favorites.some(f => f.productId === product.id)) {
      setFavorited(true);
      return;
    }
    setFavLoading(true);
    try {
      const item = await addFavorite(product.id);
      addFavoriteToStore(item);
      setFavorited(true);
    } catch { /* silent */ }
    finally { setFavLoading(false); }
  }

  // ── See more detail ───────────────────────────────────────────────────────

  function handleSeeDetail() {
    if (!scanResult) return;
    navigation.navigate('HistoryProductDetail', { product: scanResult.product });
  }

  // ── Permission loading ────────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permContainer}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permDesc}>
          CLIR needs camera access to scan barcodes and ingredient labels.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSafe       = scanResult?.analysis.isSafe ?? true;
  const cornerColor  = scanResult
    ? (isSafe ? GOOD_COLOR : BAD_COLOR)
    : barcodeDetected ? '#FF0000' : Colors.white;
  const verdictColor = isSafe ? GOOD_COLOR : BAD_COLOR;
  const hasAlts      = !isSafe && (scanResult?.product.alternatives.length ?? 0) > 0;
  const alreadyFav   = scanResult
    ? favorites.some(f => f.productId === scanResult.product.id)
    : false;

  return (
    <View style={styles.root}>
      {/* Full-screen camera — unmounted when screen is not focused */}
      {cameraActive && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={processingRef.current ? undefined : handleBarcodeScanned}
        />
      )}

      {/* Dim overlay with guide window */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.dimTop} />
        <View style={styles.dimMiddle}>
          <View style={styles.dimSide} />
          <View style={styles.guideBox}>
            <ScanCorner pos="topLeft"     color={cornerColor} />
            <ScanCorner pos="topRight"    color={cornerColor} />
            <ScanCorner pos="bottomLeft"  color={cornerColor} />
            <ScanCorner pos="bottomRight" color={cornerColor} />
            {/* Verdict circle — centered inside frame, single circle */}
            {scanResult && (
              <Animated.View
                style={[
                  styles.verdictWrap,
                  { borderColor: verdictColor, transform: [{ scale: circleScale }] },
                ]}
              >
                <View style={[styles.verdictBadge, { backgroundColor: verdictColor }]}>
                  <Text style={styles.verdictBadgeIcon}>{isSafe ? '✓' : '✕'}</Text>
                </View>
                <Text style={[styles.verdictLabel, { color: verdictColor }]}>
                  {isSafe ? 'Good!' : 'Bad!'}
                </Text>
              </Animated.View>
            )}
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom} />
      </View>

      {/* Header */}
      <ScanHeader
        insetTop={insets.top}
        onBack={handleBack}
        onHistory={() => navigation.navigate('ScanHistory')}
        historyImageUri={lastProductImage}
      />

      {/* Processing spinner */}
      {processing && !scanResult && (
        <View style={styles.spinnerWrap} pointerEvents="none">
          <ActivityIndicator color={Colors.white} size="large" />
        </View>
      )}

      {/* Bottom camera button — hidden while overlay is showing */}
      {!scanResult && !processing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={styles.shutterBtn}
            onPress={handleManualCapture}
            activeOpacity={0.8}
          >
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom sheet ─────────────────────────────────────────────────────── */}
      {scanResult && (
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: sheetY }] },
          ]}
        >
          {/* X close button */}
          <TouchableOpacity style={styles.sheetClose} onPress={dismissOverlay}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Product row */}
          <View style={styles.productRow}>
            <View style={styles.productImg}>
              {scanResult.product.image ? (
                <Image
                  source={{ uri: scanResult.product.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>
                {scanResult.product.name}
              </Text>
              <Text style={styles.productBrand} numberOfLines={1}>
                {scanResult.product.brand}
              </Text>
              <View style={styles.productActions}>
                {/* Add to Favorites */}
                <TouchableOpacity
                  style={[
                    styles.favBtn,
                    (favorited || alreadyFav) && styles.favBtnActive,
                  ]}
                  onPress={handleFavorite}
                  disabled={favLoading || favorited || alreadyFav}
                >
                  {favLoading ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Text style={[
                      styles.favBtnText,
                      (favorited || alreadyFav) && styles.favBtnTextActive,
                    ]}>
                      {(favorited || alreadyFav) ? '♥' : '♡'} Add to Favorites
                    </Text>
                  )}
                </TouchableOpacity>

                {/* See more detail */}
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
                {scanResult.product.alternatives.slice(0, 3).map(alt => (
                  <View key={alt.id} style={styles.altThumb}>
                    {alt.image ? (
                      <Image
                        source={{ uri: alt.image }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.altThumbText} numberOfLines={2}>
                        {alt.name}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ── Shared header (exported for OCRCaptureScreen) ─────────────────────────────
export function ScanHeader({
  insetTop,
  onBack,
  onHistory,
  subtitle = 'Scan Bar code of the product',
  historyImageUri,
}: {
  insetTop: number;
  onBack: () => void;
  onHistory: () => void;
  subtitle?: string;
  historyImageUri?: string;
}) {
  return (
    <View style={[headerStyles.wrap, { paddingTop: insetTop + 10 }]}>
      <TouchableOpacity
        style={headerStyles.iconBtn}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={headerStyles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={headerStyles.center}>
        <Text style={headerStyles.title}>Scan</Text>
        <Text style={headerStyles.subtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity
        style={[headerStyles.iconBtn, headerStyles.historyBtn]}
        onPress={onHistory}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {historyImageUri ? (
          <Image
            source={{ uri: historyImageUri }}
            style={headerStyles.historyImg}
            resizeMode="cover"
          />
        ) : (
          <HistoryIcon />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Corner mark ───────────────────────────────────────────────────────────────
type CornerPos = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

function ScanCorner({ pos, color }: { pos: CornerPos; color: string }) {
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

// ── History icon (fallback) ───────────────────────────────────────────────────
function HistoryIcon() {
  return (
    <View style={historyIconStyles.box}>
      <View style={historyIconStyles.line} />
      <View style={[historyIconStyles.line, { width: 8 }]} />
      <View style={historyIconStyles.line} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Permission
  permContainer: { flex: 1, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  permIcon:      { fontSize: 52, marginBottom: 16 },
  permTitle:     { fontSize: 20, fontWeight: '700', color: Colors.white, marginBottom: 12, textAlign: 'center' },
  permDesc:      { fontSize: 14, color: Colors.gray300, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  permBtn:       { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  permBtnText:   { color: Colors.white, fontWeight: '700', fontSize: 15 },

  // Dim overlay
  dimTop:    { height: GUIDE_TOP, backgroundColor: DIM },
  dimMiddle: { flexDirection: 'row', height: GUIDE_H },
  dimSide:   { flex: 1, backgroundColor: DIM },
  dimBottom: { flex: 1, backgroundColor: DIM },
  guideBox:  { width: GUIDE_W, height: GUIDE_H },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_LEN },

  // Spinner
  spinnerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  // Bottom camera button
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

  // Verdict circle — positioned inside guideBox
  verdictWrap: {
    position: 'absolute',
    top:  (GUIDE_H - CIRCLE_D) / 2,
    left: (GUIDE_W - CIRCLE_D) / 2,
    width:  CIRCLE_D,
    height: CIRCLE_D,
    borderRadius: CIRCLE_D / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  verdictBadge: {
    width: BADGE_D, height: BADGE_D,
    borderRadius: BADGE_D / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  verdictBadgeIcon: { fontSize: 26, color: Colors.white, fontWeight: '900', lineHeight: 30 },
  verdictLabel:     { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20,
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
  productActions:{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },

  favBtn:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray300, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  favBtnActive:   { borderColor: Colors.danger },
  favBtnText:     { fontSize: 12, color: Colors.gray700 },
  favBtnTextActive:{ color: Colors.danger },

  seeDetailText: { fontSize: 12, color: Colors.gray500, textDecorationLine: 'underline' },

  // Alternatives
  altSection: { marginTop: 2, paddingBottom: 4 },
  altTitle:   { fontSize: 13, fontWeight: '600', color: Colors.black, marginBottom: 10 },
  altRow:     { flexDirection: 'row', gap: 10 },
  altThumb:   { width: 80, height: 80, borderRadius: 12, backgroundColor: Colors.gray100, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 6 },
  altThumbText:{ fontSize: 10, color: Colors.gray500, textAlign: 'center' },
});

const headerStyles = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 10 },
  iconBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:  { fontSize: 22, color: Colors.white, lineHeight: 28, marginTop: Platform.OS === 'ios' ? -1 : 0 },
  center:     { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  title:      { fontSize: 18, fontWeight: '700', color: Colors.white, letterSpacing: 0.2 },
  subtitle:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, textAlign: 'center' },
  historyBtn: { borderRadius: 8, overflow: 'hidden' },
  historyImg: { width: 36, height: 36, borderRadius: 8 },
});

const historyIconStyles = StyleSheet.create({
  box:  { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  line: { height: 2, width: 14, backgroundColor: Colors.white, borderRadius: 1 },
});

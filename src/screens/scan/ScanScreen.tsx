import React, { useCallback, useRef, useState } from 'react';
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
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { ScanStackParamList, MainTabParamList, Product, AnalysisResult, RiskLevel, FavoriteItem } from '../../types';
import { Colors } from '../../constants/colors';
import {
  scanBarcode,
  recognizeIngredients,
  analyzeProduct,
  saveScanHistory,
  getScanHistory,
} from '../../services/scan.service';
import { ApiError } from '../../lib/api';
import {
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
  getFavorites,
} from '../../services/list.service';
import { useScanStore } from '../../store/scan.store';
import { useListStore } from '../../store/list.store';
import ScannerCamera, {
  ScannerCameraHandle,
  ScannerResult,
} from '../../components/ScannerCamera';
import RiskBadgeIcon from '../../components/common/RiskBadgeIcon';

type Props = NativeStackScreenProps<ScanStackParamList, 'Scan'>;

const BARCODE_TYPES = [
  'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr',
] as const;

// ── Layout constants ──────────────────────────────────────────────────────────
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// Figma reference frame: 393 x 852
const SCAN_FOOTER_H = 235;
const SCAN_FOOTER_TOP = SCREEN_H - SCAN_FOOTER_H;

// Barcode frame
const BARCODE_CLEAR_W = Math.min(328, SCREEN_W - 65);
const BARCODE_CLEAR_H = 167;
const BARCODE_CLEAR_LEFT = (SCREEN_W - BARCODE_CLEAR_W) / 2;
const BARCODE_CLEAR_TOP = Math.min(334, SCAN_FOOTER_TOP - BARCODE_CLEAR_H - 32);
const GUIDE_W = Math.min(350, SCREEN_W - 40);
const GUIDE_H = 193.5;
const GUIDE_LEFT = (SCREEN_W - GUIDE_W) / 2;
const GUIDE_TOP = BARCODE_CLEAR_TOP - 14;

// OCR frame width (height is insets-dependent, computed inside component)
const OCR_GUIDE_W = SCREEN_W - 50;

const CORNER_LEN = 39;
const CORNER_H   = 42.5;
const CORNER_W   = 2;
const CIRCLE_D   = 120;
const BADGE_D    = 54;
const DIM        = 'rgba(0,0,0,0.38)';
const GOOD_COLOR = Colors.scanCorrect;
const BAD_COLOR  = '#FF0000';
const RESULT_BADGE_D = 190;
const RESULT_BADGE_ICON_D = 78;

const TOGGLE_W   = 241;
const TOGGLE_H   = 36.0213508605957;
const TOGGLE_PAD = 3.430604934692383;
const TOGGLE_PILL_W = 124.35942840576172;

const VERDICT_DISPLAY: Record<RiskLevel, { label: string; color: string }> = {
  safe:    { label: 'Good!', color: Colors.scanCorrect },
  caution: { label: 'Poor!', color: '#FF9D00' },
  danger:  { label: 'Bad!',  color: BAD_COLOR },
};

export default function ScanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const route  = useRoute<RouteProp<ScanStackParamList, 'Scan'>>();
  const previousTab = route.params?.previousTab;

  // OCR 프레임 높이: 상하 safe area + 헤더(80) + 촬영버튼 영역(100) 제외
  const ocrGuideH  = SCREEN_H - insets.top - insets.bottom - 340;
  const ocrDimTop  = insets.top + 130;
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [processing, setProcessing]           = useState(false);
  const [scanResult, setScanResult]           = useState<{ product: Product; analysis: AnalysisResult } | null>(null);
  const [scanPreviewUri, setScanPreviewUri]   = useState<string | null>(null);
  const [favLoading, setFavLoading]           = useState(false);
  const [favorited,  setFavorited]            = useState(false);

  const [cameraActive, setCameraActive] = useState(true);
  const [isOCRMode,    setIsOCRMode]    = useState(false);

  const processingRef    = useRef(false);
  const latestBarcodeRef = useRef<string | null>(null);
  const cameraRef        = useRef<ScannerCameraHandle>(null);

  // Animations
  const circleScale = useRef(new Animated.Value(0)).current;
  const sheetY      = useRef(new Animated.Value(320)).current;
  const toggleSlide = useRef(new Animated.Value(0)).current;

  const addHistory         = useScanStore(s => s.addHistory);
  const setHistory         = useScanStore(s => s.setHistory);
  const history            = useScanStore(s => s.history);
  const addFavoriteToStore = useListStore(s => s.addFavorite);
  const removeFavoriteFromStore = useListStore(s => s.removeFavorite);
  const setFavoritesInStore = useListStore(s => s.setFavorites);
  // favorites는 렌더 구독 대신 getState()로 스냅샷 조회 (showOverlay, handleFavorite)

  const lastProductImage = history[0]?.product.image;

  // ── Focus / blur: camera lifecycle + history 썸네일 로드 ──────────────────────
  useFocusEffect(
    useCallback(() => {
      // Screen focused → activate camera + reset all scan state
      setCameraActive(true);
      setIsOCRMode(false);
      toggleSlide.setValue(0);
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
      setScanResult(null);
      setScanPreviewUri(null);
      circleScale.setValue(0);
      sheetY.setValue(320);

      // history store가 비어있으면 서버에서 로드 — 앱 재시작 후 썸네일 복원
      // 실패 시 재시도 없이 무시하고 다음 focus에서 다시 시도
      if (useScanStore.getState().history.length === 0) {
        getScanHistory()
          .then(data => setHistory(data))
          .catch(() => {});
      }

      return () => {
        // Screen blurred → deactivate camera + stop scanning
        setCameraActive(false);
        processingRef.current = false;
      };
    }, [circleScale, sheetY, setHistory, toggleSlide]),
  );

  // ── Mode toggle ───────────────────────────────────────────────────────────

  function handleToggleMode(ocr: boolean) {
    if (ocr === isOCRMode) return;
    // Reset scan state on mode switch
    processingRef.current    = false;
    latestBarcodeRef.current = null;
    setBarcodeDetected(false);
    setProcessing(false);
    setScanResult(null);
    setScanPreviewUri(null);
    circleScale.setValue(0);
    sheetY.setValue(320);
    setCameraActive(true);

    setIsOCRMode(ocr);
    Animated.timing(toggleSlide, {
      toValue: ocr ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }

  // ── Overlay animation helpers ─────────────────────────────────────────────

  function showOverlay(product: Product, analysis: AnalysisResult) {
    const currentFavs = useListStore.getState().favorites;
    setScanResult({ product, analysis });
    setFavorited(currentFavs.some(f => isFavoriteForProduct(f, product.id)));
    void syncFavoriteStatus(product.id);
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

  function isFavoriteForProduct(item: FavoriteItem, productId: string) {
    return item.productId === productId || item.product?.id === productId;
  }

  function makeLocalFavorite(product: Product): FavoriteItem {
    return {
      id: `fav-local-${Date.now()}`,
      productId: product.id,
      userId: '',
      memo: '',
      addedAt: new Date(),
      product,
    };
  }

  function mergeWithLocalFavorites(fetched: FavoriteItem[]) {
    const localFavorites = useListStore.getState().favorites.filter(f => f.id.startsWith('fav-local-'));
    return [
      ...localFavorites.filter(local =>
        !fetched.some(item => isFavoriteForProduct(item, local.productId)),
      ),
      ...fetched,
    ];
  }

  async function syncFavoriteStatus(productId: string) {
    const current = useListStore.getState().favorites;
    if (current.length > 0) {
      setFavorited(current.some(f => isFavoriteForProduct(f, productId)));
      return;
    }
    try {
      const fetched = await getFavorites();
      const merged = mergeWithLocalFavorites(fetched);
      setFavoritesInStore(merged);
      setFavorited(merged.some(f => isFavoriteForProduct(f, productId)));
    } catch {
      // Favorite status sync is best-effort; the button still works with local state.
    }
  }

  function dismissOverlay() {
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetY,      { toValue: 320, duration: 240, useNativeDriver: true }),
    ]).start(() => {
      setScanResult(null);
      setScanPreviewUri(null);
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
    });
  }

  // ── Core barcode processing ───────────────────────────────────────────────

  async function captureScanPreview() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.45 });
      setScanPreviewUri(photo.uri);
    } catch {
      // Camera preview blur is best-effort; result UI still works without it.
    }
  }

  async function processBarcode(barcode: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    setBarcodeDetected(true);
    setProcessing(true);
    void captureScanPreview();

    try {
      const product        = await scanBarcode(barcode);
      const ingredientIds  = product.ingredients.map(i => i.id);
      const analysis       = await analyzeProduct({ productId: product.id, ingredientIds });

      // Save history silently — analysis 결과를 반영한 enrichedProduct로 저장
      // riskIngredients / mayContainIngredients 가 history 상세에서도 표시되도록
      try {
        const toIngredient = (t: (typeof analysis.triggeredBy)[number]) => ({
          id: t.id, name: t.name, nameKo: t.nameKo,
          description: '', riskLevel: t.riskLevel, sources: [] as [],
        });
        const enrichedProduct = {
          ...product,
          isSafe:                analysis.isSafe,
          riskLevel:             analysis.verdict,
          riskIngredients:       analysis.triggeredBy.filter(t => t.riskLevel === 'danger').map(toIngredient),
          mayContainIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'caution').map(toIngredient),
        };
        const historyItem = await saveScanHistory({ productId: product.id, result: analysis.verdict });
        addHistory({ ...historyItem, product: enrichedProduct });
      } catch { /* silent */ }

      setProcessing(false);
      showOverlay(product, analysis);
    } catch (err) {
      // 스캔 잠금 해제 — 오류 후 재스캔 가능하도록
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
      setScanPreviewUri(null);

      if (err instanceof ApiError) {
        if (err.code === 'PRODUCT_NOT_FOUND') {
          Alert.alert(
            'Product Not Found',
            'Scan the ingredient label with OCR instead.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Scan Label', onPress: () => handleToggleMode(true) },
            ],
          );
        } else {
          Alert.alert('Error', err.message);
        }
      } else {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please try again later.');
      }
    }
  }

  async function processOCRPhoto(imageUri: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    setBarcodeDetected(false);
    setProcessing(true);
    setScanPreviewUri(imageUri);

    try {
      const ocrResult = await recognizeIngredients(imageUri);
      // BE 의 product-upsert 파이프라인(Step 8) 이 성공하면 ocrResult.productId 가
      // 채워져 있다(형식: 'ocr-{phash}'). 이 값을 product.id 로 그대로 써야
      // scan_history / favorites 의 FK 제약을 통과한다 — 무시하고 ocr-${Date.now()}
      // 로 생성하면 BE 400 / 404 가 떨어진다 (사용자 보고 버그).
      const beProductId = ocrResult.productId;
      const analysis  = await analyzeProduct({
        productId: beProductId,  // server-side reverify 가능하면 사용
        ingredientIds: ocrResult.ingredients.map(i => i.id),
      });
      const toIngredient = (t: (typeof analysis.triggeredBy)[number]) => ({
        id: t.id,
        name: t.name,
        nameKo: t.nameKo,
        description: '',
        riskLevel: t.riskLevel,
        sources: [] as [],
        ...(t.id.startsWith('ing-may-') ? { relatedAllergenId: t.id.replace('ing-may-', 'ing-') } : {}),
      });
      // BE 가 productId 를 못 만든 경우(upsert 실패) 만 로컬 fallback. 'ocr-local-'
      // 접두사로 분리해 server-side 저장 시도를 명시적으로 스킵.
      const product: Product = {
        id: beProductId ?? `ocr-local-${Date.now()}`,
        name: 'Scanned Product',
        brand: '',
        image: imageUri,
        ingredients: ocrResult.ingredients.map(i => ({
          id: i.id,
          name: i.name,
          nameKo: i.nameKo,
          description: '',
          riskLevel: 'safe',
          sources: [],
        })),
        isSafe: analysis.isSafe,
        riskLevel: analysis.verdict,
        riskIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'danger').map(toIngredient),
        mayContainIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'caution').map(toIngredient),
        alternatives: [],
        dataCompleteness: 'partial',
      };

      // BE-known productId 일 때만 server-side 이력 저장. 로컬 fallback 은 스킵.
      if (beProductId) {
        try {
          const historyItem = await saveScanHistory({ productId: beProductId, result: product.riskLevel });
          addHistory({ ...historyItem, product });
        } catch { /* silent */ }
      }

      setProcessing(false);
      showOverlay(product, analysis);
    } catch (err) {
      processingRef.current = false;
      setProcessing(false);
      setScanPreviewUri(null);
      const isOcrFail = err instanceof ApiError && err.code === 'OCR_FAILED';
      Alert.alert(
        isOcrFail ? 'Recognition Failed' : 'Analysis Failed',
        isOcrFail
          ? 'Please take a brighter, clearer photo of the ingredient label.'
          : 'We could not analyze this ingredient label. Please try again.',
      );
    }
  }

  // ── Back button ───────────────────────────────────────────────────────────

  function handleBack() {
    if (scanResult) {
      dismissOverlay();
      return;
    }
    if (processingRef.current || barcodeDetected) {
      processingRef.current    = false;
      latestBarcodeRef.current = null;
      setBarcodeDetected(false);
      setProcessing(false);
      setScanPreviewUri(null);
      return;
    }
    // 스캔 탭은 Tab.Navigator의 한 탭 — 직전 탭으로 돌아가려면 부모(탭) 네비게이터로 이동.
    // previousTab 없으면 기본 탭(Search)로 폴백.
    const target: keyof MainTabParamList = previousTab ?? 'SearchTab';
    const parent = navigation.getParent<
      import('@react-navigation/native').NavigationProp<MainTabParamList>
    >();
    if (parent) {
      parent.navigate(target);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  // ── Auto barcode scan ─────────────────────────────────────────────────────

  const handleBarcodeScanned = useCallback(
    (result: ScannerResult) => {
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

    if (isOCRMode) {
      if (!cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        void processOCRPhoto(photo.uri);
      } catch {
        // 촬영 실패 시 카메라 화면 그대로 유지
      }
      return;
    }

    // Barcode mode: process captured barcode or switch to OCR in-place.
    if (latestBarcodeRef.current) {
      processBarcode(latestBarcodeRef.current);
      return;
    }
    handleToggleMode(true);
  }

  // ── Add to Favorites ──────────────────────────────────────────────────────

  async function handleFavorite() {
    if (!scanResult || favLoading) return;
    const { product } = scanResult;
    setFavLoading(true);

    try {
      let currentFavs = useListStore.getState().favorites;
      let existing = currentFavs.find(f => isFavoriteForProduct(f, product.id));

      if (!existing) {
        try {
          currentFavs = await getFavorites();
          const merged = mergeWithLocalFavorites(currentFavs);
          setFavoritesInStore(merged);
          existing = merged.find(f => isFavoriteForProduct(f, product.id));
        } catch {
          // If the server list cannot be fetched, continue with local state.
        }
      }

      if (existing) {
        let favoriteToDelete = existing;
        try {
          const fetched = await getFavorites();
          const merged = mergeWithLocalFavorites(fetched);
          setFavoritesInStore(merged);
          favoriteToDelete = merged.find(f => isFavoriteForProduct(f, product.id)) ?? existing;
        } catch {
          // Keep the existing local snapshot if refresh fails.
        }

        removeFavoriteFromStore(favoriteToDelete.id);
        setFavorited(false);
        if (!favoriteToDelete.id.startsWith('fav-local-')) {
          try {
            await apiRemoveFavorite(favoriteToDelete.id);
          } catch (err) {
            try {
              const fetched = await getFavorites();
              const serverExisting = fetched.find(f => isFavoriteForProduct(f, product.id));
              setFavoritesInStore(mergeWithLocalFavorites(fetched));
              if (serverExisting) {
                setFavorited(true);
              }
            } catch {
              addFavoriteToStore(favoriteToDelete);
              setFavorited(true);
            }
          }
        }
        return;
      }

      const localItem = makeLocalFavorite(product);
      addFavoriteToStore(localItem);
      setFavorited(true);

      // 로컬 OCR fallback (products 테이블에 없는 임시 ID) 은 server-side 호출
      // 자체를 스킵 — BE 가 어차피 404 PRODUCT_NOT_FOUND 를 반환하므로 무의미한
      // 네트워크 호출 + 에러 로그를 만들 뿐. 로컬 즐겨찾기로만 유지.
      if (product.id.startsWith('ocr-local-')) {
        return;
      }

      try {
        const serverItem = await apiAddFavorite(product.id);
        removeFavoriteFromStore(localItem.id);
        addFavoriteToStore({ ...serverItem, product });
      } catch (err) {
        // OCR products may not exist in the products table yet; keep the local favorite.
        // If this was a duplicate add race, refresh and prefer the server favorite id.
        if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
          try {
            const fetched = await getFavorites();
            setFavoritesInStore(mergeWithLocalFavorites(fetched));
          } catch {
            // Keep the optimistic local favorite.
          }
        }
      }
    } finally {
      setFavLoading(false);
    }
  }

  // ── See more detail ───────────────────────────────────────────────────────

  function handleSeeDetail() {
    if (!scanResult) return;
    const { product, analysis } = scanResult;
    // analysis 결과를 product에 반영 — triggeredBy를 riskLevel 기준으로 분리
    // danger → riskIngredients (직접 알러겐)
    // caution → mayContainIngredients (trace, strict 모드 한정)
    // product.ingredients(전체 성분)는 scanBarcode 응답 그대로 유지
    const toIngredient = (t: (typeof analysis.triggeredBy)[number]) => ({
      id: t.id, name: t.name, nameKo: t.nameKo,
      description: '', riskLevel: t.riskLevel, sources: [] as [],
    });
    const detailProduct = {
      ...product,
      isSafe: analysis.isSafe,
      riskLevel: analysis.verdict,
      riskIngredients:      analysis.triggeredBy.filter(t => t.riskLevel === 'danger').map(toIngredient),
      mayContainIngredients: analysis.triggeredBy.filter(t => t.riskLevel === 'caution').map(toIngredient),
    };
    navigation.navigate('HistoryProductDetail', { product: detailProduct });
  }

  // ── Permission loading ────────────────────────────────────────────────────
  // Web: browser prompts on getUserMedia inside ScannerCamera — skip gate.
  if (Platform.OS !== 'web') {
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
  }

  const resultLevel = scanResult?.analysis.verdict;
  const verdictColor = resultLevel ? VERDICT_DISPLAY[resultLevel].color : GOOD_COLOR;
  const isSafe       = scanResult?.analysis.isSafe ?? true;
  const cornerColor  = scanResult
    ? verdictColor
    : barcodeDetected ? BAD_COLOR : Colors.white;

  return (
    <View style={styles.root}>
      {/* Full-screen camera — unmounted when screen is not focused */}
      {cameraActive && (
        <ScannerCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          active={!isOCRMode && !processingRef.current}
          barcodeTypes={BARCODE_TYPES}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}
      {scanResult && scanPreviewUri ? (
        <Image
          source={{ uri: scanPreviewUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={isOCRMode ? 0 : 8}
        />
      ) : null}
      {scanResult ? <View style={styles.resultBackdropTint} pointerEvents="none" /> : null}

      {/* Dim overlay with guide window */}
      {isOCRMode ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.dimTop, { height: ocrDimTop }]} />
          <View style={[styles.dimMiddle, { height: ocrGuideH }]}>
            <View style={styles.dimSide} />
            <View style={[styles.guideBox, { width: OCR_GUIDE_W, height: ocrGuideH }]}>
              <ScanCorner pos="topLeft"     color={cornerColor} />
              <ScanCorner pos="topRight"    color={cornerColor} />
              <ScanCorner pos="bottomLeft"  color={cornerColor} />
              <ScanCorner pos="bottomRight" color={cornerColor} />
              {scanResult && (
                <OcrResultVerdictBadge
                  level={scanResult.analysis.verdict}
                  scaleAnim={circleScale}
                  top={(ocrGuideH - RESULT_BADGE_D) / 2}
                  left={(OCR_GUIDE_W - RESULT_BADGE_D) / 2}
                />
              )}
            </View>
            <View style={styles.dimSide} />
          </View>
          <View style={styles.dimBottom} />
        </View>
      ) : (
        <BarcodeScanOverlay cornerColor={cornerColor}>
          {scanResult && isSafe ? (
            <ResultVerdictBadge level={scanResult.analysis.verdict} scaleAnim={circleScale} />
          ) : scanResult ? (
            <ResultVerdictBadge level={scanResult.analysis.verdict} scaleAnim={circleScale} />
          ) : null}
        </BarcodeScanOverlay>
      )}

      {/* Header */}
      <ScanHeader
        insetTop={insets.top}
        onBack={handleBack}
        onHistory={() => navigation.navigate('ScanHistory')}
        historyImageUri={lastProductImage}
        toggleNode={!scanResult ? (
          <ModeToggle
            isOCRMode={isOCRMode}
            onToggle={handleToggleMode}
            slideAnim={toggleSlide}
          />
        ) : undefined}
      />

      {/* Processing spinner */}
      {processing && !scanResult && (
        <View style={styles.spinnerWrap} pointerEvents="none">
          <ActivityIndicator color={Colors.white} size="large" />
        </View>
      )}

      {/* Bottom camera button — hidden while overlay is showing */}
      {!scanResult && !processing && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.shutterBtn}
            onPress={handleManualCapture}
            activeOpacity={0.8}
          >
            <View style={styles.shutterBackground} />
            <ScanButtonIcon />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom sheet ─────────────────────────────────────────────────────── */}
      {scanResult && (
        <Animated.View
          style={[
            isSafe ? styles.goodCard : styles.riskCard,
            {
              paddingBottom: 0,
              transform: [{ translateY: sheetY }],
            },
          ]}
        >
          {/* X close button */}
          <TouchableOpacity style={isSafe ? styles.goodCardClose : styles.riskCardClose} onPress={dismissOverlay}>
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Product row */}
          <View style={isSafe ? styles.goodProductRow : styles.riskProductRow}>
            <View style={isSafe ? styles.goodProductImg : styles.riskProductImg}>
              {scanResult.product.image ? (
                <Image
                  source={{ uri: scanResult.product.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View style={isSafe ? styles.goodProductInfo : styles.riskProductInfo}>
              <Text style={isSafe ? styles.goodProductName : styles.riskProductName} numberOfLines={1}>
                {scanResult.product.name}
              </Text>
              <Text style={isSafe ? styles.goodProductBrand : styles.riskProductBrand} numberOfLines={1}>
                {scanResult.product.brand}
              </Text>
              <View style={isSafe ? styles.goodProductActions : styles.riskProductActions}>
                {/* Add to Favorites */}
                <TouchableOpacity
                  style={[
                    isSafe ? styles.goodFavBtn : styles.riskFavBtn,
                    favorited && (isSafe ? styles.goodFavBtnActive : styles.riskFavBtnActive),
                  ]}
                  onPress={handleFavorite}
                  disabled={favLoading}
                >
                  {favLoading ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Text style={[
                      isSafe ? styles.goodFavBtnText : styles.riskFavBtnText,
                      favorited && (isSafe ? styles.goodFavBtnTextActive : styles.riskFavBtnTextActive),
                    ]}>
                      {favorited ? '♥ Favorited' : '♡  Add to Favorites'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* See more detail */}
                <TouchableOpacity
                  onPress={handleSeeDetail}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={isSafe ? styles.goodSeeDetailText : styles.riskSeeDetailText}>see more detail</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isSafe ? (
              <TouchableOpacity
                style={styles.goodChevronBtn}
                onPress={handleSeeDetail}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.goodChevron}>›</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.riskChevronBtn}
                onPress={handleSeeDetail}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.goodChevron}>›</Text>
              </TouchableOpacity>
            )}
          </View>

          {!isSafe && (
            <RiskAlternatives alternatives={scanResult.product.alternatives} />
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ── Barcode overlay ───────────────────────────────────────────────────────────
function BarcodeScanOverlay({
  cornerColor,
  children,
}: {
  cornerColor: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.barcodeDimTop,
          { height: BARCODE_CLEAR_TOP },
        ]}
      />
      <View style={styles.barcodeDimMiddle}>
        <View style={[styles.barcodeDimSide, { width: BARCODE_CLEAR_LEFT }]} />
        <View style={{ width: BARCODE_CLEAR_W }} />
        <View style={[styles.barcodeDimSide, { width: BARCODE_CLEAR_LEFT }]} />
      </View>
      <View
        style={[
          styles.barcodeDimBottom,
          {
            top: BARCODE_CLEAR_TOP + BARCODE_CLEAR_H,
            bottom: 0,
          },
        ]}
      />

      <View style={styles.barcodeGuideLayer}>
        <ScanCorner pos="topLeft"     color={cornerColor} />
        <ScanCorner pos="topRight"    color={cornerColor} />
        <ScanCorner pos="bottomLeft"  color={cornerColor} />
        <ScanCorner pos="bottomRight" color={cornerColor} />
        {children}
      </View>
    </View>
  );
}

// ── Mode toggle ───────────────────────────────────────────────────────────────
function ModeToggle({
  isOCRMode,
  onToggle,
  slideAnim,
}: {
  isOCRMode: boolean;
  onToggle: (ocr: boolean) => void;
  slideAnim: Animated.Value;
}) {
  const pillTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOGGLE_W - TOGGLE_PAD * 2 - TOGGLE_PILL_W],
  });

  return (
    <View style={toggleStyles.container}>
      <Animated.View
        style={[toggleStyles.slidingPill, { transform: [{ translateX: pillTranslateX }] }]}
        pointerEvents="none"
      />
      <TouchableOpacity style={toggleStyles.tab} onPress={() => onToggle(false)} activeOpacity={0.8}>
        <Text style={[toggleStyles.tabText, !isOCRMode && toggleStyles.tabTextActive]}>BARCODE</Text>
      </TouchableOpacity>
      <TouchableOpacity style={toggleStyles.tab} onPress={() => onToggle(true)} activeOpacity={0.8}>
        <Text style={[toggleStyles.tabText, isOCRMode && toggleStyles.tabTextActive]}>OCR</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Scan button artwork (assets/scan.svg) ─────────────────────────────────────
function ScanButtonIcon() {
  return (
    <Svg width={83} height={83} viewBox="0 0 83 83" fill="none">
      <Path
        d="M8.18311 41.4672C8.18311 59.8258 23.1086 74.7512 41.4672 74.7512V54.2489C34.6814 54.2489 29.169 48.7365 29.169 41.9507C29.169 35.165 34.6814 29.6525 41.4672 29.6525V8.18311C23.1086 8.18311 8.18311 23.1086 8.18311 41.4672Z"
        fill={Colors.scanSelectedGreen}
      />
      <Path
        d="M44.2715 33.8266V34.8743V49.0099V50.0576C48.7523 50.0576 52.3951 46.4149 52.3951 41.9341C52.3951 37.4532 48.7523 33.8105 44.2715 33.8105V33.8266Z"
        fill={Colors.scanSelectedGreen}
      />
      <Path
        d="M44.4229 53.7755C51.202 53.7755 56.6975 48.4108 56.6975 41.7931C56.6975 35.1754 51.202 29.8107 44.4229 29.8107"
        stroke={Colors.scanSelectedGreen}
        strokeWidth={2.11268}
      />
    </Svg>
  );
}

// ── Result badge ──────────────────────────────────────────────────────────────
function ResultVerdictBadge({
  level,
  scaleAnim,
}: {
  level: RiskLevel;
  scaleAnim: Animated.Value;
}) {
  const verdict = VERDICT_DISPLAY[level];

  return (
    <Animated.View
      style={[
        styles.resultVerdictWrap,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.resultVerdictRing, { borderColor: verdict.color }]} />
      <RiskBadgeIcon level={level} size={RESULT_BADGE_ICON_D} style={styles.resultVerdictIcon} />
      <Text style={[styles.resultVerdictText, { color: verdict.color }]}>
        {verdict.label}
      </Text>
    </Animated.View>
  );
}

function OcrResultVerdictBadge({
  level,
  scaleAnim,
  top,
  left,
}: {
  level: RiskLevel;
  scaleAnim: Animated.Value;
  top: number;
  left: number;
}) {
  const verdict = VERDICT_DISPLAY[level];

  return (
    <Animated.View
      style={[
        styles.resultVerdictWrap,
        {
          top,
          left,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.resultVerdictRing, { borderColor: verdict.color }]} />
      <RiskBadgeIcon level={level} size={RESULT_BADGE_ICON_D} style={styles.resultVerdictIcon} />
      <Text style={[styles.resultVerdictText, { color: verdict.color }]}>
        {verdict.label}
      </Text>
    </Animated.View>
  );
}

// ── Risk result alternatives ──────────────────────────────────────────────────
function RiskAlternatives({ alternatives }: { alternatives: Product[] }) {
  const slots = [0, 1, 2];

  return (
    <View style={styles.riskAltSection}>
      <Text style={styles.riskAltTitle}>Alternative products</Text>
      <View style={styles.riskAltRow}>
        {slots.map(index => {
          const alt = alternatives[index];
          return (
            <View key={alt?.id ?? `alt-${index}`} style={styles.riskAltThumb}>
              {alt?.image ? (
                <Image
                  source={{ uri: alt.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.riskAltThumbText} numberOfLines={2}>
                  {alt ? alt.name : 'image'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Shared header (exported for OCRCaptureScreen) ─────────────────────────────
export function ScanHeader({
  insetTop,
  onBack,
  onHistory,
  subtitle,
  historyImageUri,
  toggleNode,
}: {
  insetTop: number;
  onBack: () => void;
  onHistory: () => void;
  subtitle?: string;
  historyImageUri?: string;
  toggleNode?: React.ReactNode;
}) {
  return (
    <View>
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
          {subtitle ? <Text style={headerStyles.subtitle}>{subtitle}</Text> : null}
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

      {toggleNode && (
        <View style={headerStyles.toggleRow}>
          {toggleNode}
        </View>
      )}
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
  resultBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  barcodeDimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: DIM,
  },
  barcodeDimMiddle: {
    position: 'absolute',
    top: BARCODE_CLEAR_TOP,
    left: 0,
    right: 0,
    height: BARCODE_CLEAR_H,
    flexDirection: 'row',
  },
  barcodeDimSide: {
    height: BARCODE_CLEAR_H,
    backgroundColor: DIM,
  },
  barcodeDimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: DIM,
  },
  barcodeGuideLayer: {
    position: 'absolute',
    top: GUIDE_TOP,
    left: GUIDE_LEFT,
    width: GUIDE_W,
    height: GUIDE_H,
  },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_H },

  // Spinner
  spinnerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  // Bottom camera button
  bottomBar: {
    position: 'absolute',
    top: SCAN_FOOTER_TOP + 71,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutterBtn: {
    width: 83,
    height: 83,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBackground: {
    position: 'absolute',
    width: 77,
    height: 77,
    borderRadius: 38.5,
    backgroundColor: Colors.scanLightGreen,
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
  resultVerdictWrap: {
    position: 'absolute',
    top: (GUIDE_H - RESULT_BADGE_D) / 2,
    left: (GUIDE_W - RESULT_BADGE_D) / 2,
    width: RESULT_BADGE_D,
    height: RESULT_BADGE_D,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultVerdictRing: {
    position: 'absolute',
    width: RESULT_BADGE_D,
    height: RESULT_BADGE_D,
    borderRadius: RESULT_BADGE_D / 2,
    borderWidth: 3,
  },
  resultVerdictIcon: {
    width: RESULT_BADGE_ICON_D,
    height: RESULT_BADGE_ICON_D,
    marginTop: 12,
  },
  resultVerdictText: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    textAlign: 'center',
  },

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
  goodCard: {
    position: 'absolute',
    left: 14,
    right: 15,
    bottom: 23,
    height: 130,
    backgroundColor: Colors.scanLightGreen,
    borderRadius: 16,
    overflow: 'hidden',
  },
  goodCardClose: {
    position: 'absolute',
    top: 15,
    right: 30.9,
    width: 27.1,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.scanResultClose,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  riskCard: {
    position: 'absolute',
    left: 13,
    right: 16,
    bottom: 22,
    height: 230,
    backgroundColor: Colors.scanLightGreen,
    borderRadius: 20,
    overflow: 'hidden',
  },
  riskCardClose: {
    position: 'absolute',
    top: 17.7,
    right: 31.1,
    width: 27.1,
    height: 27.7,
    borderRadius: 14,
    backgroundColor: Colors.scanResultClose,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

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
  riskProductRow: {
    position: 'absolute',
    left: 19,
    top: 25,
    right: 19,
    height: 87,
    flexDirection: 'row',
  },
  riskProductImg: {
    width: 87,
    height: 87,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  riskProductInfo: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 46,
    paddingTop: 4,
  },
  riskProductName: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  riskProductBrand: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: -2,
  },
  riskProductActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 9,
  },
  riskFavBtn: {
    height: 21,
    minWidth: 108,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 50,
    paddingLeft: 8,
    paddingRight: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskFavBtnActive: {
    borderColor: Colors.danger,
  },
  riskFavBtnText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
  riskFavBtnTextActive: {
    color: Colors.danger,
  },
  riskSeeDetailText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  riskAltSection: {
    position: 'absolute',
    left: 115,
    top: 126,
  },
  riskAltTitle: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  riskAltRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  riskAltThumb: {
    width: 60,
    height: 60,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  riskAltThumbText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
    textAlign: 'center',
  },
  riskChevronBtn: {
    position: 'absolute',
    right: 0,
    top: 28,
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodProductRow: {
    position: 'absolute',
    left: 19,
    top: 25,
    right: 19,
    height: 80,
    flexDirection: 'row',
  },
  goodProductImg: {
    width: 80,
    height: 80,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  goodProductInfo: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 46,
  },
  goodProductName: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  goodProductBrand: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: -2,
  },
  goodProductActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    gap: 9,
  },
  goodFavBtn: {
    height: 21,
    minWidth: 108,
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 50,
    paddingLeft: 8,
    paddingRight: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodFavBtnActive: {
    borderColor: Colors.danger,
  },
  goodFavBtnText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
  goodFavBtnTextActive: {
    color: Colors.danger,
  },
  goodSeeDetailText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  goodChevronBtn: {
    position: 'absolute',
    right: 0,
    top: 25,
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodChevron: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: '300',
    lineHeight: 42,
  },
});

const headerStyles = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 23, paddingBottom: 0 },
  iconBtn:    { width: 32, height: 42, alignItems: 'center', justifyContent: 'center' },
  backArrow:  { fontSize: 29, color: Colors.white, lineHeight: 32, marginTop: Platform.OS === 'ios' ? -1 : 0 },
  center:     { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  title:      { fontSize: 20, fontWeight: '700', color: Colors.white },
  subtitle:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, textAlign: 'center' },
  historyBtn: {
    width: 32,
    height: 42,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  historyImg: { width: 28, height: 42, borderRadius: 4 },
  toggleRow:  { alignItems: 'center', paddingTop: 35, paddingBottom: 0 },
});

const toggleStyles = StyleSheet.create({
  container: {
    width: TOGGLE_W,
    height: TOGGLE_H,
    borderRadius: TOGGLE_H / 2,
    backgroundColor: Colors.scanLightGreen,
    flexDirection: 'row',
    padding: TOGGLE_PAD,
    overflow: 'hidden',
    opacity: 0.9,
  },
  slidingPill: {
    position: 'absolute',
    top: TOGGLE_PAD,
    left: TOGGLE_PAD,
    width: TOGGLE_PILL_W,
    height: TOGGLE_H - TOGGLE_PAD * 2,
    borderRadius: (TOGGLE_H - TOGGLE_PAD * 2) / 2,
    backgroundColor: Colors.scanSelectedGreen,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.scanMutedGreen,
  },
  tabTextActive: {
    color: Colors.scanLightGreen,
  },
});

const historyIconStyles = StyleSheet.create({
  box:  { width: 28, height: 42, alignItems: 'center', justifyContent: 'center', gap: 4 },
  line: { height: 2, width: 14, backgroundColor: Colors.scanSelectedGreen, borderRadius: 1 },
});

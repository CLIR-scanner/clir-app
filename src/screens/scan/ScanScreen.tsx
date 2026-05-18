import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ScanStackParamList, MainTabParamList, Product, AnalysisResult, RiskLevel, FavoriteItem } from '../../types';
import { Colors } from '../../constants/colors';
import {
  scanBarcode,
  recognizeIngredients,
  analyzeProduct,
  saveScanHistory,
  getScanHistory,
  getAlternatives,
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
import ScanFeedbackBar from '../../components/common/ScanFeedbackBar';
import { scanGuideStorage } from '../../lib/storage';

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
// 보이는 둥근 테두리 프레임 = 투명 스캔창과 동일한 박스로 통일
// (Figma 393 기준 328 x 167). 위치까지 일치시켜 코너 브래킷이 창 모서리에 정확히 안착.
const GUIDE_W = BARCODE_CLEAR_W;
const GUIDE_H = BARCODE_CLEAR_H;
const GUIDE_LEFT = BARCODE_CLEAR_LEFT;
const GUIDE_TOP = BARCODE_CLEAR_TOP;

// OCR frame width (height is insets-dependent, computed inside component)
// OCR 스캔 박스: 폭은 바코드와 동일(328), 높이는 Figma 393 기준 절댓값 429
const OCR_GUIDE_W = BARCODE_CLEAR_W;
const OCR_GUIDE_H = 429;

const CORNER_LEN = 39;
const CORNER_H   = 42.5;
// Figma(393x852) 기준 절댓값 — 곡률은 기기 폭에 비례 스케일하지 않는다.
// RN border 모델: 바깥 곡률 = CORNER_RADIUS, 안 곡률 = CORNER_RADIUS - CORNER_W.
// 선두께 2, 바깥 곡률 35 (안 곡률 = 35 - 2 = 33).
const CORNER_W      = 2;
const CORNER_RADIUS = 35;
// 딤(투명 홀)과 코너 테두리 선 사이 간격. 브래킷(바깥 곡률 35)은 그대로 두고
// 홀만 안쪽으로 SCAN_GAP 들여 딤 띠를 만든다 → clear 곡률 = 35 - SCAN_GAP.
const SCAN_GAP      = 12;
// OCR 프레임(코너 브래킷 + 안쪽 딤 사각형)을 세트로 아래로 내리는 양.
// 위 scan/ocr 토글 버튼과의 간격 확보용. ocrDimTop 한 곳에 더해 함께 이동.
const OCR_FRAME_DROP = 36;
const CIRCLE_D   = 120;
const BADGE_D    = 54;
const GOOD_COLOR = Colors.scanCorrect;
const BAD_COLOR  = '#FF0000';
const RESULT_BADGE_D = 190;
const RESULT_BADGE_ICON_D = 78;
const BARCODE_GUIDE_PREVIEW_MS = 2000;
const OCR_GUIDE_PREVIEW_MS = 2000;
const GUIDE_ILLUSTRATION_W = Math.min(220, SCREEN_W - 96);
const GUIDE_ILLUSTRATION_H = GUIDE_ILLUSTRATION_W * (264 / 220);
const GUIDE_PHONE_CENTER_OFFSET_X = (134.2 - 110) * (GUIDE_ILLUSTRATION_W / 220);

const TOGGLE_W   = 241;
const TOGGLE_H   = 36.0213508605957;
const TOGGLE_PAD = 3.430604934692383;
const TOGGLE_PILL_W = 124.35942840576172;

const VERDICT_DISPLAY: Record<RiskLevel, { color: string }> = {
  safe:    { color: Colors.scanCorrect },
  caution: { color: '#FF9D00' },
  danger:  { color: BAD_COLOR },
};

export default function ScanScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route  = useRoute<RouteProp<ScanStackParamList, 'Scan'>>();
  const previousTab = route.params?.previousTab;

  const ocrGuideH  = OCR_GUIDE_H;
  const ocrDimTop  = insets.top + 130 + OCR_FRAME_DROP;
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [guideHydrated, setGuideHydrated] = useState(false);
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [processing, setProcessing]           = useState(false);
  const [scanResult, setScanResult]           = useState<{ product: Product; analysis: AnalysisResult; scanLogId?: string } | null>(null);
  const [scanPreviewUri, setScanPreviewUri]   = useState<string | null>(null);
  const [favLoading, setFavLoading]           = useState(false);
  const [favorited,  setFavorited]            = useState(false);
  const [cameraError, setCameraError]         = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(true);
  const [isOCRMode,    setIsOCRMode]    = useState(false);
  const [showBarcodeGuidePreview, setShowBarcodeGuidePreview] = useState(false);
  const [showOcrGuidePreview, setShowOcrGuidePreview] = useState(false);

  const processingRef    = useRef(false);
  const latestBarcodeRef = useRef<string | null>(null);
  const cameraRef        = useRef<ScannerCameraHandle>(null);
  const barcodeGuideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ocrGuideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 디바이스 단위 1회성. null = 미하이드레이트. 첫 focus 시 AsyncStorage 에서 채움.
  const guideSeenRef = useRef<{ barcode: boolean; ocr: boolean } | null>(null);

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

  const startBarcodeGuidePreview = useCallback(() => {
    if (barcodeGuideTimerRef.current) {
      clearTimeout(barcodeGuideTimerRef.current);
    }
    setShowBarcodeGuidePreview(true);
    if (guideSeenRef.current) guideSeenRef.current.barcode = true;
    void scanGuideStorage.markSeen('barcode');
    barcodeGuideTimerRef.current = setTimeout(() => {
      setShowBarcodeGuidePreview(false);
      barcodeGuideTimerRef.current = null;
    }, BARCODE_GUIDE_PREVIEW_MS);
  }, []);

  const stopBarcodeGuidePreview = useCallback(() => {
    if (barcodeGuideTimerRef.current) {
      clearTimeout(barcodeGuideTimerRef.current);
      barcodeGuideTimerRef.current = null;
    }
    setShowBarcodeGuidePreview(false);
  }, []);

  const startOcrGuidePreview = useCallback(() => {
    if (ocrGuideTimerRef.current) {
      clearTimeout(ocrGuideTimerRef.current);
    }
    setShowOcrGuidePreview(true);
    if (guideSeenRef.current) guideSeenRef.current.ocr = true;
    void scanGuideStorage.markSeen('ocr');
    ocrGuideTimerRef.current = setTimeout(() => {
      setShowOcrGuidePreview(false);
      ocrGuideTimerRef.current = null;
    }, OCR_GUIDE_PREVIEW_MS);
  }, []);

  const stopOcrGuidePreview = useCallback(() => {
    if (ocrGuideTimerRef.current) {
      clearTimeout(ocrGuideTimerRef.current);
      ocrGuideTimerRef.current = null;
    }
    setShowOcrGuidePreview(false);
  }, []);

  // ── 가이드 seen 플래그 하이드레이트 (mount 1회) ────────────────────────────
  // 모드 토글이 권한 grant 보다 먼저 일어날 수 있어 일단 마운트 시점에 읽어둔다.
  useEffect(() => {
    let cancelled = false;
    scanGuideStorage.read().then(seen => {
      if (cancelled) return;
      guideSeenRef.current = seen;
      setGuideHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  // ── 바코드 가이드 트리거 ─────────────────────────────────────────────────────
  // focus + 카메라 권한 grant + hydrate 셋 다 만족된 시점에 1회 발화.
  // 권한 게이트가 가이드를 가로채는 race 방지 — 권한 prompt 가 보이는 동안에는
  // 가이드를 띄우지 않고 markSeen 도 안 한다.
  useEffect(() => {
    if (!isFocused) return;
    if (Platform.OS !== 'web' && !permission?.granted) return;
    if (!guideHydrated || !guideSeenRef.current) return;
    if (guideSeenRef.current.barcode) return;
    startBarcodeGuidePreview();
  }, [isFocused, permission?.granted, guideHydrated, startBarcodeGuidePreview]);

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
      setCameraError(null);
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
        stopBarcodeGuidePreview();
        stopOcrGuidePreview();
        processingRef.current = false;
      };
    }, [circleScale, sheetY, setHistory, startBarcodeGuidePreview, stopBarcodeGuidePreview, stopOcrGuidePreview, toggleSlide]),
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
    if (ocr) {
      stopBarcodeGuidePreview();
      if (guideSeenRef.current && !guideSeenRef.current.ocr) {
        startOcrGuidePreview();
      }
    } else {
      stopOcrGuidePreview();
      if (guideSeenRef.current && !guideSeenRef.current.barcode) {
        startBarcodeGuidePreview();
      }
    }

    setIsOCRMode(ocr);
    Animated.timing(toggleSlide, {
      toValue: ocr ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }

  // ── Overlay animation helpers ─────────────────────────────────────────────

  function showOverlay(product: Product, analysis: AnalysisResult, scanLogId?: string) {
    const currentFavs = useListStore.getState().favorites;
    setScanResult({ product, analysis, scanLogId });
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
    stopBarcodeGuidePreview();
    stopOcrGuidePreview();
    setBarcodeDetected(true);
    setProcessing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
            t('scanUi.productNotFound'),
            t('scanUi.scanLabelInstead'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('scanUi.scanLabel'), onPress: () => handleToggleMode(true) },
            ],
          );
        } else {
          Alert.alert(t('common.error'), err.message);
        }
      } else {
        Alert.alert(t('scanUi.connectionError'), t('scanUi.connectionMessage'));
      }
    }
  }

  async function processOCRPhoto(imageUri: string) {
    if (processingRef.current) return;
    processingRef.current = true;
    stopBarcodeGuidePreview();
    stopOcrGuidePreview();
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
        name: t('product.scannedProduct'),
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
      showOverlay(product, analysis, ocrResult.scanLogId);
    } catch (err) {
      processingRef.current = false;
      setProcessing(false);
      setScanPreviewUri(null);
      const isOcrFail = err instanceof ApiError && err.code === 'OCR_FAILED';
      Alert.alert(
        isOcrFail ? t('scanUi.recognitionFailed') : t('scanUi.analysisFailed'),
        isOcrFail
          ? t('scanUi.clearerPhoto')
          : t('scanUi.analyzeFailed'),
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
      if (isOCRMode) {
        startOcrGuidePreview();
      } else {
        startBarcodeGuidePreview();
      }
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
      if (showBarcodeGuidePreview) return;
      // URL 형태 QR 코드는 제품 바코드가 아님 (Expo 개발 QR 등)
      if (/^https?:\/\/|^exp:\/\//.test(result.data)) return;
      latestBarcodeRef.current = result.data;
      if (processingRef.current) return;
      processBarcode(result.data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showBarcodeGuidePreview],
  );

  // ── Manual camera button ──────────────────────────────────────────────────

  async function handleManualCapture() {
    if (showBarcodeGuidePreview) return;
    if (processingRef.current) return;

    if (isOCRMode) {
      if (!cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
          <Text style={styles.permTitle}>{t('scanUi.cameraPermission')}</Text>
          <Text style={styles.permDesc}>
            {t('scanUi.cameraDescBarcode')}
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>{t('scanUi.grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  const resultLevel = scanResult?.analysis.verdict;
  const verdictColor = resultLevel ? VERDICT_DISPLAY[resultLevel].color : GOOD_COLOR;
  const isSafe       = scanResult?.analysis.isSafe ?? true;
  // 스캔 후 fetch 중에는 색을 바꾸지 않는다(빨강 X). 결과가 나오면 verdictColor 적용.
  const cornerColor  = scanResult ? verdictColor : Colors.white;
  const isGuidePreviewVisible = showBarcodeGuidePreview || showOcrGuidePreview;

  return (
    <View style={styles.root}>
      {/* Full-screen camera — unmounted when screen is not focused */}
      {cameraActive && (
        <ScannerCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          active={!isOCRMode && !processingRef.current && !showBarcodeGuidePreview}
          barcodeTypes={BARCODE_TYPES}
          onBarcodeScanned={handleBarcodeScanned}
          onError={(reason, raw) => {
            const message = raw && typeof raw === 'object' && 'message' in raw
              ? String((raw as { message: unknown }).message)
              : reason;
            setCameraError(message);
          }}
        />
      )}
      {cameraError && !scanResult ? (
        <View style={styles.cameraErrorWrap} pointerEvents="none">
          <Text style={styles.cameraErrorTitle}>{t('common.error')}</Text>
          <Text style={styles.cameraErrorText}>{cameraError}</Text>
        </View>
      ) : null}
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
      {isGuidePreviewVisible && !scanResult && !processing ? null : isOCRMode ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <RoundedDimMask
            x={(SCREEN_W - OCR_GUIDE_W) / 2 + SCAN_GAP}
            y={ocrDimTop + SCAN_GAP}
            w={OCR_GUIDE_W - SCAN_GAP * 2}
            h={ocrGuideH - SCAN_GAP * 2}
            r={CORNER_RADIUS - SCAN_GAP}
          />
          <View
            style={{
              position: 'absolute',
              top: ocrDimTop,
              left: (SCREEN_W - OCR_GUIDE_W) / 2,
              width: OCR_GUIDE_W,
              height: ocrGuideH,
            }}
          >
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

      {showBarcodeGuidePreview && !isOCRMode && !scanResult && !processing ? (
        <BarcodeGuidePreview />
      ) : null}
      {showOcrGuidePreview && isOCRMode && !scanResult && !processing ? (
        <OcrGuidePreview />
      ) : null}

      {/* Header */}
      <ScanHeader
        insetTop={insets.top}
        onBack={handleBack}
        onHistory={() => navigation.navigate('ScanHistory')}
        historyImageUri={lastProductImage}
        toggleNode={!scanResult ? (
          <View style={styles.toggleRowInner}>
            <ModeToggle
              isOCRMode={isOCRMode}
              onToggle={handleToggleMode}
              slideAnim={toggleSlide}
            />
            <TouchableOpacity
              style={styles.guideHelpBtn}
              onPress={() => (isOCRMode ? startOcrGuidePreview() : startBarcodeGuidePreview())}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={styles.guideHelpText}>?</Text>
            </TouchableOpacity>
          </View>
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

      {/* 베타 v1 — 1탭 피드백 (OCR 결과에 scanLogId 있을 때만 자체 렌더) */}
      {scanResult?.scanLogId && (
        <View style={styles.feedbackAnchor} pointerEvents="box-none">
          <ScanFeedbackBar scanLogId={scanResult.scanLogId} />
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
          {/* Tappable content → 세부성분 화면. 하트·X 는 별도 터치로 영역 제외 */}
          <TouchableOpacity
            style={isSafe ? styles.goodProductRow : styles.riskProductRow}
            activeOpacity={0.85}
            onPress={handleSeeDetail}
          >
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
              <View style={styles.sheetNameRow}>
                <Text style={isSafe ? styles.goodProductName : styles.riskProductName} numberOfLines={1}>
                  {scanResult.product.name}
                </Text>
                <TouchableOpacity
                  style={styles.sheetHeartBtn}
                  onPress={handleFavorite}
                  disabled={favLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {favLoading ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Text style={[styles.sheetHeart, favorited && styles.sheetHeartActive]}>
                      {favorited ? '♥' : '♡'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={isSafe ? styles.goodProductBrand : styles.riskProductBrand} numberOfLines={1}>
                {scanResult.product.brand}
              </Text>

              <Text style={[isSafe ? styles.goodSeeDetailText : styles.riskSeeDetailText, styles.sheetSeeMore]}>
                {t('product.seeMoreDetail')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* X close — 동그라미 없는 쌩 X, 제품명과 동일 높이, 별도 터치 */}
          <TouchableOpacity
            style={isSafe ? styles.goodCardClose : styles.riskCardClose}
            onPress={dismissOverlay}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.sheetCloseText}>✕</Text>
          </TouchableOpacity>

          {!isSafe && (
            <RiskAlternatives productId={scanResult.product.id} />
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ── Rounded dim mask ──────────────────────────────────────────────────────────
// RN 사각 딤 4분할로는 clear 영역 모서리를 둥글릴 수 없다.
// 전체 화면 딤 + 둥근 사각형 투명 홀을 SVG 단일 Path(evenodd)로 처리한다.
function RoundedDimMask({
  x, y, w, h, r,
}: { x: number; y: number; w: number; h: number; r: number }) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const d =
    `M0 0 H${SCREEN_W} V${SCREEN_H} H0 Z ` +
    `M${x + rr} ${y} H${x + w - rr} ` +
    `A${rr} ${rr} 0 0 1 ${x + w} ${y + rr} V${y + h - rr} ` +
    `A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h} H${x + rr} ` +
    `A${rr} ${rr} 0 0 1 ${x} ${y + h - rr} V${y + rr} ` +
    `A${rr} ${rr} 0 0 1 ${x + rr} ${y} Z`;
  return (
    <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
      <Path d={d} fill="#000000" fillOpacity={0.7} fillRule="evenodd" />
    </Svg>
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
      <RoundedDimMask
        x={BARCODE_CLEAR_LEFT + SCAN_GAP}
        y={BARCODE_CLEAR_TOP + SCAN_GAP}
        w={BARCODE_CLEAR_W - SCAN_GAP * 2}
        h={BARCODE_CLEAR_H - SCAN_GAP * 2}
        r={CORNER_RADIUS - SCAN_GAP}
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

function BarcodeGuidePreview() {
  const { t } = useTranslation();

  return (
    <GuideIllustrationPreview
      label={t('scanUi.barcodeGuideInstruction')}
      variant="barcode"
    />
  );
}

function OcrGuidePreview() {
  const { t } = useTranslation();

  return (
    <GuideIllustrationPreview
      label={t('scanUi.ocrGuideInstruction')}
      variant="ocr"
    />
  );
}

function GuideIllustrationPreview({ label, variant }: { label: string; variant: 'barcode' | 'ocr' }) {
  return (
    <View style={styles.guidePreviewScreenLayer} pointerEvents="none">
      <Text style={styles.guidePreviewText}>
        {label}
      </Text>
      <View style={styles.guidePreviewIllustrationFrame}>
        {variant === 'barcode' ? <BarcodeGuideIllustration /> : <OcrGuideIllustration />}
      </View>
    </View>
  );
}

function GuidePhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <Svg width={GUIDE_ILLUSTRATION_W} height={GUIDE_ILLUSTRATION_H} viewBox="0 0 220 264" fill="none">
      <Path
        d="M89.693 1.27H178.71C187.666 1.27 194.926 8.53 194.926 17.485V211.417C194.926 220.373 187.666 227.633 178.71 227.633H89.693C80.737 227.633 73.477 220.372 73.477 211.417V17.485C73.477 8.53 80.737 1.27 89.693 1.27Z"
        stroke={Colors.scanLightGreen}
        strokeWidth={2.54}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M177.122 4.768H91.284C83.383 4.768 76.978 11.174 76.978 19.075V209.827C76.978 217.728 83.383 224.133 91.284 224.133H177.122C185.024 224.133 191.429 217.728 191.429 209.827V19.075C191.429 11.174 185.024 4.768 177.122 4.768Z"
        stroke={Colors.scanLightGreen}
        strokeWidth={1.59}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M70.618 46.099V58.816" stroke={Colors.scanLightGreen} strokeWidth={1.59} strokeLinecap="round" />
      <Path d="M70.618 68.353V84.249" stroke={Colors.scanLightGreen} strokeWidth={1.59} strokeLinecap="round" />
      <Path d="M70.618 90.608V106.504" stroke={Colors.scanLightGreen} strokeWidth={1.59} strokeLinecap="round" />
      <Path d="M197.787 61.995V90.607" stroke={Colors.scanLightGreen} strokeWidth={1.59} strokeLinecap="round" />
      <Circle cx={134.202} cy={193.614} r={10.323} fill={Colors.scanLightGreen} />
      <Path
        d="M125.271 193.604C125.271 198.526 129.272 202.528 134.195 202.528V197.031C132.375 197.031 130.897 195.553 130.897 193.734C130.897 191.914 132.375 190.436 134.195 190.436V184.68C129.272 184.68 125.271 188.682 125.271 193.604Z"
        fill={Colors.scanSelectedGreen}
      />
      <Path
        d="M134.946 191.555V195.907C136.147 195.907 137.124 194.931 137.124 193.729C137.124 192.528 136.147 191.551 134.946 191.551V191.555Z"
        fill={Colors.scanSelectedGreen}
      />
      <Path
        d="M0.393 263.625C0.393 263.625 10.682 244.951 9.919 222.093C9.156 199.235 4.586 182.087 20.585 153.501C36.584 124.915 26.681 125.301 40.022 112.732C53.363 100.163 42.689 78.652 57.547 76.452C72.406 74.253 81.168 102.443 67.45 127.977C53.732 153.51 59.828 166.259 62.88 169.976C65.933 173.693 73.169 187.034 71.643 209.515C70.116 231.996 100.982 229.706 112.034 229.706H172.079C178.974 229.706 185.833 228.602 192.307 226.232C201.742 222.775 212.794 216.069 215.326 203.302C218.531 187.142 196.715 184.565 196.203 201.623C196.203 201.623 195.206 217.891 209.446 212.9C209.446 212.9 211.986 211.786 212.678 210.61"
        stroke={Colors.scanLightGreen}
        strokeWidth={0.9}
        strokeMiterlimit={10}
      />
      <Path d="M137.397 263.625C137.397 263.625 162.742 245.903 169.942 229.716" stroke={Colors.scanLightGreen} strokeWidth={0.9} strokeMiterlimit={10} />
      {children}
    </Svg>
  );
}

function BarcodeGuideIllustration() {
  const barcodeLines = [110.157, 113.095, 116.277, 121.172, 124.355, 127.291, 132.677, 135.858, 139.041, 144.426, 147.852, 150.789, 155.44];

  return (
    <GuidePhoneFrame>
      <Path d="M101.591 88.347V82.227H107.71" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M159.113 82.227H165.232V88.347" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M101.591 129.957V136.077H107.71" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M159.113 136.077H165.232V129.957" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      {barcodeLines.map(x => (
        <Path key={x} d={`M${x} 95.689V122.615`} stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <Path
        d="M88.078 72.702C88.024 72.702 87.995 72.638 88.03 72.597L95.33 64.152C95.342 64.138 95.36 64.13 95.378 64.13H173.249C173.267 64.13 173.284 64.138 173.296 64.152L180.866 72.596C180.903 72.637 180.874 72.702 180.819 72.702H88.078Z"
        stroke={Colors.scanLightGreen}
        strokeWidth={0.63}
      />
      <Rect x={87.94} y={73.02} width={93.02} height={73.02} stroke={Colors.scanLightGreen} strokeWidth={0.63} />
    </GuidePhoneFrame>
  );
}

function OcrGuideIllustration() {
  const textLines = [76, 82, 88, 94, 100, 106, 112, 118, 124, 130, 136, 142];

  return (
    <GuidePhoneFrame>
      <Path
        d="M88.167 54.89C88.113 54.89 88.084 54.826 88.119 54.785L95.419 46.34C95.431 46.326 95.449 46.318 95.467 46.318H173.337C173.355 46.318 173.373 46.326 173.385 46.339L180.955 54.784C180.991 54.825 180.962 54.89 180.907 54.89H88.167Z"
        stroke={Colors.scanLightGreen}
        strokeWidth={0.63}
      />
      <Rect x={87.8} y={55.506} width={93.365} height={112.365} stroke={Colors.scanLightGreen} strokeWidth={0.63} />
      <Path d="M102.394 72.12V66.001H108.513" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M159.915 66.001H166.034V72.12" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M102.394 151.12V157.239H108.513" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M159.915 157.239H166.034V151.12" stroke={Colors.scanLightGreen} strokeWidth={1.22} strokeLinecap="round" strokeLinejoin="round" />
      {textLines.map((y, index) => (
        <Path
          key={y}
          d={`M106 ${y}H${index % 3 === 0 ? 162 : index % 3 === 1 ? 151 : 171}`}
          stroke={Colors.scanLightGreen}
          strokeWidth={1.08}
          strokeLinecap="round"
          opacity={index < 2 ? 0.86 : 0.62}
        />
      ))}
    </GuidePhoneFrame>
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
  const { t } = useTranslation();
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
        <Text style={[toggleStyles.tabText, !isOCRMode && toggleStyles.tabTextActive]}>{t('scanUi.barcode')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={toggleStyles.tab} onPress={() => onToggle(true)} activeOpacity={0.8}>
        <Text style={[toggleStyles.tabText, isOCRMode && toggleStyles.tabTextActive]}>{t('scanUi.ocr')}</Text>
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
  const { t } = useTranslation();
  const verdict = VERDICT_DISPLAY[level];
  const label = t(`scanUi.${level === 'safe' ? 'goodBang' : level === 'caution' ? 'poorBang' : 'badBang'}`);

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
        {label}
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
  const { t } = useTranslation();
  const verdict = VERDICT_DISPLAY[level];
  const label = t(`scanUi.${level === 'safe' ? 'goodBang' : level === 'caution' ? 'poorBang' : 'badBang'}`);

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
        {label}
      </Text>
    </Animated.View>
  );
}

// ── Risk result alternatives ──────────────────────────────────────────────────
function RiskAlternatives({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAlternatives(productId)
      .then(list => { if (alive) setAlternatives(list); })
      .catch(() => { if (alive) setAlternatives([]); }) // best-effort: 실패 시 빈 박스
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [productId]);

  const slots = [0, 1, 2];

  return (
    <View style={styles.riskAltSection}>
      <Text style={styles.riskAltTitle}>{t('product.alternativeProducts')}</Text>
      <View style={styles.riskAltRow}>
        {slots.map(index => {
          const alt = alternatives[index];
          return (
            <View key={alt?.id ?? `alt-${index}`} style={styles.riskAltThumb}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.scanResultClose} />
              ) : alt?.image ? (
                <Image
                  source={{ uri: alt.image }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : null}
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
  const { t } = useTranslation();
  return (
    <View>
      <View style={[headerStyles.wrap, { paddingTop: insetTop + 10 }]}>
        <TouchableOpacity
          style={headerStyles.iconBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        <View style={headerStyles.center}>
          <Text style={headerStyles.title}>{t('scanUi.title')}</Text>
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
          borderTopLeftRadius:     pos === 'topLeft'     ? CORNER_RADIUS : 0,
          borderTopRightRadius:    pos === 'topRight'    ? CORNER_RADIUS : 0,
          borderBottomLeftRadius:  pos === 'bottomLeft'  ? CORNER_RADIUS : 0,
          borderBottomRightRadius: pos === 'bottomRight' ? CORNER_RADIUS : 0,
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

// ── Back arrow (curved) ───────────────────────────────────────────────────────
function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5 L4 10 L9 15 M4 10 H13 C18 10 21 13 21 18"
        stroke={Colors.white}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
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

  resultBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  barcodeGuideLayer: {
    position: 'absolute',
    top: GUIDE_TOP,
    left: GUIDE_LEFT,
    width: GUIDE_W,
    height: GUIDE_H,
  },
  guidePreviewScreenLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  toggleRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideHelpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  guideHelpText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  guidePreviewText: {
    color: Colors.scanLightGreen,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
  },
  guidePreviewIllustrationFrame: {
    width: GUIDE_ILLUSTRATION_W,
    height: GUIDE_ILLUSTRATION_H,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -GUIDE_PHONE_CENTER_OFFSET_X }],
  },

  // Corner strokes
  corner: { position: 'absolute', width: CORNER_LEN, height: CORNER_H },

  // Spinner
  spinnerWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cameraErrorWrap: {
    position: 'absolute',
    top: GUIDE_TOP + GUIDE_H + 24,
    left: 28,
    right: 28,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.64)',
  },
  cameraErrorTitle: { color: Colors.white, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cameraErrorText: { color: Colors.gray300, fontSize: 12, lineHeight: 17, textAlign: 'center' },

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
  sheetCloseText: { color: Colors.scanResultClose, fontSize: 22, lineHeight: 24, fontWeight: '400' },
  sheetNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetHeartBtn:  { paddingVertical: 1, paddingHorizontal: 2 },
  sheetHeart:     { fontSize: 20, lineHeight: 22, color: Colors.black },
  sheetHeartActive:{ color: Colors.danger },
  sheetSeeMore:   { marginTop: 8 },
  feedbackAnchor: {
    position: 'absolute',
    // riskCard top edge (height 230 + bottom 22 = 252); 위 8px gap.
    // goodCard 일 때는 결과 카드보다 조금 더 높이 떠 있게 됨 — 의도된 동작.
    bottom: 294,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  goodCard: {
    position: 'absolute',
    left: 14,
    right: 15,
    bottom: 57,
    height: 130,
    backgroundColor: Colors.scanLightGreen,
    borderRadius: 20,
    overflow: 'hidden',
  },
  goodCardClose: {
    position: 'absolute',
    top: 25,
    right: 16,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  riskCard: {
    position: 'absolute',
    left: 13,
    right: 16,
    bottom: 56,
    height: 230,
    backgroundColor: Colors.scanLightGreen,
    borderRadius: 20,
    overflow: 'hidden',
  },
  riskCardClose: {
    position: 'absolute',
    top: 29,
    right: 16,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

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
    flexShrink: 1,
  },
  riskProductBrand: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: -2,
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
    flexShrink: 1,
  },
  goodProductBrand: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: -2,
  },
  goodSeeDetailText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});

const headerStyles = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 23, paddingBottom: 0 },
  iconBtn:    { width: 32, height: 42, alignItems: 'center', justifyContent: 'center' },
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

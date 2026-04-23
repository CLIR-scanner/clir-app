// TODO: Real API 연동 시 USE_MOCK 을 false 로 변경
import { Platform } from 'react-native';
import { Product, Ingredient, OCRResult, AnalysisResult, ScanHistory, RiskLevel } from '../types';
import { apiFetch, apiFormFetch } from '../lib/api';
import { ALLERGEN_NAME_MAP, makeRiskIngredient, makeMayContainIngredient } from '../constants/allergyData';

// ─── 내부 API 응답 타입 ───────────────────────────────────────────────────────

/** GET /products/:id/alternatives 응답의 product 요약 객체 */
interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  image?: string;
  isSafe: boolean;
}

/** GET /scan-history 응답의 product 요약 객체 */
interface ScanHistoryProductSummary {
  id: string;
  name: string;
  brand: string;
  image?: string;
  isSafe: boolean;
  /** 서버사이드 computeVerdict 결과 — riskLevel 정확도 향상 (safe/caution/danger 구분) */
  verdict?: RiskLevel;
  /** 현재 프로필과 매칭된 allergen ID 목록 — riskIngredients 구성용 */
  allergenIds?: string[];
  /** 현재 프로필과 매칭된 trace ID 목록 — mayContainIngredients 구성용 */
  traceIds?: string[];
}

interface ScanHistoryItem {
  id: string;
  productId?: string;
  product: ScanHistoryProductSummary | null; // POST 응답엔 없음, GET 응답엔 있음 (OCR 스캔 시 null 가능)
  result: RiskLevel;
  scannedAt: string;
}

// ALLERGEN_NAME_MAP, makeRiskIngredient, makeMayContainIngredient 는
// constants/allergyData.ts 에서 import (단일 출처 관리)

// productId 없는 OCR 이력의 폴백 객체.
// name/brand를 빈 문자열로 두면 화면에 그대로 렌더링되므로 표시용 placeholder를 사용.
const EMPTY_PRODUCT: Product = {
  id: '', name: 'OCR Scan', brand: '—', ingredients: [],
  isSafe: true, riskLevel: 'safe',
  riskIngredients: [], mayContainIngredients: [], alternatives: [],
};

/**
 * GET /products/:id/alternatives 응답 항목 → Product 변환.
 * 대체 제품은 안전한 제품만 반환되므로 allergenIds/traceIds 없이 변환해도 올바름.
 * (riskIngredients = [] — 안전 제품이므로 상세 화면에서 risk box가 표시되지 않음)
 */
function altSummaryToProduct(s: ProductSummary): Product {
  return {
    id: s.id,
    name: s.name,
    brand: s.brand,
    image: s.image,
    ingredients: [],
    isSafe: s.isSafe,
    riskLevel: s.isSafe ? 'safe' : 'danger',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  };
}

/** GET /scan-history 응답 product → Product 변환 (목록·상세 화면용) */
function summaryToProduct(s: ScanHistoryProductSummary): Product {
  const riskIngredients     = (s.allergenIds ?? []).map(makeRiskIngredient);
  const mayContainIngredients = (s.traceIds ?? []).map(makeMayContainIngredient);
  // verdict が 있으면 3단계(safe/caution/danger) 그대로 사용; 없으면 isSafe로 폴백
  const riskLevel: RiskLevel = s.verdict ?? (s.isSafe ? 'safe' : 'danger');
  return {
    id: s.id,
    name: s.name,
    brand: s.brand,
    image: s.image,
    ingredients: [],          // 전체 성분 텍스트는 별도 조회 없이는 불가
    isSafe: s.isSafe,
    riskLevel,
    riskIngredients,
    mayContainIngredients,
    alternatives: [],         // 상세 화면에서 getAlternatives()로 lazy-fetch
  };
}

// ─── 공개 API ─────────────────────────────────────────────────────────────────

const USE_MOCK = false; // 실제 API 연결 시 false 로 변경

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Bad 케이스 — 개발용 유저 프로필(알러지: 땅콩·유제품) 기준 danger 판정
const MOCK_PRODUCT_DANGER: Product = {
  id: 'mock-product-001',
  barcode: '4890008100309',
  name: 'Coca-Cola Original',
  brand: 'The Coca-Cola Company',
  image: undefined,
  ingredients: [
    { id: 'ing-caffeine',   name: 'Caffeine',                 nameKo: '카페인',     description: '', riskLevel: 'caution', sources: [] },
    { id: 'ing-water',      name: 'Carbonated Water',         nameKo: '탄산수',     description: '', riskLevel: 'safe',    sources: [] },
    { id: 'ing-flavors',    name: 'Natural Flavors',          nameKo: '천연향료',   description: '', riskLevel: 'safe',    sources: [] },
    { id: 'ing-hfcs',       name: 'High Fructose Corn Syrup', nameKo: '액상과당',   description: '', riskLevel: 'caution', sources: [] },
    { id: 'ing-phosphoric', name: 'Phosphoric Acid',          nameKo: '인산',       description: '', riskLevel: 'safe',    sources: [] },
    { id: 'ing-caramel',    name: 'Caramel Color',            nameKo: '카라멜색소', description: '', riskLevel: 'safe',    sources: [] },
    { id: 'ing-egg',       name: 'Eggs',                     nameKo: '달걀',       description: '', riskLevel: 'danger',  sources: [] },
    { id: 'ing-milk',       name: 'Milk',                     nameKo: '우유',       description: '', riskLevel: 'danger',  sources: [] },
    { id: 'ing-peanut',    name: 'Peanuts',                  nameKo: '땅콩',       description: '', riskLevel: 'danger',  sources: [] },
  ],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [
    { id: 'ing-egg',    name: 'Eggs',    nameKo: '달걀', description: '', riskLevel: 'danger', sources: [] },
    { id: 'ing-milk',    name: 'Milk',    nameKo: '우유', description: '', riskLevel: 'danger', sources: [] },
    { id: 'ing-peanut', name: 'Peanuts', nameKo: '땅콩', description: '', riskLevel: 'danger', sources: [] },
  ],
  mayContainIngredients: [],
  alternatives: [
    { id: 'mock-alt-001', name: 'Sprite Zero',    brand: 'The Coca-Cola Company', image: undefined, ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
    { id: 'mock-alt-002', name: 'Pepsi Max',       brand: 'PepsiCo',               image: undefined, ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
    { id: 'mock-alt-003', name: 'Sparkling Water', brand: 'Evian',                 image: undefined, ingredients: [], isSafe: true, riskLevel: 'safe', riskIngredients: [], mayContainIngredients: [], alternatives: [] },
  ],
  dataCompleteness: 'complete',
};

// Good 케이스 — 개발용 유저 프로필(알러지: 땅콩·유제품, 식이제한: vegan) 기준 safe 판정
const MOCK_PRODUCT_SAFE: Product = {
  id: 'mock-product-002',
  barcode: '0012345678901',
  name: 'Organic Green Tea',
  brand: 'Ito En',
  image: undefined,
  ingredients: [
    { id: 'ing-water',     name: 'Water',             nameKo: '물',         description: '', riskLevel: 'safe', sources: [] },
    { id: 'ing-green-tea', name: 'Green Tea Extract', nameKo: '녹차 추출물', description: '', riskLevel: 'safe', sources: [] },
    { id: 'ing-vitamin-c', name: 'Vitamin C',         nameKo: '비타민C',    description: '', riskLevel: 'safe', sources: [] },
  ],
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [],
  mayContainIngredients: [],
  alternatives: [],
  dataCompleteness: 'complete',
};

const MOCK_ANALYSIS_DANGER: AnalysisResult = {
  verdict: 'danger',
  isSafe: false,
  triggeredBy: [
    { id: 'ing-egg',    name: 'Eggs',    nameKo: '달걀', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
    { id: 'ing-milk',    name: 'Milk',    nameKo: '우유', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
    { id: 'ing-peanut', name: 'Peanuts', nameKo: '땅콩', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
  ],
  safeIngredients: [
    { id: 'ing-caffeine',   name: 'Caffeine',                 nameKo: '카페인'   },
    { id: 'ing-water',      name: 'Carbonated Water',         nameKo: '탄산수'   },
    { id: 'ing-flavors',    name: 'Natural Flavors',          nameKo: '천연향료' },
    { id: 'ing-hfcs',       name: 'High Fructose Corn Syrup', nameKo: '액상과당' },
    { id: 'ing-phosphoric', name: 'Phosphoric Acid',          nameKo: '인산'     },
    { id: 'ing-caramel',    name: 'Caramel Color',            nameKo: '카라멜색소'},
  ],
  dataCompleteness: 'complete',
};

const MOCK_ANALYSIS_SAFE: AnalysisResult = {
  verdict: 'safe',
  isSafe: true,
  triggeredBy: [],
  safeIngredients: [
    { id: 'ing-water',     name: 'Water',             nameKo: '물'         },
    { id: 'ing-green-tea', name: 'Green Tea Extract', nameKo: '녹차 추출물' },
    { id: 'ing-vitamin-c', name: 'Vitamin C',         nameKo: '비타민C'    },
  ],
  dataCompleteness: 'complete',
};

const MOCK_OCR: OCRResult = {
  extractedText: 'Ingredients: Caffeine, Carbonated Water, Natural Flavors, High Fructose Corn Syrup, Eggs, Milk, Peanuts',
  ingredients: [
    { id: 'ing-caffeine',   name: 'Caffeine',                 nameKo: '카페인'   },
    { id: 'ing-water',      name: 'Carbonated Water',         nameKo: '탄산수'   },
    { id: 'ing-flavors',    name: 'Natural Flavors',          nameKo: '천연향료' },
    { id: 'ing-hfcs',       name: 'High Fructose Corn Syrup', nameKo: '액상과당' },
    { id: 'ing-egg',       name: 'Eggs',                     nameKo: '달걀'     },
    { id: 'ing-milk',       name: 'Milk',                     nameKo: '우유'     },
    { id: 'ing-peanut',    name: 'Peanuts',                  nameKo: '땅콩'     },
  ],
};

// 연속 스캔 시 danger ↔ safe 교대 반환
let _mockToggle = false;

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /products/:barcode
 * 바코드로 제품 정보를 조회한다.
 * 자체 DB → Open Food Facts 순서로 조회한다.
 */
export async function scanBarcode(barcode: string): Promise<Product> {
  if (USE_MOCK) {
    _mockToggle = !_mockToggle;
    const base = _mockToggle ? MOCK_PRODUCT_DANGER : MOCK_PRODUCT_SAFE;
    return { ...base, barcode };
  }
  return apiFetch<Product>(`/products/${encodeURIComponent(barcode)}`);
}

/**
 * POST /ocr
 * 성분표 이미지 URI를 전달하면 OpenAI Vision API로 성분을 추출한다.
 */
export async function recognizeIngredients(imageUri: string): Promise<OCRResult> {
  if (USE_MOCK) {
    return MOCK_OCR;
  }
  const formData = new FormData();
  if (Platform.OS === 'web') {
    // 웹은 `{ uri, type, name }` RN 관용구를 문자열로 직렬화해버림.
    // data:/blob: URI를 실제 Blob으로 변환해 파일 필드로 넣는다.
    const res  = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('image', blob, 'image.jpg');
  } else {
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as unknown as Blob);
  }
  return apiFormFetch<OCRResult>('/ocr', formData);
}

/**
 * POST /analysis
 * 성분 ID 목록과 선택적 productId를 전달하면 사용자 프로필 기준 위험도를 판정한다.
 */
export async function analyzeProduct(params: {
  productId?: string;
  ingredientIds: string[];
}): Promise<AnalysisResult> {
  if (USE_MOCK) {
    const hasDanger = params.ingredientIds.some(id =>
      ['ing-egg', 'ing-milk', 'ing-peanut'].includes(id),
    );
    return hasDanger ? MOCK_ANALYSIS_DANGER : MOCK_ANALYSIS_SAFE;
  }
  return apiFetch<AnalysisResult>('/analysis', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * POST /scan-history
 * 분석 완료 후 스캔 이력을 서버에 저장한다.
 */
export async function saveScanHistory(params: {
  productId?: string;
  result: RiskLevel;
}): Promise<ScanHistory> {
  if (USE_MOCK) {
    const product = params.result === 'safe' ? MOCK_PRODUCT_SAFE : MOCK_PRODUCT_DANGER;
    return {
      id: `history-${Date.now()}`,
      productId: params.productId ?? product.id,
      userId: 'dev-user',
      scannedAt: new Date(),
      result: params.result,
      product,
    };
  }
  const res = await apiFetch<ScanHistoryItem>('/scan-history', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  // POST 응답에는 product 필드가 없음 — 호출 측에서 { ...item, product }로 덮어씀
  return {
    id: res.id,
    productId: res.productId ?? '',
    userId: '',
    scannedAt: new Date(res.scannedAt),
    result: res.result,
    product: res.product ? summaryToProduct(res.product) : EMPTY_PRODUCT,
  };
}

/**
 * GET /ingredients/:id
 * 성분 상세 정보(설명, 근거자료)를 반환한다.
 * 성분 탭 → 바텀시트 표시 용도.
 */
export async function getIngredient(id: string): Promise<Ingredient> {
  return apiFetch<Ingredient>(`/ingredients/${encodeURIComponent(id)}`);
}

/**
 * GET /products/by-id/:id
 * 제품 ID로 전체 상세 정보를 조회한다. 비-바코드 ID(UUID, seed-xxx, off-xxx, ocr-xxx) 지원.
 * 상세 화면에서 성분 정보 등 전체 데이터를 표시할 때 사용한다.
 * 응답은 이미 현재 프로필 기준 riskLevel, riskIngredients 가 주입된 상태.
 */
export async function getProductById(productId: string): Promise<Product> {
  if (USE_MOCK) {
    // Mock mode에서는 cache된 제품 반환
    return MOCK_PRODUCT_DANGER.id === productId ? MOCK_PRODUCT_DANGER : MOCK_PRODUCT_SAFE;
  }
  return apiFetch<Product>(`/products/by-id/${encodeURIComponent(productId)}`);
}

/**
 * GET /products/:id/alternatives
 * 현재 사용자 프로필 기준으로 안전한 대체 제품 목록을 반환한다.
 * danger / caution 판정 시 ScanResultScreen에서 자동 호출.
 */
export async function getAlternatives(productId: string): Promise<Product[]> {
  if (USE_MOCK) return [];
  const res = await apiFetch<{ alternatives: ProductSummary[] }>(
    `/products/${encodeURIComponent(productId)}/alternatives`,
  );
  return res.alternatives.map(altSummaryToProduct);
}

/**
 * GET /scan-history
 * 현재 사용자의 스캔 이력을 최신순으로 반환한다.
 */
export async function getScanHistory(): Promise<ScanHistory[]> {
  if (USE_MOCK) {
    return [
      { id: 'history-mock-001', productId: MOCK_PRODUCT_DANGER.id, userId: 'dev-user', scannedAt: new Date(), result: 'danger', product: MOCK_PRODUCT_DANGER },
      { id: 'history-mock-002', productId: MOCK_PRODUCT_SAFE.id,   userId: 'dev-user', scannedAt: new Date(), result: 'safe',   product: MOCK_PRODUCT_SAFE },
    ];
  }
  const res = await apiFetch<{ history: ScanHistoryItem[] }>('/scan-history');
  return res.history.map(item => ({
    id: item.id,
    productId: item.productId ?? '',
    userId: '',
    scannedAt: new Date(item.scannedAt),
    result: item.result,
    // OCR 스캔 등 productId 없는 이력은 product가 null — result 기반으로 riskLevel 복원
    product: item.product
      ? summaryToProduct(item.product)
      : { ...EMPTY_PRODUCT, isSafe: item.result === 'safe', riskLevel: item.result },
  }));
}

// TODO: Real API 연동 시 USE_MOCK 을 false 로 변경
import { Product, OCRResult, AnalysisResult, ScanHistory, RiskLevel } from '../types';
import { apiFetch, apiFormFetch } from '../lib/api';

// ─── 내부 API 응답 타입 ───────────────────────────────────────────────────────

interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  image?: string;
  isSafe: boolean;
}

interface ScanHistoryItem {
  id: string;
  productId?: string;
  product: ProductSummary;
  result: RiskLevel;
  scannedAt: string;
}

/** ProductSummary → Product (목록용 — ingredients 빈 배열) */
function summaryToProduct(s: ProductSummary): Product {
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

// ─── 공개 API ─────────────────────────────────────────────────────────────────

const USE_MOCK = true; // 실제 API 연결 시 false 로 변경

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
    { id: 'ing-eggs',       name: 'Eggs',                     nameKo: '달걀',       description: '', riskLevel: 'danger',  sources: [] },
    { id: 'ing-milk',       name: 'Milk',                     nameKo: '우유',       description: '', riskLevel: 'danger',  sources: [] },
    { id: 'ing-peanuts',    name: 'Peanuts',                  nameKo: '땅콩',       description: '', riskLevel: 'danger',  sources: [] },
  ],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [
    { id: 'ing-eggs',    name: 'Eggs',    nameKo: '달걀', description: '', riskLevel: 'danger', sources: [] },
    { id: 'ing-milk',    name: 'Milk',    nameKo: '우유', description: '', riskLevel: 'danger', sources: [] },
    { id: 'ing-peanuts', name: 'Peanuts', nameKo: '땅콩', description: '', riskLevel: 'danger', sources: [] },
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
    { id: 'ing-eggs',    name: 'Eggs',    nameKo: '달걀', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
    { id: 'ing-milk',    name: 'Milk',    nameKo: '우유', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
    { id: 'ing-peanuts', name: 'Peanuts', nameKo: '땅콩', reason: '알러지 프로필에 등록된 성분입니다.', riskLevel: 'danger' },
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
    { id: 'ing-eggs',       name: 'Eggs',                     nameKo: '달걀'     },
    { id: 'ing-milk',       name: 'Milk',                     nameKo: '우유'     },
    { id: 'ing-peanuts',    name: 'Peanuts',                  nameKo: '땅콩'     },
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
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'image.jpg',
  } as unknown as Blob);
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
      ['ing-eggs', 'ing-milk', 'ing-peanuts'].includes(id),
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
  return {
    id: res.id,
    productId: res.productId ?? '',
    userId: '',
    scannedAt: new Date(res.scannedAt),
    result: res.result,
    product: summaryToProduct(res.product),
  };
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
    product: summaryToProduct(item.product),
  }));
}

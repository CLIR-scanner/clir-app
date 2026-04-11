// TODO: Real API 연동 시 이 파일의 구현부만 교체
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

/**
 * GET /products/:barcode
 * 바코드로 제품 정보를 조회한다.
 * 자체 DB → Open Food Facts 순서로 조회한다.
 */
export async function scanBarcode(barcode: string): Promise<Product> {
  return apiFetch<Product>(`/products/${encodeURIComponent(barcode)}`);
}

/**
 * POST /ocr
 * 성분표 이미지 URI를 전달하면 OpenAI Vision API로 성분을 추출한다.
 */
export async function recognizeIngredients(imageUri: string): Promise<OCRResult> {
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

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product, OCRResult, AnalysisResult, ScanHistory, RiskLevel } from '../types';

/**
 * GET /products/:barcode
 * 바코드로 제품 정보를 조회한다.
 * 자체 DB → Open Food Facts 순서로 조회한다.
 */
export async function scanBarcode(barcode: string): Promise<Product> {
  throw new Error('Not implemented');
}

/**
 * POST /ocr
 * 성분표 이미지 URI를 전달하면 OpenAI Vision API로 성분을 추출한다.
 */
export async function recognizeIngredients(imageUri: string): Promise<OCRResult> {
  throw new Error('Not implemented');
}

/**
 * POST /analysis
 * 성분 ID 목록과 선택적 productId를 전달하면 사용자 프로필 기준 위험도를 판정한다.
 */
export async function analyzeProduct(params: {
  productId?: string;
  ingredientIds: string[];
}): Promise<AnalysisResult> {
  throw new Error('Not implemented');
}

/**
 * POST /scan-history
 * 분석 완료 후 스캔 이력을 서버에 저장한다.
 */
export async function saveScanHistory(params: {
  productId?: string;
  result: RiskLevel;
}): Promise<ScanHistory> {
  throw new Error('Not implemented');
}

/**
 * GET /scan-history
 * 현재 사용자의 스캔 이력을 최신순으로 반환한다.
 */
export async function getScanHistory(): Promise<ScanHistory[]> {
  throw new Error('Not implemented');
}

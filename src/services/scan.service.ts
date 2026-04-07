// TODO: Real API 연동 시 이 파일의 구현부만 교체
// 함수 시그니처(인터페이스)는 변경하지 않음

import { Ingredient, OCRResult, Product, RiskLevel } from '../types';
import { mockProducts, mockProductMap } from '../mocks/product.mock';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

// ─── Error Types ─────────────────────────────────────────────────────────────

/** 바코드 DB에 제품이 없을 때 throw — OCR 폴백 진입 판단에 사용 */
export class ProductNotFoundError extends Error {
  readonly barcode: string;
  constructor(barcode: string) {
    super(`제품을 찾을 수 없습니다: ${barcode}`);
    this.name = 'ProductNotFoundError';
    this.barcode = barcode;
  }
}

const ALLERGEN_NAME_KO: Record<string, string> = {
  'ing-milk': '우유',
  'ing-egg': '달걀',
  'ing-peanut': '땅콩',
  'ing-treenut': '견과류',
  'ing-wheat': '밀',
  'ing-soy': '대두',
  'ing-shellfish': '갑각류',
  'ing-fish': '생선',
  'ing-sesame': '참깨',
  'ing-oat': '귀리',
};

// ─── OCR ingredient → allergen ID 매핑 ────────────────────────────────────────

/** OCR 추출 영어 성분명 → 알러젠 ID (부분 매칭, case-insensitive) */
const OCR_KEYWORD_TO_ALLERGEN: Array<[string, string]> = [
  // Wheat / Gluten
  // NOTE: 'flour' 단독은 rice flour / corn flour 등 비소맥 제품도 매칭해 false positive 발생.
  //       'wheat flour'로 제한. 'wheat' 단독 엔트리가 대부분을 커버하므로 커버리지 손실 최소.
  ['wheat', 'ing-wheat'],
  ['gluten', 'ing-wheat'],
  ['wheat flour', 'ing-wheat'],
  ['barley', 'ing-wheat'],
  ['rye', 'ing-wheat'],
  // Milk / Dairy
  ['milk', 'ing-milk'],
  ['dairy', 'ing-milk'],
  ['butter', 'ing-milk'],
  ['cheese', 'ing-milk'],
  ['cream', 'ing-milk'],
  ['whey', 'ing-milk'],
  ['casein', 'ing-milk'],
  ['lactose', 'ing-milk'],
  // Egg
  ['egg', 'ing-egg'],
  ['albumin', 'ing-egg'],
  ['mayonnaise', 'ing-egg'],
  // Peanut
  ['peanut', 'ing-peanut'],
  ['groundnut', 'ing-peanut'],
  // Tree Nut
  ['almond', 'ing-treenut'],
  ['walnut', 'ing-treenut'],
  ['cashew', 'ing-treenut'],
  ['pecan', 'ing-treenut'],
  ['pistachio', 'ing-treenut'],
  ['hazelnut', 'ing-treenut'],
  ['macadamia', 'ing-treenut'],
  ['tree nut', 'ing-treenut'],
  // Soy
  ['soy', 'ing-soy'],
  ['soya', 'ing-soy'],
  ['tofu', 'ing-soy'],
  ['edamame', 'ing-soy'],
  ['soy lecithin', 'ing-soy'],  // 'lecithin' 단독은 sunflower lecithin 등 false positive 유발
                                // ※ extractAllergensFromOCR에서는 'soy'가 선행 매칭하므로 실질 중복 엔트리.
                                //   그러나 'soy' 없이 'soy lecithin'만 표기된 성분표 대응 목적으로 유지.
  // Shellfish
  ['shrimp', 'ing-shellfish'],
  ['crab', 'ing-shellfish'],
  ['lobster', 'ing-shellfish'],
  ['shellfish', 'ing-shellfish'],
  // Fish
  ['fish', 'ing-fish'],
  ['salmon', 'ing-fish'],
  ['tuna', 'ing-fish'],
  ['cod', 'ing-fish'],
  ['tilapia', 'ing-fish'],
  ['anchovy', 'ing-fish'],
  // Sesame
  ['sesame', 'ing-sesame'],
  ['tahini', 'ing-sesame'],
  // Oat (ing-oat — ALLERGEN_OPTIONS에 등록된 알러겐)
  ['oat', 'ing-oat'],
  ['oats', 'ing-oat'],
  ['oatmeal', 'ing-oat'],
];

/** OCR 성분명 목록에서 allergen ID를 추출한다 (case-insensitive) */
export function extractAllergensFromOCR(ingredients: string[]): string[] {
  const found = new Set<string>();
  for (const ing of ingredients) {
    const lower = ing.toLowerCase();
    for (const [keyword, allergenId] of OCR_KEYWORD_TO_ALLERGEN) {
      if (lower.includes(keyword)) {
        found.add(allergenId);
      }
    }
  }
  return [...found];
}

/**
 * 주어진 allergyProfile 기준으로 제품의 위험도 필드를 재계산한다.
 * mock의 정적 riskLevel 대신 실제 프로필에 맞는 판정을 반환한다.
 */
function analyzeProductForProfile(baseProduct: Product, allergyProfile: string[]): Product {
  if (allergyProfile.length === 0) {
    return { ...baseProduct, riskIngredients: [], mayContainIngredients: [], riskLevel: 'safe', isSafe: true };
  }

  const mayContainIds = new Set(baseProduct.mayContainIngredients.map(i => i.id));

  // 직접 포함된 알러겐
  const riskIngredients = baseProduct.ingredients.filter(
    i => !mayContainIds.has(i.id) && allergyProfile.includes(i.id)
  );

  // may-contain 중 프로필과 연관된 것 (직접 ID 또는 relatedAllergenId 경유)
  const relevantMayContain = baseProduct.mayContainIngredients.filter(
    i =>
      allergyProfile.includes(i.id) ||
      (i.relatedAllergenId !== undefined && allergyProfile.includes(i.relatedAllergenId))
  );

  let riskLevel: RiskLevel;
  if (riskIngredients.length > 0) {
    riskLevel = 'danger';
  } else if (relevantMayContain.length > 0) {
    riskLevel = 'caution';
  } else {
    riskLevel = 'safe';
  }

  return {
    ...baseProduct,
    riskIngredients,
    mayContainIngredients: relevantMayContain,
    riskLevel,
    isSafe: riskLevel === 'safe',
  };
}

export async function scanBarcode(barcode: string, allergyProfile: string[] = []): Promise<Product> {
  // API 서버 연동 시
  if (API_BASE) {
    const res = await fetch(`${API_BASE}/products/${barcode}`);
    if (res.status === 404) throw new ProductNotFoundError(barcode);
    if (!res.ok) throw new Error('서버 오류');
    const data = await res.json() as Product;
    // FAIL 4 guard: 최소 shape 검증 — ingredients 미존재 시 런타임 TypeError 방지
    if (!Array.isArray(data.ingredients)) throw new Error('잘못된 서버 응답 형식');
    return analyzeProductForProfile(data, allergyProfile);
  }

  // 로컬 개발 fallback: mock → OFF 직접 호출
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800));

  const mockProduct = mockProducts.find(p => p.barcode === barcode);
  if (mockProduct) {
    return analyzeProductForProfile({ ...mockProduct, dataCompleteness: 'complete' }, allergyProfile);
  }

  throw new ProductNotFoundError(barcode);
}

export async function recognizeIngredients(imageUri: string): Promise<OCRResult> {
  // API 서버 연동 시
  if (API_BASE) {
    const formData = new FormData();
    // FAIL 5 note: RN의 fetch FormData는 { uri, type, name } 객체를 multipart로 처리 (웹 Blob과 다름)
    formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'label.jpg' } as unknown as Blob);
    const res = await fetch(`${API_BASE}/ocr`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('OCR 서버 오류');
    return res.json() as Promise<OCRResult>;
  }

  // 로컬 개발 fallback: mock 반환
  await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
  return {
    rawText: 'Ingredients: Enriched Flour (Wheat), Sugar, Palm Oil, Salt, Soy Lecithin, Natural Flavor',
    parsedIngredients: ['Enriched Flour', 'Wheat', 'Sugar', 'Palm Oil', 'Salt', 'Soy Lecithin', 'Natural Flavor'],
    confidence: 0.91,
  };
}

export async function getProductById(productId: string, allergyProfile: string[] = []): Promise<Product> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
  const product = mockProductMap[productId];
  if (!product) {
    throw new Error(`제품을 찾을 수 없습니다: ${productId}`);
  }
  return analyzeProductForProfile(product, allergyProfile);
}

export async function getDemoProducts(allergyProfile: string[] = []): Promise<Product[]> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
  return mockProducts.map(p => analyzeProductForProfile(p, allergyProfile));
}

export async function getSimilarSafeProducts(productId: string, allergyProfile: string[] = []): Promise<Product[]> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
  const product = mockProductMap[productId];
  return (product?.alternatives ?? [])
    .map(p => analyzeProductForProfile(p, allergyProfile))
    .filter(p => p.riskLevel === 'safe');
}

/**
 * OCR 분석 결과로부터 임시 Product 객체를 생성한다.
 * Product 조립 로직을 화면에서 분리해 서비스 레이어에서 담당.
 */
export function buildProductFromOCR(
  ocrResult: OCRResult,
  barcode: string | undefined,
  allergyProfile: string[],
): Product {
  // extractAllergensFromOCR가 실제로 매칭한 원본 성분명 Set
  // → generalIngredients 필터에서 정확히 매칭된 것만 제외 (키워드 전체 목록 기반보다 정확)
  const allergenTriggeredNames = new Set(
    ocrResult.parsedIngredients.filter(name => {
      const lower = name.toLowerCase();
      return OCR_KEYWORD_TO_ALLERGEN.some(([k]) => lower.includes(k));
    })
  );

  // 알러겐 키워드를 포함하는 성분명은 allergenIngredients로 별도 처리
  // (generalIngredients와 중복 방지 — 같은 성분이 'safe'/'danger' 양쪽에 나타나지 않도록)
  const foundAllergenIds = extractAllergensFromOCR(ocrResult.parsedIngredients);
  const allergenIngredients: Ingredient[] = foundAllergenIds.map(id => ({
    id,
    name: id,                          // allergen ID를 name으로 — 나머지 mock과 동일 관례
    nameKo: ALLERGEN_NAME_KO[id] ?? id,
    description: '',
    riskLevel: 'danger' as RiskLevel,
    sources: [],
  }));

  const generalIngredients: Ingredient[] = ocrResult.parsedIngredients
    .filter(name => !allergenTriggeredNames.has(name))
    .map((name, idx) => ({
      id: `ocr-${idx}`,
      name,
      nameKo: name,
      description: '',
      riskLevel: 'safe' as RiskLevel,
      sources: [],
    }));

  // base product: riskIngredients에 모든 발견된 알러겐 포함 (프로필 필터링 전)
  // analyzeProductForProfile에 위임해 실제 위험도 판정 — scanBarcode 경로와 동일한 판정 로직 사용
  const baseProduct: Product = {
    id: `ocr-${barcode ?? Date.now()}`,
    barcode,
    name: barcode ? `Barcode: ${barcode}` : 'OCR Scanned Product',
    brand: 'OCR Scan',
    ingredients: [...generalIngredients, ...allergenIngredients],
    isSafe: true,
    riskLevel: 'safe',
    riskIngredients: allergenIngredients,
    mayContainIngredients: [],
    alternatives: [],
    dataCompleteness: 'not_found',
  };

  return analyzeProductForProfile(baseProduct, allergyProfile);
}

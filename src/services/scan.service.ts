// TODO: Real API 연동 시 이 파일의 구현부만 교체
// 함수 시그니처(인터페이스)는 변경하지 않음

import { Product, RiskLevel } from '../types';
import { mockProducts, mockProductMap } from '../mocks/product.mock';

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
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
  const product = mockProducts.find(p => p.barcode === barcode);
  if (!product) {
    throw new Error(`제품을 찾을 수 없습니다: ${barcode}`);
  }
  return analyzeProductForProfile(product, allergyProfile);
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
  return (product?.alternatives ?? []).map(p => analyzeProductForProfile(p, allergyProfile));
}

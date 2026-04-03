// TODO: Real API 연동 시 이 파일의 구현부만 교체하면 됨
// 함수 시그니처(인터페이스)는 변경하지 않음

import {Product} from '../types';
import {mockProducts, mockProductMap} from '../mocks/product.mock';

export async function scanBarcode(barcode: string): Promise<Product> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800)); // 스캔 딜레이 시뮬레이션
  const product = mockProducts.find(p => p.barcode === barcode);
  if (!product) {
    throw new Error(`제품을 찾을 수 없습니다: ${barcode}`);
  }
  return product;
}

export async function getProductById(productId: string): Promise<Product> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
  const product = mockProductMap[productId];
  if (!product) {
    throw new Error(`제품을 찾을 수 없습니다: ${productId}`);
  }
  return product;
}

export async function getDemoProducts(): Promise<Product[]> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
  return mockProducts;
}

export async function getSimilarSafeProducts(productId: string): Promise<Product[]> {
  await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
  const product = mockProductMap[productId];
  return product?.alternatives ?? [];
}

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../mocks/search.mock';

/**
 * 검색어로 제품 목록을 반환한다.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  await new Promise(r => setTimeout(r, 300)); // 네트워크 지연 시뮬레이션
  return MOCK_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
  );
}

/**
 * 전체 제품 목록 반환 (검색 전 그리드 표시용).
 */
export async function getAllProducts(): Promise<Product[]> {
  return [...MOCK_PRODUCTS];
}

/**
 * 자동완성 제안 목록 (제품명만 반환).
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MOCK_PRODUCTS
    .filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .map(p => p.name)
    .slice(0, 6);
}

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product } from '../types';

/**
 * 검색어로 제품 목록을 반환한다.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  throw new Error('Not implemented');
}

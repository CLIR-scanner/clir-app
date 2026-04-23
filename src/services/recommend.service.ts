// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product } from '../types';

/**
 * /recommend/weekend — 주말 인기 제품 목록을 반환한다.
 */
export async function getWeekendPopular(): Promise<Product[]> {
  throw new Error('Not implemented');
}

/**
 * /recommend/similar-users — 유사 프로필 사용자들의 이번 주 즐겨찾기를 반환한다.
 */
export async function getSimilarUsersFavorites(): Promise<Product[]> {
  throw new Error('Not implemented');
}

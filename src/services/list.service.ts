// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { FavoriteItem, ShoppingItem } from '../types';

/**
 * GET /favorites
 * 현재 사용자의 즐겨찾기 목록을 최신순으로 반환한다.
 */
export async function getFavorites(): Promise<FavoriteItem[]> {
  throw new Error('Not implemented');
}

/**
 * POST /favorites
 * 제품을 즐겨찾기에 추가한다.
 */
export async function addFavorite(productId: string): Promise<FavoriteItem> {
  throw new Error('Not implemented');
}

/**
 * DELETE /favorites/:id
 * 즐겨찾기에서 항목을 삭제한다.
 */
export async function removeFavorite(favoriteId: string): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * 장보기 목록을 반환한다.
 */
export async function getShoppingItems(): Promise<ShoppingItem[]> {
  throw new Error('Not implemented');
}

/**
 * 장보기 목록에 제품을 추가한다.
 */
export async function addShoppingItem(productId: string): Promise<ShoppingItem> {
  throw new Error('Not implemented');
}

/**
 * 장보기 목록에서 항목을 삭제한다.
 */
export async function removeShoppingItem(itemId: string): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * 장보기 항목의 구매 완료 상태를 토글한다.
 */
export async function toggleShoppingItemPurchased(itemId: string): Promise<void> {
  throw new Error('Not implemented');
}

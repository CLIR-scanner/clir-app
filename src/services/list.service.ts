// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { FavoriteItem, ShoppingItem } from '../types';
import { apiFetch } from '../lib/api';

// ─── 내부 API 응답 타입 ───────────────────────────────────────────────────────

interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  image?: string;
  isSafe: boolean;
}

interface FavoriteApiItem {
  id: string;
  product: ProductSummary;
  addedAt: string;
}

function toFavoriteItem(raw: FavoriteApiItem): FavoriteItem {
  return {
    id: raw.id,
    productId: raw.product.id,
    userId: '',
    addedAt: new Date(raw.addedAt),
    product: {
      id: raw.product.id,
      name: raw.product.name,
      brand: raw.product.brand,
      image: raw.product.image,
      ingredients: [],
      isSafe: raw.product.isSafe,
      riskLevel: raw.product.isSafe ? 'safe' : 'danger',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  };
}

// ─── 즐겨찾기 ─────────────────────────────────────────────────────────────────

/**
 * GET /favorites
 * 현재 사용자의 즐겨찾기 목록을 최신순으로 반환한다.
 */
export async function getFavorites(): Promise<FavoriteItem[]> {
  const res = await apiFetch<{ favorites: FavoriteApiItem[] }>('/favorites');
  return res.favorites.map(toFavoriteItem);
}

/**
 * POST /favorites
 * 제품을 즐겨찾기에 추가한다.
 */
export async function addFavorite(productId: string): Promise<FavoriteItem> {
  const raw = await apiFetch<FavoriteApiItem>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  return toFavoriteItem(raw);
}

/**
 * DELETE /favorites/:id
 * 즐겨찾기에서 항목을 삭제한다.
 */
export async function removeFavorite(favoriteId: string): Promise<void> {
  await apiFetch<void>(`/favorites/${encodeURIComponent(favoriteId)}`, {
    method: 'DELETE',
  });
}

// ─── 장보기 목록 (미구현 — API 스펙 외) ──────────────────────────────────────

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  return [];
}

export async function addShoppingItem(_productId: string): Promise<ShoppingItem> {
  throw new Error('장보기 목록 API가 구현되지 않았습니다.');
}

export async function removeShoppingItem(_itemId: string): Promise<void> {
  // no-op
}

export async function toggleShoppingItemPurchased(_itemId: string): Promise<void> {
  // no-op
}

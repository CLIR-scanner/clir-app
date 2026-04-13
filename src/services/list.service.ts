// TODO: Real API 연동 시 USE_MOCK 을 false 로 변경
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

/** GET /favorites 응답 항목 — product가 null일 수 있음 (DB join 실패 시) */
interface FavoriteApiItem {
  id: string;
  product: ProductSummary | null;
  addedAt: string;
}

/** POST /favorites 응답 — product 객체 없이 productId만 반환 */
interface FavoritePostResponse {
  id: string;
  productId: string;
  addedAt: string;
}

function toFavoriteItem(raw: FavoriteApiItem): FavoriteItem | null {
  if (!raw.product) return null;
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

function postResponseToFavoriteItem(raw: FavoritePostResponse): FavoriteItem {
  return {
    id: raw.id,
    productId: raw.productId,
    userId: '',
    addedAt: new Date(raw.addedAt),
    product: {
      id: raw.productId,
      name: '',
      brand: '',
      ingredients: [],
      isSafe: true,
      riskLevel: 'safe',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  };
}

// ─── 즐겨찾기 ─────────────────────────────────────────────────────────────────

const USE_MOCK = false; // 실제 API 연결 시 false 로 변경

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FAVORITES: FavoriteItem[] = [
  {
    id: 'fav-001',
    productId: 'prod-002',
    userId: 'dev-user',
    memo: '',
    addedAt: new Date('2026-04-10T10:00:00Z'),
    product: {
      id: 'prod-002',
      name: 'Pure Sparkling Water',
      brand: 'Evian',
      image: undefined,
      ingredients: [],
      isSafe: true,
      riskLevel: 'safe',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  },
  {
    id: 'fav-002',
    productId: 'prod-003',
    userId: 'dev-user',
    memo: '',
    addedAt: new Date('2026-04-09T14:30:00Z'),
    product: {
      id: 'prod-003',
      name: "Reese's Peanut Butter Cups",
      brand: "Hershey's",
      image: undefined,
      ingredients: [],
      isSafe: false,
      riskLevel: 'caution',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  },
  {
    id: 'fav-003',
    productId: 'prod-004',
    userId: 'dev-user',
    memo: '',
    addedAt: new Date('2026-04-08T09:15:00Z'),
    product: {
      id: 'prod-004',
      name: 'Nature Valley Granola Bar',
      brand: 'General Mills',
      image: undefined,
      ingredients: [],
      isSafe: true,
      riskLevel: 'safe',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  },
  {
    id: 'fav-004',
    productId: 'prod-005',
    userId: 'dev-user',
    memo: '',
    addedAt: new Date('2026-04-07T11:20:00Z'),
    product: {
      id: 'prod-005',
      name: "Lay's Classic Chips",
      brand: 'Frito-Lay',
      image: undefined,
      ingredients: [],
      isSafe: true,
      riskLevel: 'safe',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  },
  {
    id: 'fav-005',
    productId: 'prod-001',
    userId: 'dev-user',
    memo: '',
    addedAt: new Date('2026-04-06T16:45:00Z'),
    product: {
      id: 'prod-001',
      name: 'Coca-Cola Original',
      brand: 'The Coca-Cola Company',
      image: undefined,
      ingredients: [],
      isSafe: false,
      riskLevel: 'danger',
      riskIngredients: [],
      mayContainIngredients: [],
      alternatives: [],
    },
  },
];

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /favorites
 * 현재 사용자의 즐겨찾기 목록을 최신순으로 반환한다.
 */
export async function getFavorites(): Promise<FavoriteItem[]> {
  if (USE_MOCK) {
    return [...MOCK_FAVORITES];
  }
  const res = await apiFetch<{ favorites: FavoriteApiItem[] }>('/favorites');
  return res.favorites.map(toFavoriteItem).filter((f): f is FavoriteItem => f !== null);
}

/**
 * POST /favorites
 * 제품을 즐겨찾기에 추가한다.
 */
export async function addFavorite(productId: string): Promise<FavoriteItem> {
  if (USE_MOCK) {
    const existing = MOCK_FAVORITES.find(f => f.productId === productId);
    if (existing) return existing;
    throw new Error('Product not found in mock');
  }
  const raw = await apiFetch<FavoritePostResponse>('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
  return postResponseToFavoriteItem(raw);
}

/**
 * DELETE /favorites/:id
 * 즐겨찾기에서 항목을 삭제한다.
 */
export async function removeFavorite(favoriteId: string): Promise<void> {
  if (USE_MOCK) return;
  await apiFetch<void>(`/favorites/${encodeURIComponent(favoriteId)}`, {
    method: 'DELETE',
  });
}

// ─── 장보기 목록 (미구현 — API 스펙 외) ──────────────────────────────────────

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  if (USE_MOCK) return [];
  return [];
}

export async function addShoppingItem(_productId: string): Promise<ShoppingItem> {
  throw new Error('장보기 목록 API가 구현되지 않았습니다.');
}

/**
 * 장보기 목록에서 항목을 삭제한다.
 */
export async function removeShoppingItem(_itemId: string): Promise<void> {
  if (USE_MOCK) return;
  // no-op
}

/**
 * 장보기 항목의 구매 완료 상태를 토글한다.
 */
export async function toggleShoppingItemPurchased(_itemId: string): Promise<void> {
  if (USE_MOCK) return;
  // no-op
}

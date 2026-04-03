// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { FavoriteItem, ShoppingItem } from '../types';
import { mockProductMap } from '../mocks/product.mock';

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  return [];
}

export async function addFavorite(userId: string, productId: string, memo: string): Promise<FavoriteItem> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
  const product = mockProductMap[productId];
  if (!product) throw new Error(`제품을 찾을 수 없습니다: ${productId}`);
  return {
    id: `fav-${Date.now()}`,
    productId,
    userId,
    memo,
    addedAt: new Date(),
    product,
  };
}

export async function removeFavorite(userId: string, favoriteId: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

export async function getShoppingItems(userId: string): Promise<ShoppingItem[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  return [];
}

export async function addShoppingItem(userId: string, productId: string): Promise<ShoppingItem> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
  const product = mockProductMap[productId];
  if (!product) throw new Error(`제품을 찾을 수 없습니다: ${productId}`);
  return {
    id: `shop-${Date.now()}`,
    productId,
    userId,
    isPurchased: false,
    addedAt: new Date(),
    product,
  };
}

export async function removeShoppingItem(userId: string, shoppingItemId: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

export async function toggleShoppingItemPurchased(
  userId: string,
  shoppingItemId: string
): Promise<ShoppingItem> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  // Mock: shoppingItemId 기반으로 제품을 결정적으로 선택 (Real API 연동 시 서버가 현재 상태를 반환)
  const productIds = Object.keys(mockProductMap);
  const hash = shoppingItemId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const productId = productIds[hash % productIds.length];
  const product = mockProductMap[productId];
  if (!product) throw new Error(`제품을 찾을 수 없습니다: ${productId}`);
  return {
    id: shoppingItemId,
    productId,
    userId,
    isPurchased: true,
    addedAt: new Date(),
    product,
  };
}

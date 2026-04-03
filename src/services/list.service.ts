// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { FavoriteItem, ShoppingItem } from '../types';

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  return [];
}

export async function addFavorite(userId: string, productId: string, memo: string): Promise<FavoriteItem> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
  throw new Error('Not implemented in mock');
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
  throw new Error('Not implemented in mock');
}

export async function removeShoppingItem(userId: string, shoppingItemId: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

export async function toggleShoppingItemPurchased(
  userId: string,
  shoppingItemId: string
): Promise<ShoppingItem> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  throw new Error('Not implemented in mock');
}

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { create } from 'zustand';
import { FavoriteItem, ShoppingItem } from '../types';

interface ListStore {
  favorites: FavoriteItem[];
  shoppingItems: ShoppingItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  removeShoppingItem: (id: string) => void;
  togglePurchased: (id: string) => void;
}

export const useListStore = create<ListStore>((set) => ({
  favorites: [],
  shoppingItems: [],
  addFavorite: (item) =>
    set((state) => ({ favorites: [...state.favorites, item] })),
  removeFavorite: (id) =>
    set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
  addShoppingItem: (item) =>
    set((state) => ({ shoppingItems: [...state.shoppingItems, item] })),
  removeShoppingItem: (id) =>
    set((state) => ({
      shoppingItems: state.shoppingItems.filter((s) => s.id !== id),
    })),
  togglePurchased: (id) =>
    set((state) => ({
      shoppingItems: state.shoppingItems.map((s) =>
        s.id === id ? { ...s, isPurchased: !s.isPurchased } : s
      ),
    })),
}));

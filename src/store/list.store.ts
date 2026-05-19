import { create } from 'zustand';
import { ListStore, FavoriteItem, ShoppingItem } from '../types';

// 즐겨찾기 캐시 수명. 이 시간이 지나면 다음 진입 시 재조회(서버 측 변경 흡수).
export const FAVORITES_CACHE_TTL_MS = 5 * 60 * 1000;

export const useListStore = create<ListStore>(set => ({
  favorites: [],
  shoppingItems: [],
  // init dirty=true → 최초 진입은 반드시 fetch. synced 후 false.
  favoritesDirty: true,
  favoritesSyncedAt: null,

  setFavorites: (items: FavoriteItem[]) => {
    set({ favorites: items });
  },

  addFavorite: (item: FavoriteItem) => {
    // 외부 화면(스캔·검색·상세 등)에서 추가 = 즐겨찾기 stale → 다음 진입 시
    // 서버 정식 데이터(id·riskLevel) 정합 위해 재조회 필요
    set(state => ({ favorites: [item, ...state.favorites], favoritesDirty: true }));
  },

  removeFavorite: (id: string) => {
    set(state => ({
      favorites: state.favorites.filter(f => f.id !== id),
      favoritesDirty: true,
    }));
  },

  markFavoritesDirty: () => {
    set({ favoritesDirty: true });
  },

  markFavoritesSynced: () => {
    set({ favoritesDirty: false, favoritesSyncedAt: Date.now() });
  },

  setShoppingItems: (items: ShoppingItem[]) => {
    set({ shoppingItems: items });
  },

  addShoppingItem: (item: ShoppingItem) => {
    set(state => ({ shoppingItems: [item, ...state.shoppingItems] }));
  },

  removeShoppingItem: (id: string) => {
    set(state => ({ shoppingItems: state.shoppingItems.filter(s => s.id !== id) }));
  },

  togglePurchased: (id: string) => {
    set(state => ({
      shoppingItems: state.shoppingItems.map(s =>
        s.id === id ? { ...s, isPurchased: !s.isPurchased } : s,
      ),
    }));
  },
}));

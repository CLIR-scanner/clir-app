import { create } from 'zustand';
import { ListStore, FavoriteItem, ShoppingItem } from '../types';

export const useListStore = create<ListStore>(set => ({
  favorites: [],
  shoppingItems: [],

  setFavorites: (items: FavoriteItem[]) => {
    set({ favorites: items });
  },

  addFavorite: (item: FavoriteItem) => {
    set(state => ({ favorites: [item, ...state.favorites] }));
  },

  removeFavorite: (id: string) => {
    set(state => ({ favorites: state.favorites.filter(f => f.id !== id) }));
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

import { create } from 'zustand';
import { ListStore } from '../types';

export const useListStore = create<ListStore>(set => ({
  favorites: [],
  shoppingItems: [],
  addFavorite: item =>
    set(state => ({ favorites: [...state.favorites, item] })),
  removeFavorite: id =>
    set(state => ({ favorites: state.favorites.filter(f => f.id !== id) })),
  addShoppingItem: item =>
    set(state => ({ shoppingItems: [...state.shoppingItems, item] })),
  removeShoppingItem: id =>
    set(state => ({ shoppingItems: state.shoppingItems.filter(s => s.id !== id) })),
  togglePurchased: id =>
    set(state => ({
      shoppingItems: state.shoppingItems.map(s =>
        s.id === id ? { ...s, isPurchased: !s.isPurchased } : s
      ),
    })),
}));

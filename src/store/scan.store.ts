import { create } from 'zustand';
import { ScanStore, ScanHistory } from '../types';

export const useScanStore = create<ScanStore>(set => ({
  history: [],

  addHistory: (item: ScanHistory) => {
    set(state => ({ history: [item, ...state.history] }));
  },

  clearHistory: () => {
    set({ history: [] });
  },
}));

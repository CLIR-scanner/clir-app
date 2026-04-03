import { create } from 'zustand';
import { ScanStore } from '../types';

export const useScanStore = create<ScanStore>(set => ({
  history: [],
  addHistory: item =>
    set(state => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}));

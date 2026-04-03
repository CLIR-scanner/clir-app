// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { create } from 'zustand';
import { ScanHistory } from '../types';

interface ScanStore {
  history: ScanHistory[];
  addHistory: (item: ScanHistory) => void;
  clearHistory: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  history: [],
  addHistory: (item) =>
    set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}));

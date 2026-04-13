import { create } from 'zustand';
import { ScanStore, ScanHistory } from '../types';

export const useScanStore = create<ScanStore>(set => ({
  history: [],

  setHistory: (items: ScanHistory[]) => {
    set(state => {
      // 서버 응답에 없는 로컬 항목(방금 스캔해 아직 서버 반영 전)은 유지
      const serverIds = new Set(items.map(i => i.id));
      const localOnly = state.history.filter(i => !serverIds.has(i.id));
      return { history: [...localOnly, ...items] };
    });
  },

  addHistory: (item: ScanHistory) => {
    set(state => ({ history: [item, ...state.history] }));
  },

  clearHistory: () => {
    set({ history: [] });
  },
}));

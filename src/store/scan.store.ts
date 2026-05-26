import { create } from 'zustand';
import { ScanStore, ScanHistory } from '../types';

// 스캔 이력 캐시 수명. 이 시간이 지나면 다음 진입 시 재조회(서버 측 변경 흡수).
export const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

export const useScanStore = create<ScanStore>(set => ({
  history: [],
  // init dirty=true → 최초 진입은 반드시 fetch. synced 후 false.
  historyDirty: true,
  historySyncedAt: null,

  setHistory: (items: ScanHistory[]) => {
    set(state => {
      // 서버 응답에 없는 로컬 항목(방금 스캔해 아직 서버 반영 전)은 유지
      const serverIds = new Set(items.map(i => i.id));
      const localOnly = state.history.filter(i => !serverIds.has(i.id));
      return { history: [...localOnly, ...items] };
    });
  },

  addHistory: (item: ScanHistory) => {
    // 스캔 완료 = 이력 stale → 다음 진입 시 서버 정합 위해 재조회 필요
    set(state => ({ history: [item, ...state.history], historyDirty: true }));
  },

  replaceHistory: (localId: string, item: ScanHistory) => {
    // store-first 흐름에서 saveScanHistory 성공 후 local id → server id 정합화.
    // 다음 fetch 의 setHistory dedup(id 기준) 이 같은 항목을 중복 표시하지 않게 한다.
    set(state => ({
      history: state.history.map(h => (h.id === localId ? item : h)),
    }));
  },

  clearHistory: () => {
    // 프로필 변경 등으로 캐시 무효화 → 재조회 필요
    set({ history: [], historyDirty: true });
  },

  markHistoryDirty: () => {
    set({ historyDirty: true });
  },

  markHistorySynced: () => {
    set({ historyDirty: false, historySyncedAt: Date.now() });
  },
}));

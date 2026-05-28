import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanStore, ScanHistory, RetryScanItem } from '../types';

// 스캔 이력 캐시 수명. 이 시간이 지나면 다음 진입 시 재조회(서버 측 변경 흡수).
export const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

// 재시도 큐 정책
const RETRY_MAX_TRIES = 5;
const RETRY_TTL_MS = 24 * 60 * 60 * 1000; // 24h 이후 폐기

// 순환 import 방지 — saveScanHistory 를 동적 import. processRetryQueue 호출 시점에 해소.
async function callSaveScanHistory(params: { productId: string; result: RetryScanItem['result'] }) {
  const mod = await import('../services/scan.service');
  return mod.saveScanHistory(params);
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set, get) => ({
      history: [],
      // init dirty=true → 최초 진입은 반드시 fetch. synced 후 false.
      historyDirty: true,
      historySyncedAt: null,
      retryQueue: [],

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
        // 프로필 변경 등으로 캐시 무효화 → 재조회 필요.
        // retryQueue 는 사용자 단위가 아니라 디바이스 단위 누락 보정용이므로 함께 비운다
        // (다른 사용자로 로그인 직후 이전 사용자의 retry 가 발사되는 사고 방지).
        set({ history: [], historyDirty: true, retryQueue: [] });
      },

      markHistoryDirty: () => {
        set({ historyDirty: true });
      },

      markHistorySynced: () => {
        set({ historyDirty: false, historySyncedAt: Date.now() });
      },

      enqueueRetry: (item) => {
        set(state => {
          // 같은 localId 가 이미 있으면 tries 만 증가, firstAttemptAt 유지
          const existing = state.retryQueue.find(q => q.localId === item.localId);
          if (existing) {
            return {
              retryQueue: state.retryQueue.map(q =>
                q.localId === item.localId ? { ...q, tries: q.tries + 1 } : q,
              ),
            };
          }
          return {
            retryQueue: [
              ...state.retryQueue,
              { ...item, tries: 0, firstAttemptAt: Date.now() },
            ],
          };
        });
      },

      processRetryQueue: async () => {
        const queue = get().retryQueue;
        if (queue.length === 0) return { synced: 0, dropped: 0, remaining: 0 };

        const now = Date.now();
        const succeeded = new Set<string>();
        const dropped   = new Set<string>();
        const triesPatch = new Map<string, number>();

        for (const item of queue) {
          // TTL / tries 상한 → 폐기
          if (item.tries >= RETRY_MAX_TRIES || now - item.firstAttemptAt > RETRY_TTL_MS) {
            dropped.add(item.localId);
            continue;
          }
          try {
            const serverItem = await callSaveScanHistory({
              productId: item.productId,
              result: item.result,
            });
            // local history 의 임시 항목을 server id 로 정합화 (product 는 local 유지 — OCR 이미지 보존)
            const local = get().history.find(h => h.id === item.localId);
            if (local) {
              get().replaceHistory(item.localId, { ...serverItem, product: local.product });
            }
            succeeded.add(item.localId);
          } catch {
            triesPatch.set(item.localId, item.tries + 1);
          }
        }

        // 큐 정리
        set(state => {
          const remaining = state.retryQueue
            .filter(q => !succeeded.has(q.localId) && !dropped.has(q.localId))
            .map(q => triesPatch.has(q.localId) ? { ...q, tries: triesPatch.get(q.localId)! } : q);
          return { retryQueue: remaining };
        });

        return {
          synced: succeeded.size,
          dropped: dropped.size,
          remaining: get().retryQueue.length,
        };
      },
    }),
    {
      name: 'clir-scan-store',
      storage: createJSONStorage(() => AsyncStorage),
      // 영구화 대상: history(서버 동기화 실패 항목 포함) + retryQueue.
      // dirty / syncedAt 은 휘발성 — 앱 재시작 시 dirty=true 가 합리적 디폴트(initial state 가 그렇게 설정됨).
      partialize: (state) => ({
        history: state.history,
        retryQueue: state.retryQueue,
      }),
      // ScanHistory.scannedAt 은 Date 객체 — rehydration 시 string → Date 복원.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.history = state.history.map(h => ({
          ...h,
          scannedAt: h.scannedAt instanceof Date ? h.scannedAt : new Date(h.scannedAt),
        }));
        // 재시작 직후엔 서버 동기화 시도 권장 — dirty=true.
        state.historyDirty = true;
      },
    },
  ),
);

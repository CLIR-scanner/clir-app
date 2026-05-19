// 스플래시 → 스캔 탭 핸드오프 신호.
// 스플래시 오버레이의 C 가 스캔 버튼 위치로 이동을 "완료"하기 전까지는
// 실제 스캔 탭 아이콘을 렌더하지 않는다(빈 원 유지) → 화면에 C 는 항상 1개.
// 이동 완료 시 markDone() → 탭이 실제 아이콘을 채우고, 오버레이 글리프는 사라진다.
// (Zustand 신규 스토어 금지 규칙 → 경량 pub/sub 외부 스토어로 구현)
let done = false;
const listeners = new Set<() => void>();

export const splashHandoff = {
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  },
  getSnapshot(): boolean {
    return done;
  },
  markDone(): void {
    if (done) return;
    done = true;
    listeners.forEach(l => l());
  },
  // 스플래시가 (재)시작될 때 호출 — 핸드오프 전까지 탭 아이콘을 다시 숨긴다.
  reset(): void {
    if (!done) return;
    done = false;
    listeners.forEach(l => l());
  },
};

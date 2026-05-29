// QA(커뮤니티 Q&A) 피드 변경 신호 — 글 작성/수정/삭제 후 Q&A 목록을 보여주는
// 여러 화면(QAScreen, CommunityScreen 등)이 다음 focus 때 재조회하도록 한다.
//
// 버전 카운터 방식: 변경 시 bump(). 각 화면은 마지막으로 동기화한 버전을 ref 로
// 기억하고, focus 시 현재 버전과 다르면 재조회한다. (소비-1회 boolean 과 달리
// 여러 화면이 독립적으로 각자 갱신 — '나머지 페이지들' 모두 반영.)
// Zustand 신규 스토어 금지 규칙 → 경량 외부 카운터로 구현. (splashHandoff 와 동일 패턴)
let version = 0;

export const qaFeed = {
  /** Q&A 글 작성/수정/삭제 등 목록에 영향 주는 변경 발생 시 호출. */
  bump(): void {
    version += 1;
  },
  /** 현재 피드 버전. 화면이 마지막 동기화 버전과 비교해 stale 판단. */
  getVersion(): number {
    return version;
  },
};

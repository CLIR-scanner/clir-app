/**
 * store-first 흐름의 로컬 ID 생성기.
 *
 * `Date.now()` 만으로는 동일 ms 내 두 호출이 충돌하므로,
 * 8자리 base36 random suffix 를 붙여 사실상 충돌 0 보장.
 *
 * 보안용 아님 (Math.random 기반). 서버 정합성은 store.replaceHistory(localId, serverItem)
 * 와 다음 fetch 의 setHistory dedup(id 기준) 이 책임진다.
 *
 * 예: `local-1735200000000-a1b2c3d4`
 */
export function makeLocalId(prefix: string = 'local'): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${prefix}-${ts}-${rand}`;
}

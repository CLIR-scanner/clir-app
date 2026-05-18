// 스캔 탭 버튼의 실제 화면 좌표(window) — 스플래시 C 가 정확히 그 자리로
// tuck 되도록 런타임 측정값을 공유한다. 근사 좌표 사용 시 생기는 "툭 끊김" 제거용.
export type ScanButtonAnchor = {
  /** 버튼(스캔 원) 중심의 window x */
  cx: number;
  /** 버튼(스캔 원) 중심의 window y */
  cy: number;
  /** 탭이 스캔 글리프를 렌더하는 정사각 Svg 크기(px) — 동일 글리프 스케일 매칭 기준 */
  glyphSvg: number;
};

let current: ScanButtonAnchor | null = null;

export function setScanButtonAnchor(a: ScanButtonAnchor | null): void {
  current = a;
}

export function getScanButtonAnchor(): ScanButtonAnchor | null {
  return current;
}

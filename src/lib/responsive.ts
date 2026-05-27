// 반응형 패딩 유틸 — iPhone 가로 폭 3티어 (compact / regular / wide).
//
// 적용 범위: List 탭(FavoritesScreen), Scan History, Scan 후 상세 화면.
// 폰트 크기·썸네일 크기·터치 타겟(pill/badge/button) 은 의도적으로 비대상 —
// Dynamic Type 충돌·터치 타겟 44pt 최소 보장을 위해 고정 유지.
//
// 티어 경계 근거 (iPhone 실 단말):
//   compact <360pt  → SE 1세대(320) 등
//   regular 360~413 → iPhone 13/14/15(390), Pro(393), mini(375)
//   wide    ≥414pt  → Plus(414), Pro Max(430)

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type ResponsiveTier = 'compact' | 'regular' | 'wide';

const COMPACT_MAX = 360;
const WIDE_MIN    = 414;

export interface ResponsivePads {
  /** 그룹 A. 페이지 좌우 여백 (scroll / listContent / header.paddingHorizontal) */
  pageH: number;
  /** 그룹 B. 박스 내부 가로 패딩 (ingredientBox / riskBoxOuter / modalSheet.paddingHorizontal) */
  boxH: number;
  /** 그룹 C. 박스 외부 가로 마진 (SevereDisclaimerBox / ingredientSection / riskSection.marginHorizontal) */
  boxOuterH: number;
  /** 그룹 E. 리스트 행 gap (썸네일↔텍스트 등) */
  rowGap: number;
}

const PADS: Record<ResponsiveTier, ResponsivePads> = {
  // boxH 는 디테일 화면 ingredientBox / riskBoxOuter / SevereDisclaimerBox 의 좌우 내부 패딩.
  // 텍스트(성분명·면책 문구) 표시 폭을 늘리기 위해 의도적으로 작은 값.
  compact: { pageH: 20, boxH: 12, boxOuterH:  8, rowGap: 12 },
  regular: { pageH: 24, boxH: 16, boxOuterH: 12, rowGap: 16 },
  wide:    { pageH: 28, boxH: 20, boxOuterH: 16, rowGap: 20 },
};

export function pickTier(width: number): ResponsiveTier {
  if (width < COMPACT_MAX) return 'compact';
  if (width >= WIDE_MIN)   return 'wide';
  return 'regular';
}

/**
 * 현재 가로 폭 기준 티어 + 패딩 토큰 반환.
 * rotation / multi-tasking 등으로 폭이 변하면 자동 재렌더 (useWindowDimensions 기반).
 */
export function useResponsive(): { tier: ResponsiveTier; pad: ResponsivePads } {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    const tier = pickTier(width);
    return { tier, pad: PADS[tier] };
  }, [width]);
}

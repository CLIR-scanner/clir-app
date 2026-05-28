// 약관·개인정보·쿠키 정책 호스팅 URL 의 단일 source of truth.
// 페이지 자체는 clir-app.com 정적 호스팅에서 관리 — 단일 policy.html 의 탭(해시 fragment)으로 구분.
// 약관 텍스트 변경은 호스팅 HTML 만 수정 → 앱 재배포 불필요.

import { Linking } from 'react-native';

// 공식 정책 페이지. 하나의 policy.html 안에서 탭 해시로 ToS / Privacy / Cookies 구분.
const POLICY_BASE = 'https://clir-app.com/policy.html';

export const LEGAL_URLS = {
  terms:   `${POLICY_BASE}#tab-tos`,
  privacy: `${POLICY_BASE}#tab-privacy`,
  cookies: `${POLICY_BASE}#tab-cookies`,
} as const;

export type LegalKind = keyof typeof LEGAL_URLS;

/**
 * 시스템 브라우저로 약관·개인정보·쿠키 정책 페이지 열기.
 * 실패 시 silent — 디바이스에 브라우저 부재 또는 URL 부적격 (거의 안 일어남).
 * 콘텐츠는 외부 호스팅이라 앱 재배포 없이 약관 갱신 가능.
 */
export async function openLegal(kind: LegalKind): Promise<void> {
  const url = LEGAL_URLS[kind];
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  } catch {
    /* swallow — UX 우선, 실패 사용자 흐름 막지 않음 */
  }
}

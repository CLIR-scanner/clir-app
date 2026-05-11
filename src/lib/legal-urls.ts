// 약관·개인정보 호스팅 URL 의 단일 source of truth.
// 페이지 자체는 waitlist-landing repo (Vercel 정적 호스팅) 에서 관리.
// 약관 텍스트 변경은 그 repo 의 HTML 만 수정 → 앱 재배포 불필요.

import { Linking } from 'react-native';

// Vercel auto-generated subdomain for waitlist-landing project. canonical 태그가
// 가리키는 'clir-beta.vercel.app' 은 미할당 alias (HTTP 404). 실제 라이브 URL 사용.
const LANDING_BASE = 'https://waitlist-landing-nu.vercel.app';

export const LEGAL_URLS = {
  privacy: `${LANDING_BASE}/privacy`,
  terms:   `${LANDING_BASE}/terms`,
} as const;

export type LegalKind = keyof typeof LEGAL_URLS;

/**
 * 시스템 브라우저로 약관·개인정보 페이지 열기.
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

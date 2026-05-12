// 소셜 로그인 전용 서비스.
// - 브라우저 플로우 (expo-auth-session + Supabase OAuth) 로 구현.
// - 추후 Expo Dev Build 로 전환해 네이티브 SDK (expo-apple-authentication,
//   @react-native-google-signin/google-signin) 로 교체할 때도
//   아래 함수 시그니처는 유지하고 본문만 바꾸면 된다.

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import { supabase } from '../lib/supabase';
import { apiFetch, setAuthToken, clearAuthToken, ApiError } from '../lib/api';
import { sessionStore } from '../lib/secure-store';
import { User, SurveyData, BetaCohort } from '../types';
import { DEFAULT_LANGUAGE } from '../constants/languages';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = AuthSession.makeRedirectUri({ scheme: 'clir', path: 'auth/callback' });

// ─── OAuth ─────────────────────────────────────────────────────────────────

type AuthResult = {
  token: string;
  user: User;
  isFirstLogin: boolean;
};

async function signInWithProvider(provider: 'google' | 'apple'): Promise<AuthResult> {
  console.log('[oauth] redirectTo =', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    console.log('[oauth] signInWithOAuth error:', error);
    throw new Error(error?.message ?? 'OAuth 시작에 실패했습니다.');
  }
  console.log('[oauth] auth url:', data.url.slice(0, 120));

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  console.log('[oauth] WebBrowser result.type =', result.type);
  if (result.type === 'success') {
    console.log('[oauth] returned url:', result.url);
  }

  if (result.type !== 'success') {
    throw new Error(`WebBrowser result=${result.type} (redirect URL이 앱으로 돌아오지 않음)`);
  }

  // Implicit: redirect URL의 fragment(#access_token=...&refresh_token=...)에서 토큰 추출
  const hash = result.url.split('#')[1] ?? '';
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('OAuth 응답에서 토큰을 찾을 수 없습니다.');
  }
  // setSession 은 내부적으로 Supabase /auth/v1/user 를 호출하는데, 일부 환경
  // (Apple Silicon Pixel 에뮬레이터 등) 에서 RN OkHttp fetch 가 Cloudflare-fronted
  // Supabase 엔드포인트로 도달 못해 'Network request failed' 로 떨어짐. CLIR 는
  // Supabase JS SDK 의 in-memory 세션을 사용 안 하고 BE (Railway) /auth/me 가
  // 토큰을 검증하므로, setSession 의 실패는 swallow 후 fragment 의 access_token
  // 그대로 사용해도 로그인 흐름이 완성됨.
  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (e) {
    console.log('[oauth] setSession failed (ignored, falling back to fragment token):', e);
  }
  console.log('[oauth] using fragment token, fetching /auth/me');

  const token = accessToken;
  setAuthToken(token);

  // refresh_token 을 OS keychain/keystore 에 저장 — 다음 cold start 에 자동 세션 복원.
  // access_token 도 함께 저장하지만 refresh 가 source of truth (access 는 보통 1h 후 만료).
  await sessionStore.write({ access: accessToken, refresh: refreshToken });

  const me = await fetchMe();
  // Sentry 이벤트에 사용자 식별자 부착 — 크래시·에러를 특정 베타 사용자와 매칭.
  // email 은 PII 라 포함하지 않음. id 만으로 대시보드 필터링 충분.
  Sentry.setUser({ id: me.user.id });
  return { token, user: me.user, isFirstLogin: !me.hasCompletedSurvey };
}

/** Cold start 시 저장된 refresh_token 으로 세션 자동 복원.
 *  성공 시 in-memory _token 설정 + 신규 토큰 페어 sessionStore 갱신 + /auth/me 페치 후 User 반환.
 *  실패 (refresh expired/revoked, 네트워크, fetchMe 4xx) 시 sessionStore 정리 후 null. */
export async function restoreSession(): Promise<User | null> {
  const stored = await sessionStore.read();
  if (!stored) return null;
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: stored.refresh,
    });
    if (error || !data?.session) {
      console.log('[oauth] restoreSession: refresh rejected', error);
      await sessionStore.clear();
      return null;
    }
    const newAccess = data.session.access_token;
    const newRefresh = data.session.refresh_token;
    setAuthToken(newAccess);
    await sessionStore.write({ access: newAccess, refresh: newRefresh });

    const me = await fetchMe();
    Sentry.setUser({ id: me.user.id });
    return me.user;
  } catch (e) {
    console.log('[oauth] restoreSession failed:', e);
    await sessionStore.clear();
    clearAuthToken();
    return null;
  }
}

export function signInWithGoogle(): Promise<AuthResult> {
  return signInWithProvider('google');
}

export function signInWithApple(): Promise<AuthResult> {
  // TODO: Supabase Apple provider 활성화 후 활성화
  throw new Error('Apple 로그인은 아직 준비되지 않았습니다.');
}

// ─── Profile ───────────────────────────────────────────────────────────────

type MeResponse = {
  id: string;
  email: string;
  name: string;
  allergyProfile: string[];
  dietaryRestrictions: string[];
  sensitivityLevel: 'strict' | 'normal';
  language?: string;
  hasCompletedSurvey: boolean;
  betaCohort?: BetaCohort[] | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
};

/** GET /auth/me — 현재 토큰으로 프로필 조회 + 최초 로그인 여부 반환 */
export async function fetchMe(): Promise<{ user: User; hasCompletedSurvey: boolean }> {
  const res = await apiFetch<MeResponse>('/auth/me');
  const user: User = {
    id: res.id,
    email: res.email,
    name: res.name,
    allergyProfile: res.allergyProfile,
    dietaryRestrictions: res.dietaryRestrictions,
    sensitivityLevel: res.sensitivityLevel,
    language: res.language ?? DEFAULT_LANGUAGE,
    multiProfiles: [],
    consentFlags: { imageRetention: false, corrections: false },
    hasCompletedSurvey: res.hasCompletedSurvey,
    betaCohort: res.betaCohort ?? null,
    termsAcceptedAt: res.termsAcceptedAt ?? null,
    termsVersion: res.termsVersion ?? null,
  };
  return { user, hasCompletedSurvey: res.hasCompletedSurvey };
}

/** POST /auth/accept-terms — 약관 동의 audit trail 기록.
 *  멱등 — 같은 사용자가 다시 호출하면 timestamp 만 갱신. 호출자는 fire-and-forget OK
 *  (실패해도 사용자 흐름 막지 않음). 다음 fetchMe 응답에 갱신된 termsAcceptedAt/Version. */
export async function acceptTerms(version: string): Promise<{
  termsAcceptedAt: string;
  termsVersion: string;
}> {
  const res = await apiFetch<{
    ok: true;
    termsAcceptedAt: string;
    termsVersion: string;
  }>('/auth/accept-terms', {
    method: 'POST',
    body: JSON.stringify({ version }),
  });
  return { termsAcceptedAt: res.termsAcceptedAt, termsVersion: res.termsVersion };
}

/** POST /auth/redeem-invite — 베타 invite_code 사용 → cohort 배열 반환.
 *  멱등: 이미 redeem 한 사용자는 alreadyRedeemed:true 와 함께 동일 cohort 배열 반환.
 *  BE 0005 마이그레이션 이후 cohort 는 항상 배열 (1개 이상). */
export async function redeemInvite(
  inviteCode: string,
): Promise<{ cohort: BetaCohort[]; alreadyRedeemed?: boolean }> {
  const res = await apiFetch<{
    ok: true;
    cohort: BetaCohort[];
    alreadyRedeemed?: boolean;
  }>('/auth/redeem-invite', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
  return { cohort: res.cohort, alreadyRedeemed: res.alreadyRedeemed };
}

// ─── Survey ────────────────────────────────────────────────────────────────

/**
 * POST /auth/survey
 * 로그인 상태에서만 호출 가능. Authorization 헤더의 토큰으로 사용자 식별.
 */
export async function submitSurvey(data: SurveyData): Promise<void> {
  await apiFetch<{ message: string }>('/auth/survey', {
    method: 'POST',
    body: JSON.stringify({
      allergyProfile: data.allergyProfile,
      dietaryRestrictions: data.dietaryRestrictions,
      sensitivityLevel: data.sensitivityLevel,
    }),
  });
}

// ─── Sign out ──────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Supabase 네트워크 실패해도 로컬 토큰은 정리
  }
  clearAuthToken();
  // 저장된 refresh_token 도 제거 — 다음 cold start 에 자동 로그인 되지 않게.
  await sessionStore.clear();
  // Sentry 식별자 해제 — 다음 로그인 사용자와 이벤트 분리.
  Sentry.setUser(null);
}

export { ApiError };

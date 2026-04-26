// TODO: Real API 연동 시 이 파일의 구현부만 교체
//
// 소셜 로그인 전용 서비스.
// - 브라우저 플로우 (expo-auth-session + Supabase OAuth) 로 구현.
// - 추후 Expo Dev Build 로 전환해 네이티브 SDK (expo-apple-authentication,
//   @react-native-google-signin/google-signin) 로 교체할 때도
//   아래 함수 시그니처는 유지하고 본문만 바꾸면 된다.

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { apiFetch, setAuthToken, clearAuthToken, ApiError } from '../lib/api';
import { User, SurveyData } from '../types';

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
  console.log('[oauth] tokens extracted, setting session');
  // DEV-ONLY: 로컬 curl 테스트용 access_token 출력. 배포 전 제거.
  console.log('[DEV] ACCESS_TOKEN =', accessToken);

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError || !sessionData?.session) {
    console.log('[oauth] setSession error:', sessionError);
    throw new Error(sessionError?.message ?? '세션 설정에 실패했습니다.');
  }
  console.log('[oauth] session acquired, fetching /auth/me');

  const token = sessionData.session.access_token;
  setAuthToken(token);

  const me = await fetchMe();
  return { token, user: me.user, isFirstLogin: !me.hasCompletedSurvey };
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
  hasCompletedSurvey: boolean;
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
    language: 'en',
    multiProfiles: [],
    consentFlags: { imageRetention: false, corrections: false },
  };
  return { user, hasCompletedSurvey: res.hasCompletedSurvey };
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
}

export { ApiError };

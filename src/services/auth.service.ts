// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { User, SignupData, SurveyData } from '../types';
import { apiFetch, setAuthToken } from '../lib/api';

/**
 * POST /auth/signup
 * 새 계정을 생성하고 생성된 userId를 반환한다.
 */
export async function signup(data: SignupData): Promise<{ userId: string }> {
  const res = await apiFetch<{ userId: string; email: string; name: string }>(
    '/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
      }),
    },
  );
  return { userId: res.userId };
}

/**
 * POST /auth/survey
 * 회원가입 직후 알러지·식이·민감도 설문을 저장한다.
 */
export async function submitSurvey(userId: string, data: SurveyData): Promise<void> {
  await apiFetch<{ message: string }>('/auth/survey', {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({
      allergyProfile: data.allergyProfile,
      dietaryRestrictions: data.dietaryRestrictions,
      sensitivityLevel: data.sensitivityLevel,
    }),
  });
}

/**
 * POST /auth/login
 * 로그인 후 JWT 토큰과 사용자 프로필을 반환한다.
 * 토큰은 api.ts 모듈에 저장되며, 이후 모든 요청에 자동 주입된다.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const res = await apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(res.token);
  return res;
}

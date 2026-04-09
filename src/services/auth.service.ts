// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { User, SignupData, SurveyData } from '../types';

/**
 * POST /auth/signup
 * 새 계정을 생성하고 생성된 userId를 반환한다.
 */
export async function signup(data: SignupData): Promise<{ userId: string }> {
  throw new Error('Not implemented');
}

/**
 * POST /auth/survey
 * 회원가입 직후 알러지·식이·민감도 설문을 저장한다.
 */
export async function submitSurvey(userId: string, data: SurveyData): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * POST /auth/login
 * 로그인 후 JWT 토큰과 사용자 프로필을 반환한다.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  throw new Error('Not implemented');
}

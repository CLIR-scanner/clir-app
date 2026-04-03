// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { User, SignupData } from '../types';
import { mockUser } from '../mocks/user.mock';

export async function login(email: string, password: string): Promise<User> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
  if (email && password) {
    return mockUser;
  }
  throw new Error('Invalid credentials');
}

export async function signup(data: SignupData): Promise<User> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
  return {
    ...mockUser,
    email: data.email,
    name: data.name,
    allergyProfile: data.allergyProfile,
    dietaryRestrictions: data.dietaryRestrictions,
    sensitivityLevel: data.sensitivityLevel,
  };
}

export async function logout(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

export async function getCurrentUser(): Promise<User> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  // Mock: 미인증 상태(id: '')를 반환 → RootNavigator가 AuthNavigator를 표시.
  // 로그인/회원가입 후 setUser()가 호출되면 id가 채워지고 MainNavigator로 자동 전환.
  // Real API 연동 시: 저장된 토큰으로 사용자 정보를 조회하거나 null을 반환.
  // mockUser spread 금지 — allergyProfile / multiProfiles 등 mock 데이터가 guest에 오염됨
  return {
    id: '',
    email: '',
    name: '',
    allergyProfile: [],
    dietaryRestrictions: [],
    sensitivityLevel: 'normal',
    language: 'ko',
    multiProfiles: [],
  };
}

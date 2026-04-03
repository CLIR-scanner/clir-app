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
  return mockUser;
}

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { User, Profile } from '../types';
import { apiFetch } from '../lib/api';

/**
 * 현재 로그인된 사용자의 전체 프로필을 반환한다.
 */
export async function getProfile(): Promise<User> {
  throw new Error('Not implemented');
}

/**
 * 사용자 이름을 변경한다.
 * PATCH /user/me  { name }
 */
export async function updateName(name: string): Promise<void> {
  await apiFetch<void>('/user/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

/**
 * 비밀번호를 변경한다.
 * PATCH /user/password  { currentPassword, newPassword }
 */
export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<void>('/user/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * activeProfile 필드를 업데이트한다.
 */
export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  throw new Error('Not implemented');
}

/**
 * 멀티 프로필에 새 프로필을 추가한다.
 */
export async function addMultiProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
  throw new Error('Not implemented');
}

/**
 * 멀티 프로필의 특정 프로필을 수정한다.
 */
export async function updateMultiProfile(
  profileId: string,
  updates: Partial<Omit<Profile, 'id'>>,
): Promise<Profile> {
  throw new Error('Not implemented');
}

/**
 * 멀티 프로필에서 특정 프로필을 삭제한다.
 */
export async function deleteMultiProfile(profileId: string): Promise<void> {
  throw new Error('Not implemented');
}

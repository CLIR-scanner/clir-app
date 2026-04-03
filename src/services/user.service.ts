// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { User, Profile } from '../types';
import { mockUser } from '../mocks/user.mock';

export async function getUser(userId: string): Promise<User> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  return mockUser;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return { ...mockUser, ...updates };
}

export async function addProfile(userId: string, profile: Omit<Profile, 'id'>): Promise<Profile> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return { id: `profile-${Date.now()}`, ...profile };
}

export async function updateProfile(
  userId: string,
  profileId: string,
  updates: Partial<Profile>
): Promise<Profile> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  const existing = mockUser.multiProfiles.find((p: Profile) => p.id === profileId) ?? mockUser;
  return { ...existing, ...updates };
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
}

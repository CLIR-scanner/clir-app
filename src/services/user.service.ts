// 사용자 본인 프로필 + 멤버 프로필(멀티) BE API 호출 레이어.
// BE 라우트: src/routes/profiles-members.ts

import { apiFetch } from '../lib/api';
import { MemberProfile, MemberProfileInput, MemberProfileUpdate } from '../types';

// ─── 본인 프로필 메타 ────────────────────────────────────────────────────────

/** PATCH /user/me — 사용자 이름 변경. */
export async function updateName(name: string): Promise<void> {
  await apiFetch<void>('/user/me', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

/** PATCH /user/me — 언어 코드 동기화. BE 가 이 엔드포인트를 아직 미구현이면
 *  404 throw — 콜러는 silent-swallow 권장 (AsyncStorage 가 durable 계층). */
export async function updateLanguage(language: string): Promise<void> {
  await apiFetch<void>('/user/me', {
    method: 'PATCH',
    body: JSON.stringify({ language }),
  });
}

// ─── 멤버 프로필 (가족 등) ───────────────────────────────────────────────────

/** GET /profiles/members — 본인이 소유한 멤버 프로필 전체 목록. */
export async function listMembers(): Promise<MemberProfile[]> {
  const res = await apiFetch<{ members: MemberProfile[] }>('/profiles/members');
  return res.members;
}

/** GET /profiles/members/:id — 단건 조회 (소유자 검증). */
export async function getMember(id: string): Promise<MemberProfile> {
  return apiFetch<MemberProfile>(`/profiles/members/${encodeURIComponent(id)}`);
}

/** POST /profiles/members — 신규 멤버 프로필 생성. */
export async function createMember(input: MemberProfileInput): Promise<MemberProfile> {
  return apiFetch<MemberProfile>('/profiles/members', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** PATCH /profiles/members/:id — 부분 갱신. */
export async function updateMember(
  id: string,
  updates: MemberProfileUpdate,
): Promise<MemberProfile> {
  return apiFetch<MemberProfile>(`/profiles/members/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** DELETE /profiles/members/:id — 삭제 (소유자 검증). */
export async function deleteMember(id: string): Promise<void> {
  await apiFetch<void>(`/profiles/members/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// UGC 모더레이션 — 신고 (POST /qna/:id/reports, POST /answers/:answerId/reports)
// + 사용자 차단 (POST /users/me/blocks, DELETE /users/me/blocks/:userId, GET /users/me/blocks).
// Apple Guideline 1.2 대응. BE 라우트: clir-api/src/routes/moderation.ts.

import { apiFetch } from '../lib/api';

export async function reportQAQuestion(questionId: string, reason: string): Promise<void> {
  await apiFetch<{ message: string }>(
    `/qna/${encodeURIComponent(questionId)}/reports`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export async function reportQAAnswer(answerId: string, reason: string): Promise<void> {
  await apiFetch<{ message: string }>(
    `/answers/${encodeURIComponent(answerId)}/reports`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
}

export async function blockUser(userId: string): Promise<void> {
  await apiFetch<{ message: string }>(
    '/users/me/blocks',
    {
      method: 'POST',
      body: JSON.stringify({ userId }),
    },
  );
}

export async function unblockUser(userId: string): Promise<void> {
  await apiFetch<{ message: string }>(
    `/users/me/blocks/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
}

export interface BlockedUserEntry {
  blockedUserId: string;
  createdAt: string;
}

export async function listBlockedUsers(): Promise<BlockedUserEntry[]> {
  const res = await apiFetch<{ blocks: BlockedUserEntry[] }>('/users/me/blocks');
  return res.blocks;
}

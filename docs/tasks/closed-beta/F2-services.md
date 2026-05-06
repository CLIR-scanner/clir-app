# F2 — services 레이어 확장

**의존**: F1 완료 (타입 추가됨)
**산출**: `auth.service.ts` 수정 + `scan.service.ts` 수정
**예상 시간**: 30분
**검증**: `npx tsc --noEmit` + 수동 curl smoke

---

## 무엇을 만드는가

서비스 레이어에 베타 v1 의 신규 BE 엔드포인트 호출 함수 2개를 추가하고, `fetchMe` 의 응답 매핑에 `betaCohort` 를 포함시킨다. **기존 함수 시그니처 변경 X** — 신규 함수만 추가.

---

## 변경 A: `auth.service.ts`

파일: `CLIR/src/services/auth.service.ts`

### A-1. import 갱신

```diff
-import { User, SurveyData } from '../types';
+import { User, SurveyData, BetaCohort } from '../types';
```

### A-2. `MeResponse` 타입에 `betaCohort` 필드 추가

```diff
 type MeResponse = {
   id: string;
   email: string;
   name: string;
   allergyProfile: string[];
   dietaryRestrictions: string[];
   sensitivityLevel: 'strict' | 'normal';
   language?: string;
   hasCompletedSurvey: boolean;
+  betaCohort?: BetaCohort[] | null;
 };
```

### A-3. `fetchMe` 의 user 객체에 `betaCohort` 매핑 추가

> **컨텍스트 주의** — 실제 `auth.service.ts:91-118` 의 `MeResponse`/`fetchMe` 는 이 task doc 작성 시점보다 진화해서 `language?: string;` 필드 + `language: res.language ?? DEFAULT_LANGUAGE` 매핑 + `hasCompletedSurvey: res.hasCompletedSurvey` 줄을 포함한다. 아래 diff 는 이 현재 상태 기준으로 잡아 둔 것 — 실제 파일에 그대로 적용 가능.

```diff
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
+    betaCohort: res.betaCohort ?? null,   // BE 가 BetaCohort[] 또는 null 반환
   };
   return { user, hasCompletedSurvey: res.hasCompletedSurvey };
 }
```

### A-4. 신규 `redeemInvite` 함수 추가

위치: `submitSurvey` 함수 위 또는 아래, `fetchMe` 와 같은 섹션 안.

```typescript
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
```

---

## 변경 B: `scan.service.ts`

파일: `CLIR/src/services/scan.service.ts`

### B-1. 신규 `submitScanFeedback` 함수 추가

위치: `saveScanHistory` 함수 위 또는 아래.

```typescript
/** POST /scan-logs/:scanLogId/feedback — 1탭 helpful 피드백.
 *  본인 scan_log row 만 수정 가능. 멱등 (덮어쓰기 허용). */
export async function submitScanFeedback(
  scanLogId: string,
  helpful: boolean,
  comment?: string,
): Promise<void> {
  await apiFetch(`/scan-logs/${scanLogId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ helpful, comment }),
  });
}
```

`comment` 는 베타 v1 에서는 미사용 (1탭만). 시그니처에는 두되 호출처는 `undefined` 전달.

---

## 하지 말 것

- 기존 함수 시그니처 변경 (CLAUDE.md 룰)
- `apiFetch` 우회하고 `fetch` 직접 호출
- 토큰 헤더 수동 주입 (`apiFetch` 가 자동 처리)
- `comment` 길이 검증을 FE 에서 (BE 가 검증 — 500자 초과 시 400 반환)
- 401 에러 catch 후 무시 — `apiFetch` 가 throw 한 `UnauthorizedError` 는 화면 레벨에서 처리

---

## 완료 판단

```bash
cd CLIR
npx tsc --noEmit                           # exit 0
grep -n "redeemInvite\|submitScanFeedback" src/services/*.ts
# auth.service.ts:N:export async function redeemInvite(...
# scan.service.ts:N:export async function submitScanFeedback(...
```

수동 smoke (선택):
```bash
# BE 서버 가동 + Supabase JWT $TOKEN 확보 + waitlist 에 invite_code='abc1234567', cohort='us-allergy' 1건 채운 뒤
node -e "
  const fetch = require('node-fetch');
  fetch('http://localhost:3000/auth/redeem-invite', {
    method: 'POST',
    headers: { 'authorization': 'Bearer $TOKEN', 'content-type': 'application/json' },
    body: JSON.stringify({ inviteCode: 'abc1234567' }),
  }).then(r => r.json()).then(console.log);
"
# → { ok: true, cohort: ['us-allergy'] }   # 배열 반환 (1개라도 배열)
```

# F1 — 도메인 타입 추가

**의존**: 없음
**산출**: `CLIR/src/types/index.ts` 수정 1건
**예상 시간**: 15분
**검증**: `cd CLIR && npx tsc --noEmit` 통과

---

## 무엇을 만드는가

베타 v1 에서 사용할 도메인 타입 4가지를 `CLIR/src/types/index.ts` 의 적절한 섹션에 추가한다. BE 의 `clir-api/src/types/index.ts` 와 *한 글자 동일* 하게 유지 (이미 BE 측은 v3 에서 구현 완료).

---

## 정확한 변경

### 변경 1: `User` 인터페이스에 `betaCohort` 필드 추가

위치: `CLIR/src/types/index.ts` 의 기존 `export interface User extends Profile { ... }` 정의.

```diff
 export interface User extends Profile {
   email: string;
   language: string;
   multiProfiles: Profile[];
   consentFlags: ConsentFlags;
   hasCompletedSurvey?: boolean;
+  /** 베타 코호트 배열. null/빈 배열 = 미통과, 1개 이상 = 통과한 코호트 목록 */
+  betaCohort?: BetaCohort[] | null;
 }
```

> BE 0005 마이그레이션 이후 `profiles.beta_cohort` 가 `text[]` 다 (한 사용자가 여러 코호트에 동시 속할 수 있음). FE 도 배열로 받아 `.length > 0` 또는 `.includes('us-allergy')` 등으로 게이트 판정.

### 변경 2: `ScanResult` ParamList 에 `scanLogId` 추가

위치: `export type ScanStackParamList = { ... };` 안의 `ScanResult` 라인.

```diff
-  ScanResult: { productId: string; fromHistory?: boolean; ocrProduct?: Product };
+  ScanResult: { productId: string; fromHistory?: boolean; ocrProduct?: Product; scanLogId?: string };
```

`scanLogId` 는 OCR 경로에서 BE 가 반환한 `OCRResult.scanLogId` 값을 ScanResult 화면으로 전달하는 통로. F4 에서 사용. optional 이라 기존 호출처(`navigation.navigate('ScanResult', ...)`) 변경 불필요.

### 변경 3: 신규 `Closed Beta` 섹션 추가

위치: 파일 끝 부근, `// ─── Request Payloads ─────` 직전 또는 다른 섹션 코멘트 사이. (BE 와 동일 위치 권장.)

```typescript
// ─── Closed Beta ──────────────────────────────────────────────────────────────

/** 지원 로케일 6종. waitlist.locale 과 i18n 키 양쪽이 사용. */
export type SupportedLocale = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr';

/** 베타 코호트. BE waitlist.cohort + profiles.beta_cohort 와 일치. */
export type BetaCohort = 'us-allergy' | 'us-ka' | 'us-veg';

/** waitlist 테이블의 도메인 표현. (관리자 조회 / FE 선택적 사용) */
export interface WaitlistEntry {
  id: string;
  email: string;
  source?: string;
  cohort: BetaCohort[];     // 1개 이상 복수 선택 가능 (BE 0005 마이그레이션)
  locale: SupportedLocale;
  inviteCode?: string;
  invitedAt?: string;
  createdAt: string;
}

/** POST /scan-logs/:scanLogId/feedback 요청 body. */
export interface ScanFeedbackInput {
  helpful: boolean;
  comment?: string;
}
```

---

## 하지 말 것

- 다른 파일에 위 타입 정의 X (`src/types/index.ts` 한 곳)
- `BetaCohort` 를 `string` 으로 느슨하게 두지 말 것 — literal union 유지 (자동완성·오타 방지)
- `betaCohort` 를 required (`betaCohort: BetaCohort[] | null`) 로 만들지 말 것 — `?` optional 로 두어야 기존 mock·test 코드 호환
- `betaCohort` 를 단일 `BetaCohort` 로 정의 금지 — 반드시 `BetaCohort[]` (BE 0005 이후 배열)
- BE 와 *다른* 이름·shape 사용 금지 (반드시 `clir-api/src/types/index.ts` 와 동일)

---

## 완료 판단

```bash
cd CLIR
npx tsc --noEmit
# exit 0 + 베타 관련 새 에러 0건
grep -n "BetaCohort\|WaitlistEntry\|ScanFeedbackInput\|SupportedLocale" src/types/index.ts
# 4개 모두 export 되어 있어야 함
```

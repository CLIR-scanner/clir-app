# Closed Beta — FE 작업 인덱스

PBL 클로즈드 베타 v3 의 FE 측 구현. **각 task 는 독립적 atomic 단위 (1 PR = 1 task)** 로 설계됨. Codex / Claude Code 가 task 1개씩 받아 단독 실행·검증·PR 생성하는 흐름을 가정.

- 마감: **2026-05-04 (월) 17:00**
- 시장: **미국 단독** (locale 'en' 만)
- BE 측 작업: `clir-api/docs/tasks/closed-beta.md` (이미 구현 완료된 v3 기준)
- 기획 맥락: Notion "CLIR Closed Beta — 플랜 v3"
- 영양 분석은 v1 scope 외 (코드에 없음). 1탭 피드백 + 베타 진입 게이트 + disclaimer 만 추가.

---

## 의존성 그래프

```
F1 types         (독립)
  ├─▶ F2 services  (F1 의존)
  │     ├─▶ F3 SurveyLanding 게이트  (F1, F2)
  │     └─▶ F4 ScanFeedbackBar       (F1, F2)
  └─▶ F5 api-spec  (F1 의존, 문서)
F6 verification    (F1~F5 모두)
```

**최소 실행 순서**: F1 → F2 → (F3, F4, F5 병렬) → F6.

---

## Task 목록

| # | 파일 | 한 줄 요약 | 예상 작업 시간 |
|---|---|---|---|
| F1 | [F1-types.md](./F1-types.md) | `BetaCohort` / `WaitlistEntry.cohort: BetaCohort[]` / `User.betaCohort: BetaCohort[]` / `ScanResult.scanLogId` 타입 추가 | 15분 |
| F2 | [F2-services.md](./F2-services.md) | `auth.service.redeemInvite()` + `scan.service.submitScanFeedback()` + `fetchMe` betaCohort 매핑 | 30분 |
| F3 | [F3-survey-landing-gate.md](./F3-survey-landing-gate.md) | `SurveyLandingScreen` 에 invite 입력 박스 + disclaimer + scope notice 추가 | 1시간 |
| F4 | [F4-scan-feedback-bar.md](./F4-scan-feedback-bar.md) | `ScanFeedbackBar` 신규 컴포넌트 + `ScanScreen` / `OCRCaptureScreen` result sheet 통합 (ScanResultScreen 은 dead route 라 미사용) | 1시간 |
| F5 | [F5-api-spec.md](./F5-api-spec.md) | `CLIR/docs/api-spec.yaml` 에 베타 라우트 3개 + `UserProfile.betaCohort` 추가 | 30분 |
| F6 | [F6-verification.md](./F6-verification.md) | `npx tsc --noEmit` 통과, 수동 시나리오 6종 검증 | 30분 |

총 예상: ~3.5h. 두 사람이 (F1→F2)→F3 / F4 / F5 병렬로 1.5h 안에 가능.

---

## 공통 규칙 (모든 task 적용)

이 폴더의 task 를 수행할 때 다음을 *반드시* 준수:

1. **CLAUDE.md (`CLIR/CLAUDE.md`) 룰 준수**
   - 도메인 타입은 `src/types/index.ts` 한 파일에만 추가
   - `services/` 함수 시그니처 변경 금지 (신규 함수만 추가)
   - `apiFetch` / `apiFormFetch` 경유, `fetch` 직접 호출 금지
   - `ia.md` 에 없는 새 화면·`ParamList` 변경 금지 (기존 화면에 끼워넣기만)
   - `any` 금지 (`unknown` + 타입 가드)
   - `npx tsc --noEmit` 통과 필수
2. **i18n 미적용 (베타 v1)**: 6 로케일 i18n 채움은 v1.1 으로 deferred. 베타 v1 에서는 *예외적으로* 영어 inline 문자열 사용. CLAUDE.md "인라인 문자열 금지" 규칙은 v1.1 에서 정상화.
3. **CSS · 디자인 토큰**: 기존 화면(`SurveyLandingScreen`, `ScanResultScreen`)의 색상·폰트 톤 재사용. 신규 색상 도입 금지.
4. **DEV 자동 로그인 블록**: `src/store/user.store.ts` 의 DEV ONLY 블록은 *건드리지 말 것*. 담당자 A 작업 영역.
5. **에러 처리**: `apiFetch` 가 throw 하는 `ApiError` / `UnauthorizedError` 그대로 catch. 401 시 `clearAuthToken()` + `useUserStore.getState().logout()` + `navigation.reset` 패턴.

---

## 베타 v1 scope 한 줄 요약

> "FE 는 *베타 진입 게이트 + 영양 미지원 안내 disclaimer + 1탭 피드백 버튼* 3가지만 추가한다. 기존 verdict / 알러지·식이 매칭 / 멀티 프로필 / 건강검진 PDF / 6 로케일 성분 표시 등은 그대로 둔다."

---

## 참조

- BE task doc: `clir-api/docs/tasks/closed-beta.md` (v3, 구현 완료)
- BE 마이그레이션: `clir-api/db/migrations/0004_closed_beta.sql`
- BE 라우트:
  - `POST /waitlist` — 공개, rate limit 분당 5건, `cohort: BetaCohort[]` (단일 string 도 1개짜리 배열로 정규화)
  - `POST /auth/redeem-invite` — 인증, invite_code 검증 → profiles.beta_cohort 배열 저장
  - `POST /scan-logs/:id/feedback` — 인증, helpful boolean
  - `GET /auth/me` 응답에 `betaCohort: BetaCohort[] | null` 추가됨 (BE 0005 마이그레이션)
- 관측 SQL: `clir-api/docs/observability.md` 베타 메트릭 섹션 (6종 — HealthReport PDF 메트릭은 v3.1 에서 제외)

---

## 변경 이력

- v3.2 (2026-05-06): F1~F6 정합성 패치. (1) F3 의 "통째 교체" 를 *기존 215 줄 화면 위에 surgical patch* 로 재작성 — 기존 i18n / 언어 선택 블록 / `submitSurvey` skip 동기화 / strict Nav·Route 타입 보존. (2) F4 통합 위치를 `ScanResultScreen` (dead route — `navigate('ScanResult', ...)` 호출 0건) 에서 `ScanScreen` + `OCRCaptureScreen` 의 result sheet 로 재타겟. scanLogId 는 sheet state 로 보관. (3) F4 컴포넌트 catch 가 `UnauthorizedError` 만 재던지도록 수정 (CLAUDE.md "401 처리 패턴" 준수). (4) F2 의 `MeResponse`/`fetchMe` diff context 가 실 코드의 `language?: string` / `language: res.language ?? DEFAULT_LANGUAGE` 와 정렬되도록 갱신.
- v3.1 (2026-05-06): BE cohort 복수 선택 (`text` → `text[]`, 마이그레이션 0005) 반영. 모든 task 문서에서 `BetaCohort` → `BetaCohort[]`. 관측 SQL 7종 → 6종 (HealthReport PDF 메트릭 제거).
- v3 (2026-05-02): 신규 작성 — 단일 doc 에서 task 별 분리 폴더로 재구성. i18n 6 로케일 deferred.

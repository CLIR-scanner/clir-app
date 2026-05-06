# F6 — 통합 검증 (tsc + 수동 시나리오)

**의존**: F1~F5 모두 완료
**산출**: 검증 보고서 (PR description 또는 별도 문서)
**예상 시간**: 30분
**검증**: 본 문서가 *검증* 단계라 추가 검증 X

---

## 자동 검증

### A. TypeScript

```bash
cd CLIR
npx tsc --noEmit
# exit 0, 베타 관련 새 에러 0건
```

```bash
cd ../clir-api
npx tsc --noEmit
npm run build
# 둘 다 exit 0
```

### B. yaml 문법

```bash
cd CLIR
python3 -c "import yaml; yaml.safe_load(open('docs/api-spec.yaml'))" && echo "yaml OK"
cd ../clir-api
python3 -c "import yaml; yaml.safe_load(open('docs/api-spec.yaml'))" && echo "yaml OK"
```

### C. BE smoke (사전조건: BE 서버 가동 + Supabase JWT TOKEN 확보)

```bash
BASE=http://localhost:3000

# 1) waitlist 등록 (cohort 배열 또는 단일 string 모두 허용)
curl -s -X POST $BASE/waitlist \
  -H 'content-type: application/json' \
  -d '{"email":"smoke@example.com","cohort":["us-allergy","us-veg"],"source":"smoke"}' | jq
# → { ok: true } (201)

# 2) waitlist row 에 invite_code 채우기 (Supabase SQL editor 1회)
# UPDATE waitlist SET invite_code = 'abc1234567', invited_at = now()
# WHERE email = 'smoke@example.com';

# 3) redeem-invite (정답) — cohort 는 항상 배열
curl -s -X POST $BASE/auth/redeem-invite \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"inviteCode":"abc1234567"}' | jq
# → { ok: true, cohort: ["us-allergy","us-veg"] }

# 4) redeem 멱등성
curl -s -X POST $BASE/auth/redeem-invite \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"inviteCode":"abc1234567"}' | jq
# → { ok: true, cohort: ["us-allergy","us-veg"], alreadyRedeemed: true }

# 5) auth/me 응답에 betaCohort 배열 포함
curl -s $BASE/auth/me -H "authorization: Bearer $TOKEN" | jq .betaCohort
# → ["us-allergy","us-veg"]

# 6) scan-logs/feedback (사전: 본인 user 의 scan_log 1건 있어야 함)
SCAN_LOG_ID=$(curl -s $BASE/scan-history -H "authorization: Bearer $TOKEN" | jq -r '.[0].scanLogId')
curl -s -X POST $BASE/scan-logs/$SCAN_LOG_ID/feedback \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"helpful":true}' | jq
# → { ok: true }
```

---

## 수동 시나리오 (FE 디바이스/시뮬레이터)

```bash
cd CLIR
npx expo start
# QR 스캔 또는 i / a 키로 시뮬레이터
```

### 시나리오 1: 베타 invite 게이트 — 정상 흐름

1. (DEV ONLY 자동 로그인 비활성화 상태에서) social login
2. SurveyLanding 진입 시 "Beta Invite Code" 박스 노출
3. "abc12" 입력 → Verify 버튼 비활성 (6자 미만)
4. "abc1234567" 입력 → Verify 활성
5. Verify → 잘못된 코드면 "Invalid invite code..." 메시지
6. 정답 입력 → "Code verified! You're in." + Continue 활성
7. Continue → Survey 진입

### 시나리오 2: 이미 redeem 한 사용자

1. 시나리오 1 완료 후 앱 재시작
2. SurveyLanding 진입 → invite 박스 안 보임 (betaCohort 채워져 있음)
3. Continue 바로 활성

### 시나리오 3: DEV / 멀티 프로필 모드

1. DEV ONLY 자동 로그인 활성 또는 멀티프로필 추가 흐름 진입
2. invite 박스 안 보임 → 정상 흐름

### 시나리오 4: SurveyLanding 하단 안내

1. SurveyLanding 진입 (모드 무관)
2. footer 위 두 줄 텍스트 노출:
   - "Currently we focus on allergen and dietary preference matching only..."
   - "This app is for informational purposes only and is not medical advice..."

### 시나리오 5: ScanResult 피드백 (scanLogId 없음 — 현재 흐름)

1. 검색 결과 → 제품 탭 → ScanResult 진입
2. verdict 표시. 피드백 영역 *안 보임* (scanLogId 없음 → null)

### 시나리오 6: ScanResult 피드백 (scanLogId 전달 — 향후 OCR 통합 후)

1. OCR 흐름이 `navigation.navigate('ScanResult', { ..., scanLogId })` 로 갱신된 후
2. ScanResult 에 verdict 카드 + 그 아래 👍 / 👎 버튼
3. 👍 클릭 → 즉시 비활성 + "Thanks for the feedback"
4. Supabase 에서 `select helpful from scan_logs where id = '...'` → true

---

## 검증 보고서 템플릿 (PR description 에 붙일 것)

```markdown
## Closed Beta v1 — FE 통합 검증

### 자동 검증
- [ ] CLIR `npx tsc --noEmit` 통과
- [ ] clir-api `npx tsc --noEmit` + `npm run build` 통과
- [ ] api-spec.yaml 양쪽 yaml.safe_load 통과
- [ ] BE smoke 6 단계 통과 (waitlist / invite redeem / 멱등 / auth.me / feedback)

### 수동 시나리오
- [ ] 시나리오 1: invite 게이트 정상 흐름
- [ ] 시나리오 2: 이미 redeem 시 게이트 안 보임
- [ ] 시나리오 3: DEV / 멀티 프로필 자동 통과
- [ ] 시나리오 4: SurveyLanding 하단 안내 노출
- [ ] 시나리오 5: ScanResult scanLogId 없으면 피드백 영역 숨김
- [ ] 시나리오 6: scanLogId 있으면 피드백 버튼 동작 (현재 OCR 미통합 상태에서는 deferred)

### 알려진 한계
- i18n 6 로케일 미적용 (v1.1 deferred — `closed-beta/README.md` 공통 규칙 #2)
- ScanResult 피드백 버튼은 OCR 흐름이 scanLogId 를 전달하도록 갱신되기 전까지 비표시
- DEV ONLY 자동 로그인 블록 활성 상태에서는 invite 게이트 자동 우회 (의도된 동작)
```

---

## 회귀 점검

베타 v1 에 영향받는 기존 흐름이 깨지지 않았는지:

- [ ] 검색 → 제품 탭 → ScanResult (scanLogId 없는 경로) 정상 동작
- [ ] 멀티 프로필 추가 흐름 정상 동작 (SurveyLanding 통과)
- [ ] DEV ONLY 자동 로그인 환경에서 메인 탭 진입 가능
- [ ] 기존 social login → Survey 완료된 사용자 재로그인 시 메인 탭 직행

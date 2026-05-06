# F5 — api-spec.yaml 갱신

**의존**: F1 (BetaCohort 타입 — 명세에 enum 으로 같이 들어감)
**산출**: `CLIR/docs/api-spec.yaml` 수정
**예상 시간**: 30분
**검증**: yaml 문법 체크 + BE 측 spec (`clir-api/docs/api-spec.yaml`) 과 정렬 확인

---

## 무엇을 만드는가

FE `docs/api-spec.yaml` 에 베타 v1 신규 라우트 3개와 `UserProfile.betaCohort` 필드를 추가한다. **BE 측 spec (`clir-api/docs/api-spec.yaml`) 과 1:1 매칭** 되어야 함 — BE 는 v3 에서 이미 추가됨.

---

## 변경 1: `UserProfile` 스키마에 `betaCohort` 추가

위치: `components.schemas.UserProfile.properties` 의 `hasCompletedSurvey` 직후.

```diff
         hasCompletedSurvey:
           type: boolean
           example: true
+        betaCohort:
+          type: array
+          nullable: true
+          items:
+            type: string
+            enum: [us-allergy, us-ka, us-veg]
+          minItems: 1
+          description: 베타 코호트 배열. null = 미통과 또는 일반 사용자. 0005 마이그레이션으로 단일 → 배열.
+          example: [us-allergy, us-veg]
```

---

## 변경 2: 신규 paths 3개 추가

위치: `paths:` 블록 끝 (마지막 path 다음, `components:` 직전). 들여쓰기 2 칸.

```yaml
  # ─────────────────────────────────────
  # 클로즈드 베타 (v3)
  # ─────────────────────────────────────

  /waitlist:
    post:
      tags: [Beta]
      summary: 베타 waitlist 등록 (공개)
      description: |
        클로즈드 베타 진입 funnel 의 시작점. 인증 불필요.
        IP 당 분당 5건 rate limit. 동일 email 재요청은 멱등.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, cohort]
              properties:
                email: { type: string, format: email, maxLength: 254 }
                cohort:
                  type: array
                  items: { type: string, enum: [us-allergy, us-ka, us-veg] }
                  minItems: 1
                  example: [us-allergy, us-veg]
                  description: 1개 이상 복수 선택. 단일 string 도 허용 (구버전 클라 호환, 1개짜리 배열로 정규화).
                source: { type: string, maxLength: 64 }
                locale:
                  type: string
                  enum: [en, ko, ja, zh, es, fr]
                  default: en
      responses:
        '201': { description: 신규 등록 }
        '200': { description: 이미 등록된 email }
        '400': { $ref: '#/components/responses/BadRequest' }
        '429': { description: Rate limit 초과 }

  /auth/redeem-invite:
    post:
      tags: [Beta]
      summary: 베타 invite_code 사용
      description: |
        social login 후 첫 진입 시 호출. waitlist.invite_code 매칭 →
        profiles.beta_cohort 채움. 멱등.
      security: [{ BearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [inviteCode]
              properties:
                inviteCode: { type: string, minLength: 6, maxLength: 64 }
      responses:
        '200':
          description: redeem 성공 또는 이미 redeem
          content:
            application/json:
              schema:
                type: object
                required: [ok, cohort]
                properties:
                  ok: { type: boolean }
                  cohort:
                    type: array
                    items: { type: string, enum: [us-allergy, us-ka, us-veg] }
                    minItems: 1
                  alreadyRedeemed: { type: boolean }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { description: 유효하지 않은 invite code }

  /scan-logs/{scanLogId}/feedback:
    post:
      tags: [Beta]
      summary: 1탭 피드백 (helpful 기록)
      description: |
        ScanResult 화면에서 사용자가 👍/👎 선택 시 호출. 본인 row 만 수정 가능.
        멱등. 응답에 comment echo 안 함.
      security: [{ BearerAuth: [] }]
      parameters:
        - name: scanLogId
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [helpful]
              properties:
                helpful: { type: boolean }
                comment: { type: string, maxLength: 500 }
      responses:
        '200': { description: 피드백 저장 }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '404': { description: 본인 scan_log 가 없거나 미존재 }
```

---

## 검증

```bash
cd CLIR
# yaml 문법
python3 -c "import yaml; yaml.safe_load(open('docs/api-spec.yaml'))" && echo "yaml OK"

# BE 와 정렬 확인 (베타 라우트 동일)
diff <(grep -A 3 "betaCohort\|/waitlist\|redeem-invite\|scan-logs.*feedback" docs/api-spec.yaml) \
     <(grep -A 3 "betaCohort\|/waitlist\|redeem-invite\|scan-logs.*feedback" ../clir-api/docs/api-spec.yaml)
# (응답 예시 포맷 차이 정도는 OK, 라우트·body·응답 코드는 동일)
```

---

## 하지 말 것

- 응답 200 의 `alreadyRedeemed` 를 required 로 (기본 omit, redeem 1회차에는 없음)
- `cohort` 가 `null` 이 될 수 있게 표기 (성공 응답에서는 항상 cohort 배열 채워짐, minItems 1)
- `cohort` 를 단일 string 으로 정의 (BE 0005 마이그레이션 이후 항상 배열)
- `/waitlist` 에 인증 추가 (공개여야 funnel 의미 있음)
- `/scan-logs/{id}/feedback` 응답에 `comment` echo (XSS — BE 가 절대 echo 안 함)
- BE spec 과 다른 enum 값 (반드시 `us-allergy | us-ka | us-veg`)

---

## 완료 판단

```bash
cd CLIR
python3 -c "import yaml; yaml.safe_load(open('docs/api-spec.yaml'))" && echo OK
grep -c "us-allergy\|us-ka\|us-veg" docs/api-spec.yaml
# ≥ 6 (cohort enum 들 + UserProfile.betaCohort enum)
```

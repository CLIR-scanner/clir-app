# CLIR Architecture (Full Product)

식품 바코드/OCR 스캔 → 성분 분석 → 사용자 알러지·식이 프로필 대조 → 개인화 위협 판정.
이 문서는 FE·BE·명세의 구현 구조를 한 파일에서 파악하기 위한 참조 문서다. 세부 규칙은 각 서브 프로젝트의 `CLAUDE.md`를 따르고, OCR 파이프라인 상세는 `docs/ocr-pipeline-rebuild-guide.md`를 따른다.

> **MVP 종료**. 이 문서는 앱스토어 배포를 전제로 한 Full Product 기준이다.
> 런타임은 **Expo Dev Client**가 기본이며, Expo Go는 개발 편의 수단이다.

---

## 1. 레포 레이아웃

```
CLIR_demo/
├── CLIR/            React Native 앱 (Expo SDK 54 + Dev Client + RN 0.81)
├── clir-api/        Fastify API 서버 (Node 20 · Supabase · OpenAI · Google Vision · Redis)
├── docs/
│   ├── ia.md                         화면 구조 / 탭          ← 화면 변경 전 필독
│   ├── api-spec.yaml                 API 계약서              ← 코드 수정 전 필독
│   ├── ocr-pipeline-rebuild-guide.md OCR 파이프라인 Full Product 명세
│   ├── backend-impl.md (legacy)      Phase 1–3/5/6은 유효, Phase 4는 rebuild guide로 대체
│   ├── backend-us.md (legacy)        Supabase 스키마 원본
│   └── architecture.md (이 문서)
├── team/            역할별 CLAUDE.md 원본 + 온보딩
└── tasks/           작업 목록 / 셋업 가이드 / 파이프라인 태스크
```

---

## 2. Source of Truth (Contract-First)

| 계약 문서 | 역할 | 변경 순서 |
|---|---|---|
| `docs/api-spec.yaml` | API 요청/응답/에러코드/SSE 이벤트 | 명세 수정 → 공유 → FE/BE 반영 |
| `docs/ia.md` | 화면·네비게이션 | 명세 수정 → FE 반영 |
| `docs/ocr-pipeline-rebuild-guide.md` | OCR 파이프라인 단일 출처 | 이 문서와 충돌 시 rebuild guide가 우선 |
| `CLIR/src/types/index.ts` ↔ `clir-api/src/types/index.ts` | 도메인 타입 (동일 shape) | `api-spec.yaml` 먼저 수정 후 양쪽 동기화 |

명세에 없는 필드·엔드포인트·에러코드·화면을 임의로 추가하지 않는다.

---

## 3. 시스템 다이어그램

```
┌─────────── FE (CLIR/) ───────────────────────┐  SSE/HTTP  ┌──────── BE (clir-api/) ───────────┐
│ screens/ ─▶ services/ ─▶ lib/api.ts          │ ─────────▶ │ routes/ ─▶ services/ ─▶ lib/      │
│   UI        시그니처 고정  apiFetch·sse       │ Bearer JWT │  schema 검증   비즈 로직  외부     │
│                                              │            │                                    │
│ lib/ (캡처·품질·캐시)                          │            │ Supabase (Auth + PostgreSQL)       │
│   document-scanner · vision-camera           │            │   + scan_logs + ocr_review_queue   │
│   onDeviceOCR · phashCache (MMKV) · sse      │            │ Redis (pHash 캐시, BK-tree)        │
│                                              │            │ OpenAI (gpt-4o-mini / gpt-4o /     │
│ store/ (user · scan · list)                  │            │         gpt-4.1-mini)              │
│ constants/ · i18n/ · types/index.ts          │            │ Google Vision (2단계 폴백)          │
│                                              │            │ Open Food Facts (바코드 폴백)       │
│ Sentry (FE)                                  │            │ Sentry (BE) + 비용 대시보드          │
└──────────────────────────────────────────────┘            └────────────────────────────────────┘
```

**캐싱 3계층** (상세 `ocr-pipeline-rebuild-guide.md §5`):

```
L1 FE MMKV pHash        ~5–10% 히트
L2 바코드 → Supabase/OFF ~30–60% 히트 (EU 기준)
L3 BE Redis pHash        ~15–25% 히트 (출시 3개월 후)
```

**폴백 사다리** (상세 `ocr-pipeline-rebuild-guide.md §4.2`):
`gpt-4o-mini → 재전처리 재시도 → gpt-4o → Google Vision + gpt-4.1-mini → 휴먼 리뷰 큐`

**인증 플로우**: Supabase Auth 토큰 → FE `setAuthToken()` → `lib/api.ts`가 `Authorization: Bearer` 자동 주입 → BE `plugins/auth.ts`(preHandler)가 `supabase.auth.getUser()`로 검증 → `request.userId` 주입.

---

## 4. FE 구조 — `CLIR/src/`

```
screens/      auth/ scan/ search/ list/ recommend/ profile/ home/
                scan/ 내부:
                  ScanScreen · OCRCaptureScreen · ScanResultScreen
                  ScanHistoryScreen · HistoryProductDetailScreen
                  IngredientCorrectionScreen (신규 — 유저 교정)
navigation/   Root → Auth | Main(Tab) → Scan · Search · List · Recommend · Profile Stack
services/     auth · user · scan · list · recommend · search   ← 시그니처 고정
              corrections (신규)
store/        user · scan · list                               ← 새 스토어 추가 금지
lib/
  api.ts          apiFetch · apiFormFetch · apiEventStream · setAuthToken · UnauthorizedError
  supabase.ts     Supabase 클라
  sse.ts          EventSource 래퍼 (react-native-sse)
  phashCache.ts   MMKV LRU 500건 · schema_version 키
  onDeviceOCR.ts  expo-text-extractor 래퍼
  imageResize.ts  장변 1024px JPEG 0.85
  captureGate.ts  vision-camera 프레임 프로세서 (Laplacian · meanStdDev)
  imageQuality.ts (폴백) Expo Go 빌드용 Skia 캡처 후 게이트
  sentry.ts       Sentry init + 태그
constants/    colors · strings · risk · allergyData            ← 하드코딩 금지
i18n/         en · ko · ja · zh · es · fr (+ index)
types/index.ts  모든 도메인 타입 단일 파일
```

### 상태 관리 (Zustand — 세 스토어 고정)

| Store | 보관 | 주요 액션 |
|---|---|---|
| `user.store` | currentUser · activeProfile · multiProfiles · consentFlags | initialize · setUser · logout · switchProfile · updateActiveProfile · setLanguage · setConsent |
| `scan.store` | history | setHistory · addHistory · clearHistory |
| `list.store` | favorites · shoppingItems | add/remove favorite · add/remove shoppingItem · togglePurchased |

### 네비게이션 ParamList (요약 — 세부는 `types/index.ts`)

```
RootStack         Auth | Main
AuthStack         Splash · AuthHome · Survey · SurveyAllergy* · SurveyVegetarian* · SurveyDietConfirm
MainTab           HomeTab · ScanTab · SearchTab · ListTab · RecommendTab · ProfileTab
ScanStack         Scan · ScanResult · ScanHistory · HistoryProductDetail · OCRCapture
                  · IngredientCorrection (신규)
SearchStack       Search · SearchResult
ListStack         List · Favorites(+Memo·ScanLog·All) · Shopping(+Items·Purchase) · HistoryProductDetail
RecommendStack    Recommend · WeekendPopular · SimilarUsersFavorites
ProfileStack      Profile · Personal* · Personalization* · MultiProfile* · Language · Settings*
                  · PrivacyConsent · DataExport · DataDelete (신규)
```

### 캡처 경로 (상세 `ocr-pipeline-rebuild-guide.md §3`)

```
기본(Dev Client):   네이티브 문서 스캐너 → 실시간 블러 프리뷰 → 촬영
폴백(Expo Go 빌드): expo-camera → Skia 캡처 후 품질 게이트
```

### 화면 구현 레퍼런스
신규 화면은 `src/screens/scan/ScanResultScreen.tsx`의 패턴을 따른다 — 서비스 호출(`useEffect` + `async/await`), 로딩/에러 `useState`, Zustand 접근, `useRoute`/`useNavigation`, 401 catch.

---

## 5. BE 구조 — `clir-api/src/`

```
index.ts          Fastify 생성 · 플러그인 · listen · sharp.cache · undici Agent
lib/
  supabase.ts       service role 클라
  auth.ts           verifyToken preHandler
  safety.ts         위험도 판정 공용 함수
  allergen-utils.ts 알러겐 키워드 매핑
  openai.ts         OpenAI 클라이언트 (undici Agent 공유)
  http.ts           undici Agent (keep-alive 30s, conn 128)
  redis.ts          ioredis 클라이언트
  phashCache.ts     Redis pHash 캐시 + BK-tree 인덱스
  imagePreprocess.ts sharp 파이프라인 (rotate · resize · CLAHE · unsharp · JPEG 4:4:4)
  ocrSchema.ts      Zod 스키마 (LabelExtraction · OcrIngredient)
  ocrPrompt.ts      시스템 프롬프트 (버전 관리)
  ocrMapper.ts      LabelExtraction → OCRResult 매퍼 (FE 타입 경계)
  fallbackLadder.ts 5단계 폴백 오케스트레이션
  sentry.ts         Sentry init + 스캔 태그
  cost.ts           토큰/호출 비용 집계 → scan_logs.est_cost_usd
plugins/
  auth.ts           JWT 검증 preHandler → request.userId 주입
  sse.ts            fastify-sse-v2 등록
routes/             auth · products · ocr · analysis · ingredients · scan-history · favorites
                    corrections (신규) · admin/review-queue (신규) · users (me/export/delete)
services/
  product.service.ts       Supabase → OFF 폴백 → pHash 이웃 조회
  off.service.ts           Open Food Facts
  vision.service.ts        OpenAI 호출 (Structured Outputs)
  google-vision.service.ts Google Vision 2단계 폴백
  translation.service.ts   성분명 다국어 LLM 번역
  product-upsert.service.ts OCR 결과 → products 업서트 (pHash + 성분셋 Jaccard)
  scan-log.service.ts      scan_logs insert
  fdc.service.ts           USDA FDC (legacy)
types/index.ts    FE와 동일 shape
```

### 주요 엔드포인트 (`docs/api-spec.yaml` 기준)

```
POST /auth/signup · /auth/login · /auth/survey · /auth/me
GET  /products/:barcode           · /products/:id/alternatives
POST /ocr                         (multipart, SSE 기본 / JSON 폴백)
POST /analysis                    (ingredientIds + profile → verdict)
GET  /ingredients/:id
POST /scan-history · GET /scan-history
POST /favorites    · GET /favorites · DELETE /favorites/:id
POST /corrections                 (유저 교정 제출, 동의 flag 필수)
GET  /admin/review-queue          (관리자 토큰)
GET  /users/me/export · DELETE /users/me   (GDPR)
```

### 제품 조회 폴백 체인
```
GET /products/:barcode
  1) Supabase products 테이블 (barcode UNIQUE)
  2) Open Food Facts API
  3) 없으면 404 PRODUCT_NOT_FOUND

POST /ocr 내부 (pHash 기반)
  1) Redis 서버 pHash 캐시 (해밍 ≤ 6)
  2) Supabase products.phash 이웃 조회 → 기존 레코드 재사용
  3) 없으면 추출 파이프라인 → 성공 시 products 업서트
```

### 위험도 판정 (`services/analysis`)
```
triggered  = ingredients ∩ user.allergyProfile
mayContain = ingredients.relatedAllergenId ∩ user.allergyProfile

verdict = triggered.length > 0                                ? 'danger'
        : mayContain.length > 0 && sensitivity === 'strict'   ? 'caution'
                                                              : 'safe'
```

### 에러 응답 (고정 포맷)
```
{ error: 'UPPER_SNAKE', message: string }
```
표준 코드: `EMAIL_ALREADY_EXISTS · INVALID_INPUT · INVALID_CREDENTIALS · UNAUTHORIZED · PRODUCT_NOT_FOUND · OCR_FAILED · OCR_UNREADABLE · INGREDIENT_NOT_FOUND · ALREADY_FAVORITED · FAVORITE_NOT_FOUND · CORRECTION_CONSENT_REQUIRED`

### Supabase 테이블
```
profiles(id PK→auth.users, name, allergy_profile text[], dietary_restrictions text[],
         sensitivity_level, language, consent_image_retention bool default false)
products(id PK, barcode UNIQUE NULLABLE, name, brand, image, ingredients jsonb,
         phash text, source text CHECK (source IN ('seed','off','ocr')), scan_count int)
  INDEX idx_products_phash ON products USING hash(phash)
scan_history(id, user_id, product_id NULLABLE, result, scanned_at, ocr_extraction jsonb NULLABLE)
favorites(id, user_id, product_id, added_at, UNIQUE(user_id, product_id))
scan_logs(id, user_id NULLABLE, phash, model, prompt_version, schema_version,
          extraction jsonb, user_corrections jsonb NULLABLE, latency_ms, cache_hit,
          ladder_stage int, est_cost_usd numeric, created_at)
ocr_review_queue(id, phash, image_ref NULLABLE, last_extraction jsonb, reason, created_at)
corrections(id, user_id, scan_log_id FK, corrected_ingredients jsonb, created_at)
```

---

## 6. 도메인 타입 (FE · BE 동일 shape)

```ts
RiskLevel        = 'safe' | 'caution' | 'danger'
SensitivityLevel = 'strict' | 'normal'
DataCompleteness = 'complete' | 'partial' | 'not_found'
BCP47            = string  // 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | ...

Ingredient      { id, name, nameKo, description, riskLevel, sources[], relatedAllergenId? }
IngredientSummary { id, name, nameKo, confidence? }
                // Full product 마이그레이션 목표: translations: Record<BCP47, string>
                // 전환은 단계적 (rebuild guide §10.2)
Product         { id, barcode?, name, brand, ingredients[], isSafe, riskLevel,
                  riskIngredients[], mayContainIngredients[], alternatives[],
                  dataCompleteness?, phash? }
Profile / User  { allergyProfile[], dietaryRestrictions[], sensitivityLevel,
                  language, multiProfiles[], consentFlags: { imageRetention: boolean } }
ScanHistory / FavoriteItem / ShoppingItem
OCRResult       { extractedText, ingredients[], overallConfidence, illegibleRegions,
                  detectedLanguages[], productId? }
AnalysisResult  { verdict, isSafe, triggeredBy[], safeIngredients[], dataCompleteness }
ScanLog         { id, phash, model, promptVersion, schemaVersion, extraction,
                  userCorrections?, latencyMs, cacheHit, ladderStage, createdAt }
Correction      { ingredientId, originalName, correctedName, userId?, createdAt }
```

Zod 스키마(`LabelExtraction`, `OcrIngredient`)는 BE 내부 추출 단계 전용이며 `types/index.ts`에 노출하지 않는다. 외부 경계는 `OCRResult`.

---

## 7. 개발 / 검증 / 배포

### 로컬 개발

```bash
# FE — Dev Client 기본
cd CLIR
npx expo install <pkg>                 # npm install 금지
npx expo prebuild                      # 최초 1회 (ios/android 생성)
npx expo run:ios                       # Mac + Xcode 필요
npx expo run:android                   # Android Studio 필요
npx tsc --noEmit                       # .ts/.tsx 수정 후 필수

# FE — Expo Go 폴백 (기능 제한)
npx expo start
# captureGate.ts가 USE_NATIVE_CAPTURE=false 분기로 Skia 게이트 사용

# BE
cd clir-api && npm run dev
curl http://localhost:3000/health
```

### 환경 변수

FE `.env`:
```
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_SUPABASE_URL · EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_SCHEMA_VERSION         # 캐시 키 버전
EXPO_PUBLIC_USE_NATIVE_CAPTURE     # 'true' | 'false' (Expo Go 폴백 분기)
```

BE `.env`:
```
PORT · NODE_ENV
SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GOOGLE_APPLICATION_CREDENTIALS     # 2단계 폴백용
REDIS_URL
SENTRY_DSN
SCHEMA_VERSION · PROMPT_VERSION    # 캐시 무효화 + 로깅
OFF_USER_AGENT
```

배포 BE: `https://focused-imagination-production-49c9.up.railway.app`

### EAS Build · OTA

```bash
eas build --platform all --profile preview         # 내부 테스트
eas build --platform all --profile production      # 스토어 배포
eas update --branch production                     # JS-only OTA
```

- OTA 가능: JS·자산·`SCHEMA_VERSION` 변경
- EAS Build 필요: 네이티브 의존성 변경 (vision-camera 버전 업 등)
- OCR 프롬프트 변경은 BE 단독 배포로 반영 (FE 재빌드 불필요)

---

## 8. 공통 금지 규칙 (Full Product 개편)

### 유지되는 금지

- `any` 사용 (필요 시 `unknown` + 타입 가드)
- `src/types/index.ts` 외부에 **도메인 타입** 정의
  (예외: FE 유틸 전용 타입 `QualityCheckResult` 등은 유틸 파일 내부 허용. BE Zod 스키마는 `lib/ocrSchema.ts` 내부 전용이고 외부 노출 금지)
- `api-spec.yaml`에 없는 요청/응답·에러코드 임의 구현
- `ia.md`에 없는 화면·경로 임의 추가
- 환경변수 하드코딩 / `.env` 커밋 / **service role key의 FE 노출**
- API URL 하드코딩 (반드시 `lib/api.ts` 경유)
- 화면 컴포넌트에서 `src/mocks/` 직접 import (반드시 `services/` 경유)
- `services/` 함수 시그니처 변경 (구현부만 교체)
- 에러 응답 `{ error, message }` 외 포맷
- **스캔 이미지를 사용자 동의 없이 영구 저장** — §12.1 참조

### MVP에서 금지였으나 Full Product에서 해제

| 항목 | 조건 |
|---|---|
| `react-native-vision-camera` | Dev Client 빌드에서 허용 (기본 캡처 경로) |
| `react-native-document-scanner-plugin` | Dev Client 빌드에서 허용 (기본 캡처 경로) |
| `expo-text-extractor` (온디바이스 OCR) | Dev Client 빌드에서 허용 |
| `react-native-mmkv` | 로컬 pHash 캐시에 한해 허용 |
| `@google-cloud/vision` (BE) | 폴백 사다리 4단계 전용 |
| `/ocr` 응답 SSE 스트리밍 | 기본 채택 (`Accept: text/event-stream`) |

### 신규 금지 (Full Product에서 추가)

- **Sentry 미연동 배포**: `sentry.ts` init이 빠진 상태로 `eas build --profile production` 금지
- **`SCHEMA_VERSION` / `PROMPT_VERSION` 미설정**: 캐시 키가 버전 없이 생성되면 프롬프트 변경 후 오염된 캐시가 영구 히트. CI에서 환경변수 검사
- **OCR 제품 즐겨찾기 저장 시 로컬 store 회피 사용**: `product-upsert.service.ts`를 반드시 경유해 `product_id`를 확보한 뒤 저장. FK violation 무시 패턴 금지
- **개인정보 동의 없이 교정 데이터 저장**: `POST /corrections`는 `consentFlags.imageRetention` 또는 별도 `consent:corrections` true일 때만 기록
- **`Strings.ocrQuality.*` 미경유 UX 문구**: 재촬영/저신뢰 경고는 반드시 i18n 키 사용. 인라인 문자열 금지

**FE 전용 세부**: `CLIR/CLAUDE.md` — `react-native-vision-camera`는 허용되지만 **반드시 Dev Client 빌드**에서만 동작. Expo Go 감지 시 자동으로 `imageQuality.ts` 폴백.
**BE 전용 세부**: `team/be/CLAUDE.md` — 1차 추출은 항상 OpenAI. Google Vision은 `fallbackLadder.ts`의 4단계에서만 호출.

---

## 9. 관측성 / 비용 SLO

상세: `docs/ocr-pipeline-rebuild-guide.md §8`.

### 9.1 Sentry 태그 규약

모든 OCR 이벤트에 다음 태그를 붙인다:
```
stage:       'ocr-capture' | 'ocr-upload' | 'ocr-ladder-N' | 'ocr-cache'
ladder:      '1'..'5'
cache:       'l1-hit' | 'l2-hit' | 'l3-hit' | 'miss'
lang:        <detected_primary>
schema_ver:  <SCHEMA_VERSION>
```

### 9.2 비용 대시보드

Supabase view `scan_cost_daily` (SQL은 rebuild guide §8.2). Grafana 또는 Supabase 내장 차트로 시각화.

### 9.3 SLO (단일 출처: `ocr-pipeline-rebuild-guide.md §8.3`)

| 지표 | 목표 | 비상 임계 |
|---|---|---|
| 스캔당 비용 | ≤ $0.001 | > $0.003 |
| L3 캐시 히트율 | ≥ 30% (3개월 후) | < 10% |
| p95 지연 | ≤ 2.5s | > 5s |
| 성분 F1 | ≥ 0.90 | < 0.80 |
| 5xx 에러율 | ≤ 1% | > 3% |

비상 임계 초과 시 Slack 알림 + 릴리스 차단.

---

## 10. 데이터 플라이휠

상세: `docs/ocr-pipeline-rebuild-guide.md §7`.

```
ScanLog (Supabase scan_logs)
  └─▶ 유저 교정 (POST /corrections) ─▶ Supabase corrections
       └─▶ 주 1회 배치 ─▶ eval/candidates/ ─▶ 수동 승인 ─▶ 골드 세트 500개
              └─▶ CI 오프라인 평가 (F1/CER/WER/p95/비용)
                   └─▶ 회귀 > 2% ─▶ 머지 차단
```

- 골드 세트 위치: `clir-api/eval/goldset/*.json`
- 러너: `clir-api/eval/run.ts`
- GitHub Actions: PR마다 실행, 야간 전체 리포트 Slack

---

## 11. 배포

상세: `docs/ocr-pipeline-rebuild-guide.md §11`.

- 빌드: **EAS Build** (`preview` / `production` 채널)
- 업데이트: **EAS Update** — JS·자산 OTA
- 스토어: App Store Connect + Google Play
- 프라이버시 정책 URL 필수 (§12 참조)
- BE: Railway (기존 유지)

---

## 12. 개인정보 / 규제

상세: `docs/ocr-pipeline-rebuild-guide.md §9`.

### 12.1 이미지 보존

- 기본: BE 처리 직후 폐기. Redis에는 pHash + 추출 결과만
- 동의 시: Supabase Storage에 저장, 90일 후 자동 삭제
- 동의 UI: `/profile/personalization` 내 "스캔 이미지를 품질 개선에 사용" 토글 (기본 OFF)

### 12.2 데이터 레지던시

- EU 사용자 → EU 리전 Supabase + EU 리전 OpenAI
- 판별: `Accept-Language` + IP 지리정보
- 크로스 리전 전송 금지

### 12.3 사용자 권리 (GDPR)

- `GET /users/me/export` — 내 데이터 JSON
- `DELETE /users/me` — 계정 + 이력 + 교정 데이터 삭제 (30일 내 처리)

### 12.4 앱스토어 고지

App Store Connect의 "Data collected" · Google Play의 "Data safety"에 OpenAI · Google Cloud · Supabase 제3자 전송 명시.

---

## 13. 새 작업 체크리스트

1. 화면·엔드포인트·타입 변경이면 → `docs/ia.md` / `docs/api-spec.yaml` 먼저 확인·수정.
2. OCR 파이프라인 관련이면 → `docs/ocr-pipeline-rebuild-guide.md` 먼저 확인·수정. 이 문서와 충돌 시 rebuild guide가 우선.
3. 작업 대상 서브 프로젝트의 `CLAUDE.md` 로드 (`CLIR/` 또는 `clir-api/`).
4. 레퍼런스 패턴 따르기 — FE: `ScanResultScreen.tsx`, BE: 기존 `routes/*.ts`의 Fastify `schema`.
5. Sentry 태그 + scan_logs 기록 누락 없는지 확인 (§9.1).
6. 캐시 키에 `SCHEMA_VERSION` 포함 확인 (§8 신규 금지).
7. 완료 후 검증 — FE `npx tsc --noEmit`, BE `npm run dev` + `curl` + 오프라인 평가 `npm run eval`.

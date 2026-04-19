# OCR 파이프라인 — Frontend 작업 목록 (Full Product)

> **기준 문서**:
> - `docs/ocr-pipeline-rebuild-guide.md` — 파이프라인 단일 출처
> - `docs/architecture.md` — 구조·금지 규칙·타입
> - `docs/api-spec.yaml` v2.0.0 — API 계약 (SSE·corrections·GDPR)
> - `docs/ia.md` — 화면 구조
>
> **범위**: `CLIR/` (Expo SDK 54 + **Dev Client** 기본, Expo Go는 폴백)
> **목표**: 앱스토어 배포 가능 수준. MVP 범위(단일 모델 · Expo Go 단독 · SSE 없음)는 **종료**.
>
> 완료 형식: `- [x] 항목명 ✅ tsc: pass`
> 작업 순서는 위에서 아래로 고정. 선행 작업 완료 전 다음 단계 진행 금지.
> **관측성 skeleton(Step 0)은 다른 어떤 작업보다 먼저.** 데이터 없이 튜닝 없다.

---

## 전제조건 (BE / 명세 선행)

FE 작업 시작 전 아래가 완료되어 있어야 한다. 미완 시 해당 단계의 tsc / 실기기 검증이 실패한다.

- [ ] `docs/api-spec.yaml` v2.0.0 머지 — SSE 기본 · `POST /corrections` · `GET /users/me/export` · `DELETE /users/me` · `OCRResult` 확장 · `IngredientSummary.confidence?`
- [ ] `docs/architecture.md` Full Product 개편 머지 — §8 금지 규칙 갱신, Dev Client 전제 명시
- [ ] BE Step 1–6 (`tasks/ocr-pipeline-backend.md` 기준) — Sentry / Structured Outputs / sharp / SSE / Redis pHash / 제품 업서트. Step 7 이후 FE 통합 테스트 가능
- [ ] Supabase `profiles.consent_image_retention`, `scan_logs`, `corrections`, `ocr_review_queue` 테이블 마이그레이션

---

## Step 0 — 관측성 skeleton (최우선)

`rebuild-guide §8` / `architecture §9`. **이 단계 없이 이후 단계 시작 금지.**

- [ ] `npx expo install sentry-expo @sentry/react-native` (Dev Client 필요 — Step 2 병행 가능하나 init 코드는 Step 0에서 끝)
- [ ] `src/lib/sentry.ts` 신규 — `initSentry()`, `tagScan(stage, ladder, cache, lang, schemaVer)` export
- [ ] `App.tsx`에서 `initSentry()` 최상단 호출
- [ ] `.env` 키 추가: `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SCHEMA_VERSION`, `EXPO_PUBLIC_USE_NATIVE_CAPTURE`
- [ ] `app.json` (또는 `app.config.ts`)에 Sentry Expo 플러그인 등록
- [ ] DSN 미설정 환경(로컬)에서 init이 no-op으로 동작하는지 확인
- [ ] `npx tsc --noEmit` 통과

---

## Step 1 — 타입 동기화 (`src/types/index.ts`)

`api-spec.yaml` v2.0.0과 동일 shape. BE 타입과 **같은 PR 또는 즉시 후속 PR**.

- [ ] `IngredientSummary`에 `confidence?: number` 추가 (선택 필드 — 기존 `/scan-history`·`/analysis` 경로 영향 없음)
- [ ] `OCRResult` 확장:
  ```ts
  export interface OCRResult {
    extractedText: string;
    ingredients: IngredientSummary[];
    overallConfidence: number;      // 0..1
    illegibleRegions: number;       // ≥ 0
    detectedLanguages: string[];    // BCP-47
    productId?: string;             // BE 업서트 결과
    ladderStage?: 1 | 2 | 3 | 4 | 5;
    scanLogId?: string;             // corrections 연결용
    cacheHit?: 'none' | 'phash-local' | 'phash-server' | 'barcode';
  }
  ```
- [ ] `Product`에 `phash?: string`, `source?: 'seed' | 'off' | 'ocr'` 추가
- [ ] `User` / `Profile`에 `consentFlags: { imageRetention: boolean; corrections: boolean }` 추가
- [ ] `ScanLog`, `Correction` 타입 정의 (`architecture §6` shape)
- [ ] `ScanStackParamList`에 `IngredientCorrection: { scanLogId: string; ingredients: IngredientSummary[] }` 등록
- [ ] `ProfileStackParamList`에 `PrivacyConsent`, `DataExport`, `DataDelete` 등록
- [ ] `src/services/scan.service.ts`의 `MOCK_OCR`에 신규 필드 기본값 (`overallConfidence: 1`, `illegibleRegions: 0`, `detectedLanguages: ['en']`) 채움
- [ ] `npx tsc --noEmit` 통과

---

## Step 2 — Dev Client 전환

`rebuild-guide §3.1-A/B`. Expo Go만으로는 네이티브 캡처·온디바이스 OCR·MMKV 모두 불가.

- [ ] `npx expo prebuild` — `ios/`, `android/` 생성
- [ ] iOS: `cd ios && pod install`
- [ ] `eas.json` 생성 — `preview` / `production` 프로파일
- [ ] `npx expo run:ios` / `run:android` 각 1회 실행 — 빈 Dev Client 정상 부팅 확인
- [ ] `CLIR/CLAUDE.md` 런타임 섹션 갱신 — "Dev Client 기본, Expo Go 폴백"
- [ ] iOS `Info.plist`: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- [ ] Android `AndroidManifest.xml`: `CAMERA`, `READ_EXTERNAL_STORAGE` 권한
- [ ] `npx tsc --noEmit` 통과

---

## Step 3 — 네이티브 캡처 패키지 설치

`rebuild-guide §2`. Dev Client 전제.

- [ ] `npx expo install react-native-vision-camera react-native-worklets-core`
- [ ] `npx expo install react-native-reanimated@latest` (v4)
- [ ] `npx expo install react-native-fast-opencv @shopify/react-native-skia`
- [ ] `npx expo install react-native-document-scanner-plugin`
- [ ] `npx expo install expo-text-extractor`
- [ ] `npx expo install react-native-mmkv`
- [ ] `npx expo install react-native-sse` (SSE 수신)
- [ ] `npx expo install expo-image-manipulator` (기존 유지 — 리사이즈용)
- [ ] `babel.config.js`에 `react-native-reanimated/plugin`, `react-native-worklets-core/plugin` 추가
- [ ] 각 패키지 Config Plugin 등록 (`app.json` `plugins` 배열)
- [ ] Dev Client 재빌드 → 앱 부팅 스모크
- [ ] `npm install` 금지 — 전부 `npx expo install` 사용

---

## Step 4 — 리사이즈 유틸 (`src/lib/imageResize.ts` 신규)

`rebuild-guide §3.2-A`.

- [ ] `resizeForUpload(uri: string): Promise<ResizedImage>` — 장변 1024px, JPEG quality 0.85, `expo-image-manipulator`
- [ ] `ResizedImage` 타입 파일 내부에 정의 (FE 유틸 전용 타입은 `types/index.ts` 예외)
- [ ] 리사이즈 전/후 크기 로그 (Sentry breadcrumb)
- [ ] `npx tsc --noEmit` 통과

---

## Step 5 — pHash 로컬 캐시 (`src/lib/phashCache.ts` 신규)

`rebuild-guide §3.2-B`, `architecture §4`.

- [ ] `react-native-mmkv` 인스턴스 생성
- [ ] `computePhash(uri: string): Promise<string>` — 64비트 pHash 계산 (JS 구현 또는 `sharp-phash` 포트)
- [ ] `getCached(phash: string): OCRResult | null` — 키 `phash:${h}:v${SCHEMA_VERSION}`
- [ ] `putCached(phash: string, result: OCRResult): void` — LRU 500건 초과 시 오래된 것부터 제거
- [ ] `SCHEMA_VERSION`은 `process.env.EXPO_PUBLIC_SCHEMA_VERSION`에서 읽음 (미설정 시 throw — Full Product 금지 규칙)
- [ ] 캐시 히트/미스 카운터 Sentry 태그 `cache: 'l1-hit' | 'miss'`
- [ ] `npx tsc --noEmit` 통과

---

## Step 6 — 온디바이스 OCR (`src/lib/onDeviceOCR.ts` 신규)

`rebuild-guide §3.2-C`.

- [ ] `extractTextOnDevice(uri: string): Promise<string>` — `expo-text-extractor` 래핑
- [ ] `matchKnownAllergens(text: string): { matched: AllergenId[]; confidence: 'high' | 'partial' | 'none' }` — `constants/allergyData.ts`의 `ALLERGEN_KEYWORD_MAP` 재사용
- [ ] 100–300ms 타임아웃 가드 (초과 시 빈 문자열 반환 → 서버 경로)
- [ ] "로컬 고신뢰 매치" 분기는 Step 10에서 결정. 이 단계에서는 **유틸과 매칭 함수만** 구현
- [ ] `npx tsc --noEmit` 통과

---

## Step 7 — 캡처 게이트 분기 (`src/lib/captureGate.ts` 신규)

`rebuild-guide §3.1-C`.

- [ ] `USE_NATIVE_CAPTURE` 플래그 export:
  ```ts
  export const USE_NATIVE_CAPTURE =
    !__DEV__ || process.env.EXPO_PUBLIC_USE_NATIVE_CAPTURE === 'true';
  ```
- [ ] Expo Go 빌드 감지 시 false 강제 (`Constants.appOwnership === 'expo'`)
- [ ] 네이티브 캡처 `captureDocument(): Promise<{ uri: string }>` — 문서 스캐너 래핑
- [ ] `npx tsc --noEmit` 통과

---

## Step 8 — 실시간 블러 프리뷰 (`src/lib/visionCameraGate.tsx` 신규)

`rebuild-guide §3.1-B`. 수동 촬영 경로 컴포넌트.

- [ ] `<VisionCameraGate onCapture={(uri) => ...} />` 컴포넌트 export
- [ ] `useSkiaFrameProcessor` — 5fps 실행
- [ ] OpenCV JSI: `Laplacian` + `meanStdDev` → variance / mean 계산
- [ ] 임계값: `variance ≥ 150 AND 60 ≤ mean ≤ 220`일 때만 셔터 활성
- [ ] 프레임 종료마다 `OpenCV.clearBuffers()` 호출 (메모리 누수 방지)
- [ ] UX: 품질 미달 시 가이드 프레임 붉은색 + 오버레이 문구(Step 13 문구 키 사용). 셔터는 시각적으로 꺼진 상태
- [ ] 컴포넌트 내부 전용 타입은 파일 내부 정의 (화면 컴포넌트 전용 타입 예외)
- [ ] 실기기(iOS/Android) 각 1회 — 흔든 프레임·정상 프레임에서 셔터 on/off 토글 확인
- [ ] `npx tsc --noEmit` 통과

---

## Step 9 — Expo Go 폴백 품질 게이트 (`src/lib/imageQuality.ts` 신규, 격하본)

Dev Client 없이 개발 중인 팀원용 임시 경로. **프로덕션 빌드에서는 도달 불가** (`USE_NATIVE_CAPTURE=true` 시 자동 우회).

- [ ] `checkImageQuality(uri: string): Promise<QualityCheckResult>` — 480px 다운샘플 + Skia 픽셀 추출 + Laplacian variance + 평균 휘도
- [ ] 임계값 동일 (variance < 150 → blurry, mean < 60 → too_dark, mean > 220 → too_bright)
- [ ] `QualityCheckResult` 타입 파일 내부 정의
- [ ] Expo Go에서만 호출되도록 `captureGate.USE_NATIVE_CAPTURE === false`일 때만 활성
- [ ] `npx tsc --noEmit` 통과

---

## Step 10 — SSE 수신 레이어 (`src/lib/sse.ts` + `src/lib/api.ts` 확장)

`rebuild-guide §3.3-B`, `api-spec.yaml §POST /ocr`.

- [ ] `react-native-sse` 래핑: `apiEventStream<T>(path, formData, handlers): () => void`
- [ ] handlers 시그니처:
  ```ts
  {
    onCached:    (result: OCRResult) => void;
    onIngredient:(ing: IngredientSummary) => void;
    onDone:      (meta: OCRDoneMeta) => void;
    onError:     (code: string, retryable: boolean) => void;
  }
  ```
- [ ] 반환값은 구독 해제 함수 (언마운트 시 호출)
- [ ] 401 수신 시 기존 `UnauthorizedError` 패턴과 동일하게 `onError`로 전달하되 호출부에서 로그아웃 플로우 분기
- [ ] 30초 타임아웃 — 초과 시 자동 구독 해제 + `onError('TIMEOUT', true)`
- [ ] `services/scan.service.ts`에 `recognizeIngredientsStream(imageUri, phash, mlkitText, languageHint, handlers)` 신규 함수 추가. 기존 `recognizeIngredients()` 시그니처는 **JSON 폴백용으로 유지** (시그니처 변경 금지 규칙)
- [ ] `npx tsc --noEmit` 통과

---

## Step 11 — OCRCaptureScreen 전면 교체 (`src/screens/scan/OCRCaptureScreen.tsx`)

Mock 블록(`USE_MOCK`, `MOCK_GOOD`, `MOCK_BAD`)은 이미 `USE_MOCK=false`로 비활성. **삭제하고** 실 데이터 흐름만 남긴다.

- [ ] 캡처 경로 분기:
  ```
  if (USE_NATIVE_CAPTURE) → captureDocument()   // Step 7
  else                    → VisionCameraGate    // Step 8 (iOS/Android 네이티브) 또는
                            imageQuality 폴백   // Step 9 (Expo Go)
  ```
- [ ] 촬영 직후 파이프라인:
  1. `const resized = await resizeForUpload(uri)` (Step 4)
  2. `const phash = await computePhash(resized.uri)` (Step 5)
  3. `const cached = getCached(phash)` — HIT이면 즉시 `navigate('ScanResult', { product, ocrResult: cached })` · Sentry `cache:l1-hit`
  4. `const mlkitText = await extractTextOnDevice(resized.uri)` (Step 6, 타임아웃 가드)
  5. `matchKnownAllergens(mlkitText)`의 `confidence === 'high'` → 로컬 분석만으로 결과 화면 (네트워크 0건, Sentry `cache:l1-hit local-match`)
  6. 아니면 `recognizeIngredientsStream(resized.uri, phash, mlkitText, user.language, handlers)` 호출
- [ ] SSE 이벤트 처리:
  - `onCached` / `onDone` 수신 후 `putCached(phash, result)` 로컬 저장
  - `onIngredient`는 화면 내 progressive 리스트에 append (로딩 UX 개선)
  - `onError('OCR_UNREADABLE', true)` → `Strings.ocrQuality.illegible` + Retake
  - 기타 에러는 기존 500 에러 폴백 UI 유지
- [ ] 기존 FK-violation 회피 주석 및 로컬 store 우회 코드 **삭제** — `result.productId`를 그대로 `saveScanHistory()` / `addFavorite()`에 사용
- [ ] Sentry 태그: `stage:ocr-capture`, `stage:ocr-upload`, `ladder:<stage>`, `cache:<hit>`
- [ ] 실기기 시나리오:
  - A 정상 라벨 → SSE 스트림 수신, 배너 없음
  - B 흔든 프레임 → 네이티브 경로에서는 셔터 비활성, Expo Go에서는 blurry 메시지
  - C 어두운 사진 → too_dark 메시지 (Expo Go 폴백만 해당)
  - D pHash 재촬영 → 2번째 촬영이 L1 캐시 히트로 즉시 결과
- [ ] `npx tsc --noEmit` 통과

---

## Step 12 — ScanResultScreen 저신뢰 UX (`src/screens/scan/ScanResultScreen.tsx`)

`rebuild-guide §3.3-C`. 바코드 경로에는 OCR 메타가 없으므로 **OCR 경유 진입 시에만** 렌더.

- [ ] 라우트 파라미터에 `ocrResult?: OCRResult` 수신 (ParamList 업데이트)
- [ ] 상단 경고 배너:
  - `overallConfidence < 0.85` → `Strings.ocrQuality.lowConfidence`
  - `illegibleRegions > 0` → `Strings.ocrQuality.illegible`
  - 둘 다 충족 시 두 줄 동시 표기
- [ ] 배너 색상은 `colors.ts`/`risk.ts`의 `caution` 계열 재사용 (새 색상 추가 금지)
- [ ] 성분 리스트:
  - `confidence === 0` → `[읽기 실패]` 배지 + 회색 처리 + long-press → `IngredientCorrection` 화면
  - `confidence === undefined` (바코드 경로) → 배지 없이 기본 스타일
  - `0 < confidence < 0.6` → 살짝 흐린 표시 + long-press로 교정 가능
- [ ] `detectedLanguages[0] !== user.language` → "원문: <언어>, 번역 표시 중" 뱃지 + 원문/번역 토글
- [ ] `npx tsc --noEmit` 통과

---

## Step 13 — 재촬영 / 저신뢰 UX 문구 (`src/i18n/*.json` + `src/constants/strings.ts`)

하드코딩 금지. `architecture §8`의 "인라인 문자열 금지" 규칙.

- [ ] `Strings.ocrQuality.blurry` / `tooDark` / `tooBright` / `lowConfidence` / `illegible` 추가
- [ ] `Strings.ocrQuality.livePreviewBlurry` — 실시간 프리뷰 오버레이 ("흔들리지 마세요")
- [ ] `Strings.ocrQuality.livePreviewDark` — "조명을 조절하세요"
- [ ] `Strings.ocrQuality.languageMismatch` — "원문은 {lang}입니다. 번역된 결과를 표시합니다"
- [ ] `Strings.ocrQuality.localMatch` — "로컬에서 인식됨 (네트워크 사용 안 함)"
- [ ] `Strings.correction.title` / `.save` / `.cancel` / `.consentNotice`
- [ ] `Strings.privacy.imageRetention.title` / `.description` / `.toggle`
- [ ] `Strings.privacy.export.title` / `.confirm` / `.success`
- [ ] `Strings.privacy.delete.title` / `.warning` / `.confirm`
- [ ] `en / ko / ja / zh / es / fr` 6개 로케일에 모두 추가

---

## Step 14 — 유저 교정 화면

`rebuild-guide §3.4`, `api-spec §POST /corrections`.

- [ ] `src/services/corrections.service.ts` 신규 — `submitCorrection(scanLogId, corrected: IngredientSummary[]): Promise<void>`
  - 내부에서 `apiFetch('/corrections', 'POST', { scanLogId, correctedIngredients, consentCorrections: user.consentFlags.corrections })`
  - `consentFlags.corrections === false`면 API 호출하지 않고 로컬 안내만
- [ ] `src/screens/scan/IngredientCorrectionScreen.tsx` 신규
  - 성분 리스트 편집 UI (추가/삭제/이름 수정)
  - 저장 시 `submitCorrection()` 호출
  - 동의 플래그 OFF면 "설정에서 교정 공유를 켜주세요" 안내 + 프로필 동의 화면으로 이동 버튼
- [ ] `ScanResultScreen`에서 성분 long-press → `navigate('IngredientCorrection', { scanLogId, ingredients })`
- [ ] `npx tsc --noEmit` 통과

---

## Step 15 — 개인정보 / 동의 화면

`rebuild-guide §9`, `architecture §12`, `api-spec §DELETE|GET /users/me`.

- [ ] `src/services/user.service.ts` 확장:
  - `setConsent({ imageRetention?, corrections? }): Promise<void>` — 기존 `updateProfile` 경유
  - `exportMyData(): Promise<Blob>` — `GET /users/me/export` 호출
  - `deleteMyAccount(): Promise<void>` — `DELETE /users/me` 호출 → 성공 후 `clearAuthToken()` + `useUserStore.logout()` + `navigation.reset → Auth`
- [ ] `src/screens/profile/PrivacyConsentScreen.tsx` 신규
  - 2개 토글: 이미지 보존 / 교정 공유 (기본 둘 다 OFF)
  - `user.store`의 `setConsent()` 액션으로 상태 반영
- [ ] `src/screens/profile/DataExportScreen.tsx` 신규 — `exportMyData()` + 파일 저장 (`expo-file-system`)
- [ ] `src/screens/profile/DataDeleteScreen.tsx` 신규 — 확인 모달 2단 + `deleteMyAccount()`
- [ ] `ProfileStack`에 세 화면 등록 (Step 1 ParamList)
- [ ] `ProfileScreen` 설정 섹션에 3개 진입점 추가 (`Settings → Privacy`)
- [ ] `Auth` 플로우의 Survey 마지막 단계에서 동의 토글 UI — 기본 OFF로 제출
- [ ] `npx tsc --noEmit` 통과

---

## Step 16 — i18n `translations` 필드 수용 (단계적)

`rebuild-guide §10.2`. **이번 단계에서 기존 `name`/`nameKo`는 제거하지 않는다** — BE가 병행 송출하는 과도기.

- [ ] `IngredientSummary`에 `translations?: Record<string, string>` 추가 (types/index.ts)
- [ ] 모든 성분명 표시 지점에서 다음 유틸 경유:
  ```ts
  // src/lib/i18nIngredient.ts
  export const displayName = (ing: IngredientSummary, lang: string) =>
    ing.translations?.[lang] ?? (lang === 'ko' ? ing.nameKo : ing.name);
  ```
- [ ] 표시 지점 교체: `ScanResultScreen`, `HistoryProductDetailScreen`, `IngredientCorrectionScreen`, `SearchResultScreen`, 즐겨찾기 메모 등
- [ ] 하드코딩 `nameKo` 직접 접근이 남았는지 grep으로 확인
- [ ] `npx tsc --noEmit` 통과

---

## Step 17 — 전체 검증

- [ ] `cd CLIR && npx tsc --noEmit` — 무오류
- [ ] 실기기 시나리오 A (양호한 라벨, 네이티브 스캐너) — SSE 수신, `ingredient` 이벤트로 프로그레시브 append, 배너 없음
- [ ] 실기기 시나리오 B (같은 제품 재촬영) — L1 pHash 캐시 히트, 네트워크 0건, Sentry `cache:l1-hit`
- [ ] 실기기 시나리오 C (흔든 프레임) — vision-camera 게이트에서 셔터 비활성, 서버 도달 안 됨
- [ ] 실기기 시나리오 D (Expo Go 폴백) — `captureGate.USE_NATIVE_CAPTURE === false` 시 imageQuality 게이트 동작 확인
- [ ] 실기기 시나리오 E (저신뢰 응답) — `overallConfidence < 0.85` 배너 + 성분별 배지 표시
- [ ] 실기기 시나리오 F (CJK/아랍어 라벨) — `detectedLanguages[0]`과 UI 언어 다를 때 뱃지 표시
- [ ] 실기기 시나리오 G (교정 제출) — 동의 ON 상태에서 성분 수정 → BE `corrections` 테이블에 레코드 생성 확인
- [ ] 실기기 시나리오 H (계정 삭제) — `DELETE /users/me` 후 로그인 화면으로 복귀, 재로그인 시 404
- [ ] 업로드 크기: 원본 vs `resizeForUpload()` 후 — BE 로그에서 300KB 이하 확인
- [ ] Sentry 이벤트: 스캔 1건당 `stage:*` 태그 3개 이상 기록 확인 (capture → upload → result)

---

## Step 18 — EAS Build 배포 준비

`rebuild-guide §11`, `architecture §7`.

- [ ] `eas.json` `production` 프로파일 확정
- [ ] `eas build --platform all --profile preview` — TestFlight 내부 / Play Internal Testing 업로드
- [ ] `eas update --branch preview` OTA 스모크 (JS-only 변경 반영 확인)
- [ ] iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) — 카메라 · 네트워크 · 데이터 수집 항목 명시
- [ ] Android `data safety` 폼 초안 (Play Console)
- [ ] App Store Connect "Data collected" 초안 — OpenAI · Google Cloud · Supabase 제3자 고지
- [ ] 프라이버시 정책 URL 준비 (별도 랜딩 페이지)
- [ ] 스크린샷 5장: idle → 캡처 → 로딩(프로그레시브) → 결과 safe → 결과 danger

---

## Step 19 — 문서화 / 회고

- [ ] `CLIR/CLAUDE.md` 갱신:
  - 런타임 섹션: "Dev Client 기본, Expo Go는 개발 편의"
  - 카메라 섹션: vision-camera / 문서 스캐너 / on-device OCR 명시
  - 하지 말 것: Full Product 금지 규칙(`architecture §8` 발췌) 반영
- [ ] `tasks/lessons.md`에 기록:
  - 실제 관측된 L1 / L3 캐시 히트율
  - 폴백 단계별 진입률 (Sentry `ladder:*` 태그 집계)
  - 평균 업로드 크기 · p95 지연
  - 온디바이스 OCR 로컬 매치율 (네트워크 절감 비율)

---

## 하지 말 것

- **`any` 사용** — 불분명하면 `unknown` + 타입 가드
- **`src/types/index.ts` 외 도메인 타입 정의** — FE 유틸 전용 타입(`QualityCheckResult`, `ResizedImage` 등)만 예외
- **`services/` 함수 시그니처 변경** — 구현부 교체만 허용. 신규 함수는 추가 OK
- **화면 컴포넌트에서 `src/mocks/` 직접 import** — 반드시 `services/` 경유
- **화면 컴포넌트에서 `fetch` 직접 호출** — 반드시 `apiFetch` / `apiFormFetch` / `apiEventStream` 경유
- **API URL 하드코딩** — `lib/api.ts`의 `API_BASE_URL` 사용
- **Sentry init 없이 `eas build --profile production`** — Full Product 금지 (`architecture §8`)
- **`SCHEMA_VERSION` 미설정 환경에서 `phashCache` 사용** — throw로 방어
- **`product_id` 없이 즐겨찾기 저장** — `result.productId` 필수. FK-violation 회피 패턴 금지
- **동의 플래그 없이 `POST /corrections` 호출** — `consentFlags.corrections === true`일 때만
- **인라인 문자열** — 반드시 `Strings.*` 또는 i18n 키
- **`npm install`** — 반드시 `npx expo install`

---

## Step 완료 기준 요약

| Step | 완료 판단 |
|---|---|
| 0 | Sentry init 동작, 스캔 이벤트 1건 Sentry에서 확인 |
| 1 | `tsc --noEmit` 통과 + Mock 필드 채움 |
| 2 | `expo run:ios` / `run:android` 정상 부팅 |
| 3 | 패키지 설치 후 Dev Client 빌드 성공 |
| 4 | `tsc --noEmit` 통과 + 업로드 크기 300KB 이하 확인 |
| 5 | 동일 이미지 2회 촬영 시 2번째는 L1 히트 |
| 6 | 온디바이스 OCR 결과 로그로 확인 |
| 7 | `USE_NATIVE_CAPTURE` 분기 동작 확인 |
| 8 | 흔든 프레임에서 셔터 비활성 |
| 9 | Expo Go에서만 Skia 게이트 활성 |
| 10 | SSE `ingredient` 이벤트 수신 로그 |
| 11 | 실기기 시나리오 A–D 전부 통과 |
| 12 | 저신뢰 케이스에서 배너 + 배지 렌더 |
| 13 | 6개 로케일 모두 신규 키 존재 |
| 14 | 동의 ON 상태 교정 제출 → BE DB 반영 |
| 15 | 계정 삭제 → 로그인 화면 복귀 + 재로그인 404 |
| 16 | `translations` 유틸 경유, nameKo 직접 접근 0건 |
| 17 | 시나리오 A–H 전부 통과 |
| 18 | TestFlight / Play Internal 업로드 성공 |
| 19 | 문서 2곳 업데이트 + lessons 기록 |

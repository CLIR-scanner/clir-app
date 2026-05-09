# F8 — Closed Beta 배포 readiness 체크리스트

iOS TestFlight + Android APK 배포 직전 점검 항목. **체크박스 단위로 atomic 작업** — 각 항목은 별도 PR / 운영 작업 / 외부 콘솔 작업으로 분리 가능.

심각도 표기:
- 🚨 **S** — Showstopper. 미해결 시 빌드 즉시 거부 / 보안 누출 / 런타임 크래시.
- 🔴 **H** — High. TestFlight 제출 전 또는 첫 베타 사용자 진입 전 처리.
- 🟡 **M** — Medium. 베타 기간 *중* 처리 가능. 사용자 경험·운영성에 영향.
- 🟢 **L** — Low. 정식 출시 시점 또는 이후로 미룸.

작업 영역 표기:
- 💻 코드 변경 (FE 또는 BE PR 필요)
- ⚙️ 빌드/배포 인프라 (eas, app.json, 인증서)
- 🌐 외부 콘솔 (Apple/Google/Supabase/Vercel/Firebase)
- 📝 문서·정책

---

## 1. 보안 / 데이터 누출

- [ ] **🚨S 💻 access token 콘솔 로그 제거**
  - 위치: `src/services/auth.service.ts:60-61`
  - 현 상태: `console.log('[DEV] ACCESS_TOKEN =', accessToken);` — 본인이 "배포 전 제거" 라고 주석에 명시했으나 라인 잔존
  - 위험: release 빌드에서도 `console.log` 실행 → 토큰 평문 누출. App Store 리뷰 자동 체크 도구에 적발 가능성. 디버그 USB 로 device log 캡처 시 즉시 토큰 탈취.
  - 조치: 라인 60–61 (DEV-ONLY 주석 + console.log 1줄) 삭제
  - 소요: 5분

- [ ] **🚨S 💻 OAuth 디버그 로그 9건 정리**
  - 위치: `auth.service.ts:29, 36, 39, 42, 44, 59, 68, 71` 등 `[oauth]` prefix 로그
  - 위험: redirect URL, Supabase 응답 메타 등이 release 로그에 남음. 토큰만큼 치명적이진 않지만 사용자 식별자가 흘러나옴.
  - 조치: babel `transform-remove-console` (production 빌드에서만 자동 제거) — 한 번 설정으로 전역 해결. 또는 라인별 제거.
  - 소요: 15분 (babel 방식 권장)

- [ ] **🚨S 💻 production 빌드의 console.log 자동 제거**
  - 작업: `babel.config.js` 의 production env 에 `transform-remove-console` plugin 추가
    ```js
    env: { production: { plugins: ['transform-remove-console'] } }
    ```
  - `npm install --save-dev babel-plugin-transform-remove-console`
  - 효과: 운영 모드 빌드는 모든 `console.*` 자동 strip. 위 OAuth 로그 + 기타 27건 일괄 처리.
  - 소요: 15분

- [ ] **🟡M 💻 .env 파일 git-ignored 재확인**
  - 위치: `.gitignore` 의 `.env` 라인. `git check-ignore .env` → `.env` 출력 확인됨 ✓
  - 추가 권장: README 또는 CONTRIBUTING 에 환경 변수 setup 안내 (`.env.example` 동봉). 신규 개발자가 실수로 `.env` 커밋하는 사고 방지.
  - 소요: 10분

---

## 2. 네이티브 권한 / 매니페스트

- [ ] **🚨S ⚙️ expo-image-picker plugin 등록 (iOS Photo Library 권한)**
  - 위치: `app.json` `plugins` 배열
  - 현 상태: `expo-image-picker` 가 `package.json` deps 에 있고 `PersonalNameScreen.tsx:14`, `MultiProfileEditScreen.tsx:9` 에서 사용. 하지만 plugin 미등록 → `NSPhotoLibraryUsageDescription` 가 Info.plist 에 없음.
  - 위험: iOS 14+ 에서 권한 요청 시 *런타임 크래시*. 사용자가 프로필 이미지 변경 시도 → 앱 강제 종료.
  - 조치: `app.json` plugins 에 추가
    ```json
    ["expo-image-picker", {
      "photosPermission": "CLIR이 프로필 사진 설정을 위해 사진 라이브러리에 접근합니다."
    }]
    ```
  - 소요: 5분

- [ ] **🟡M ⚙️ 카메라 권한 description 다국어화 검토**
  - 위치: `app.json:plugins["expo-camera"].cameraPermission`
  - 현 상태: 한국어 단일. iOS 디바이스 언어가 다른 경우에도 한국어로 표시.
  - 조치 (택1):
    - A. 영어로 변경 (글로벌 베타 기준) — 권장
    - B. `InfoPlist.NSCameraUsageDescription_*` 다국어 키 추가 (Expo prebuild 후 별도 strings 파일)
  - 소요: A 5분 / B 30분

- [ ] **🟡M ⚙️ Splash + icon assets 실제 브랜드 자산인지 확인**
  - 위치: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`
  - 현 상태: 파일 존재, 크기 17~22KB. EXIF mtime 1985 (의미 없음)
  - 점검 필요: Expo 기본 placeholder 가 아닌 CLIR 브랜드 자산인지 시각 확인. iOS 1024×1024, Android adaptive icon 108dp safe zone 준수
  - 소요: 디자이너 확인 1시간 (자산 부족 시 추가 작업)

---

## 3. 인증 / OAuth

- [ ] **🚨S 💻 Apple Sign-In 버튼 처리** (App Store Guideline 4.8)
  - 위치: `AuthHomeScreen.tsx:60-92`, `auth.service.ts:84-87`
  - 현 상태: 버튼 노출 + 누르면 `throw new Error('Apple 로그인은 아직 준비되지 않았습니다.')`
  - 위험: TestFlight 자체는 통과하지만 *정식 출시* 시 Apple 리뷰가 4.8 (Sign in with Apple 의무) 위반으로 reject. 베타 사용자도 버튼 누르고 alert 보면 혼란.
  - 조치 (택1):
    - **A. Apple Sign-In 정식 구현** (1~2일): Supabase Apple provider 활성화 + Apple Developer Console 에서 Sign in with Apple capability 추가 + `expo-apple-authentication` 통합 + `app.json` 에 `usesAppleSignIn: true`
    - **B. iOS 빌드에서 버튼 숨김** (30분, 베타 v1 한정): `Platform.OS === 'ios'` 분기로 button 자체 비표시. 정식 출시 전 A 필수.
  - 소요: A 1~2일 / B 30분

- [ ] **🔴H 🌐 Supabase OAuth redirect URL whitelist 갱신**
  - 위치: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
  - 현 상태: dev 모드에선 `exp://` URL 자동 생성. release 빌드는 `clir://auth/callback` 로 고정.
  - 위험: whitelist 에 `clir://auth/callback` 없으면 OAuth 콜백 실패 → 로그인 무한 루프.
  - 조치: Supabase 콘솔에서 `clir://auth/callback`, `clir://**` 패턴 추가. 추가로 Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized redirect URIs 도 동일 확인.
  - 소요: 15분

- [ ] **🟡M 💻 토큰 만료 시 재로그인 UX**
  - 위치: `src/lib/api.ts:107-114` `UnauthorizedError` 던지면 호출처가 `clearAuthToken + logout + navigation.reset` 처리
  - 현 상태: 화면 별로 패턴 일관성 부족 가능성. 베타 사용자가 1주 이상 사용 시 토큰 만료 → 어떤 UX 로 안내할지
  - 조치: 401 핸들러를 root 에서 한 번만 처리하는 글로벌 hook 추가 검토. 또는 현 패턴 유지하되 모든 화면 점검.
  - 소요: 점검 1시간 / 글로벌 hook 도입 2시간

- [ ] **🟢L 💻 자동 세션 복원 (`expo-secure-store` 토큰 영속화)**
  - 위치: `src/store/user.store.ts:34-39` `initialize` 가 토큰 복원 TODO 만 두고 미구현
  - 현 상태: 앱 강제종료 시 매번 재로그인 필요 (베타엔 그래도 OK)
  - 조치: 토큰을 `expo-secure-store` 에 저장 + `initialize` 에서 복원 + 만료 검증. 베타 후반/v1.1.
  - 소요: 2~3시간

---

## 4. 빌드 인프라

- [ ] **🔴H ⚙️ `eas.json` 생성 + production profile 정의**
  - 위치: 프로젝트 루트
  - 현 상태: 파일 없음 → cloud build 불가
  - 조치:
    ```bash
    npx eas-cli build:configure
    ```
    생성된 `eas.json` 의 `production` profile 에 iOS/Android 빌드 옵션 명시. `internal` 또는 `preview` profile 로 베타 distribution 별도 분리 검토.
  - 소요: 1시간

- [ ] **🔴H ⚙️ `app.json` 에 buildNumber / versionCode 명시**
  - 위치: `app.json:ios`, `app.json:android`
  - 현 상태: `version: "1.0.0"` 만 있고 빌드 번호 없음
  - 위험: TestFlight 는 빌드마다 buildNumber 강제 증가. 첫 빌드는 기본 1 부여되지만 이후 충돌 위험. EAS 의 `autoIncrement` 옵션 켜는 게 가장 안전.
  - 조치 (택1):
    - A. 명시: `"ios": { "buildNumber": "1" }`, `"android": { "versionCode": 1 }` + 빌드마다 수동 증가
    - B. `eas.json` profile 에 `autoIncrement: "buildNumber"` 또는 `"versionCode"` 설정 — 권장
  - 소요: 5분 (B)

- [ ] **🔴H 🌐 Apple Developer 계정 + App ID 등록**
  - 위치: Apple Developer Console → Certificates, Identifiers & Profiles
  - 사전 조건: 유료 Apple Developer Program 가입 (연 $99)
  - 작업:
    - App ID `com.clir.app` (또는 변경) 등록
    - Capabilities: Push Notifications (M으로 미루더라도 미리 켜두면 추후 작업 적음), 향후 Sign in with Apple
    - Provisioning Profile 생성 (또는 EAS 가 자동 생성)
  - 소요: 1시간 (계정 보유 시) / 1~2일 (계정 신규 신청 + 검증)

- [ ] **🔴H 🌐 App Store Connect 앱 레코드 생성**
  - 위치: appstoreconnect.apple.com
  - 작업: My Apps → + → New App → CLIR / com.clir.app / Bundle ID 매칭. Privacy Policy URL (waitlist landing 의 `/privacy`) 등록. App Privacy 질문지 응답 (수집 데이터: email, camera, photo library / 사용 목적 / 제3자 공유 없음).
  - 소요: 1시간

- [ ] **🔴H ⚙️ Android keystore 생성·백업**
  - 위치: 프로젝트 루트 (또는 EAS 가 cloud 보관)
  - 작업: `eas credentials` 로 keystore 생성. **반드시 1Password / Google Drive 등에 백업** — 분실 시 동일 패키지명으로 업데이트 영구 불가.
  - 소요: 30분

- [ ] **🟡M 🌐 Firebase App Distribution 셋업 (APK 호스팅)**
  - 위치: console.firebase.google.com → 프로젝트 추가 → App Distribution
  - 이유: Vercel 정적 호스팅보다 (a) 베타 사용자 이메일 등록 + 자동 알림 (b) 버전 자동 관리 (c) 무료
  - 작업: Firebase 프로젝트 생성 → Android 앱 추가 → SDK 통합 (선택, 베타엔 미통합 OK) → eas build 후 APK 업로드 → 베타 그룹 만들기 → 사용자 이메일 추가
  - 대안: GitHub Releases (private repo) + Vercel landing 에 다운로드 버튼 / 또는 Expo Updates internal distribution
  - 소요: 30분 셋업 + 빌드별 5분 업로드

- [ ] **🟢L ⚙️ EAS Update (OTA) 통합**
  - 위치: `app.json:expo.updates`, `expo-updates` 패키지
  - 효과: JS 코드 변경은 재제출 없이 OTA 배포. 베타 중 빠른 hotfix 가능.
  - 조치: `npx expo install expo-updates` + EAS Update 채널 생성 + `eas update --branch beta`
  - 소요: 1시간

---

## 5. 정책 / 컴플라이언스

- [ ] **🔴H 💻 SettingsPrivacyScreen 외부 링크 연결**
  - 위치: `src/screens/profile/SettingsPrivacyScreen.tsx:5`
  - 현 상태: `<PlaceholderScreen name="..." />` stub
  - 위험: App Store / Play Store 모두 인앱 Privacy Policy 접근 의무. 누락 시 metadata 검수 reject.
  - 조치: `Linking.openURL('https://clir-beta.vercel.app/privacy')` 버튼 1개. AuthHomeScreen 의 `termsPrivacy` 텍스트도 클릭 가능하게.
  - 소요: 30분

- [ ] **🔴H 💻 Terms of Service URL/화면**
  - 위치: 부재. AuthHomeScreen 의 termsService i18n 문자열만 존재
  - 위험: App Store 가 Privacy 만큼 강하게 요구하진 않지만 *베타 동의서* 측면에서 필요
  - 조치: waitlist-landing 에 `terms.html` 추가 또는 Privacy 와 합본. SettingsPrivacy 에서 두 개 링크 제공.
  - 소요: 1시간 (문서 작성 포함)

- [ ] **🟡M 💻 GDPR / 데이터 삭제 흐름 (DELETE /users/me)**
  - 위치: `src/screens/profile/SettingsDeleteScreen.tsx` (placeholder), BE `DELETE /users/me` (구현 완료)
  - 위험: EU/CA 사용자 있으면 GDPR / CCPA 준수 — "내 계정 삭제" 화면 의무
  - 조치: SettingsDelete 화면 구현 — 확인 모달 + `apiFetch('/users/me', { method: 'DELETE' })` + 로그아웃 + AuthHome 으로 reset
  - 소요: 1.5시간

- [ ] **🟡M 💻 데이터 export 흐름 (GET /users/me/export)**
  - 위치: BE 구현 완료, FE 부재
  - 위험: GDPR 컴플라이언스의 "데이터 이동권"
  - 조치: SettingsPrivacy 또는 새 SettingsExport 화면 — JSON 다운로드 버튼. `Linking.openURL` 로 download URL 또는 in-app share sheet
  - 소요: 1.5시간

- [ ] **🟡M 📝 베타 사용자 동의서 / NDA**
  - 위치: 첫 진입 시 1회 동의 modal 또는 SurveyLanding 에 통합
  - 내용: "이 앱은 베타입니다 / 데이터가 제품 개선에 사용됩니다 / 베타는 [날짜] 종료 / 정식판 마이그레이션 정책"
  - 소요: 카피 1시간 + UI 1시간

- [ ] **🟡M 🌐 App Store Connect — App Privacy 질문지 응답**
  - 위치: appstoreconnect.apple.com → App Privacy
  - 응답 필요 항목: 수집 데이터 종류 (Email, Photos, Camera Data — OCR 이미지), 사용 목적 (App Functionality, Analytics 미사용), 제3자 공유 (None), 사용자 추적 (None)
  - 소요: 30분 (정확히 응답하려면 BE 데이터 수집 정책과 일치 검증)

- [ ] **🟢L 📝 COPPA / 13세 미만 정책**
  - 현 상태: 명시 없음. Apple/Google 둘 다 age rating 시 묻는 질문
  - 조치: Privacy Policy 에 "13세 미만 사용자 데이터 의도적 수집 안 함" 명시. App Store age rating 4+ 또는 12+.
  - 소요: 정책 작성 시 함께 — 별도 작업 0

---

## 6. 코드 정리 / 미머지 PR

- [ ] **🔴H 💻 미머지 PR 7건 + BE 1건 머지 정리**
  - 작업 의존:
    ```
    PR #51 ✓ 머지됨
    PR #52 → PR #51 base — develop 으로 베이스 변경 후 머지
    PR #53 → PR #52 base — 동일
    PR #54 (독립) → develop
    PR #55 (독립) → develop
    PR #56 → PR #55 base
    clir-api PR #34 (독립) → BE develop → Railway 자동 배포
    ```
  - 위험: 머지 안 하고 빌드 컷하면 보고된 버그 (언어 리셋, 멀티 프로필 휘발 등) 가 베타 사용자에게 그대로 노출
  - 권장 머지 순서 (의존 충족):
    1. clir-api #34 → BE develop → Railway 배포 확인
    2. FE: #54 → #55 → #56 → #52 → #53 (depend chain 차례)
  - 소요: 리뷰·머지 사람 작업 2~4시간

- [ ] **🟡M 💻 mock 데이터 dead code 제거**
  - 위치: `src/services/scan.service.ts:112-211` (~100라인 mock data + toggle), `src/services/list.service.ts` 동일
  - 현 상태: `USE_MOCK = false` 인 상태로 운영 코드만 사용되지만 mock 정의가 번들에 포함 → APK/IPA 약간의 사이즈 증가
  - 소요: 30분

- [ ] **🟡M 💻 TODO/주석 정리**
  - 위치: 전 프로젝트
  - 현 상태: `TODO: Real API 연동 시 USE_MOCK 을 false 로 변경` 등 stale TODO 다수
  - 조치: 적용 안 된 TODO 제거 또는 GitHub issue 로 마이그레이션
  - 소요: 1시간

---

## 7. 관측성 / 모니터링

- [ ] **🟡M 💻 Sentry/Crashlytics 통합**
  - 위치: 프로젝트 루트
  - 이유: 베타에서 가장 큰 정보 자산이 *크래시 stack trace*. 사용자 보고만으로는 재현·디버깅 불가능.
  - 조치: `npx expo install @sentry/react-native` 또는 `sentry-expo` (deprecated 가능). DSN 환경변수 설정. EAS Build 시 source map 자동 업로드 (`eas-cli` 의 sentry hook).
  - 소요: 1.5시간

- [ ] **🟡M 💻 BE side observability**
  - 위치: clir-api 의 logger (이미 pino 사용 중)
  - 점검: `request.log.error` 가 표준화돼 있나, Railway dashboard 에서 에러 로그 검색 가능한가, 알림(Slack 등)이 critical 에러 시 발사되는가
  - 소요: 점검 30분 / 알림 셋업 1시간

- [ ] **🟡M 🌐 BE 가용성 모니터링 (UptimeRobot 등)**
  - 위치: `https://focused-imagination-production-49c9.up.railway.app/health` 헬스 엔드포인트 (있다면)
  - 이유: Railway 다운타임 발생 시 실시간 인지. 베타 사용자 이탈 직전 알림.
  - 소요: 외부 서비스 가입 + 셋업 30분

- [ ] **🟢L 💻 베타 사용 행동 분석 (PostHog / Amplitude)**
  - 현 상태: 미사용. 베타 단계에선 기본 funnel 만으로 충분한 인사이트
  - 조치: Bug #2 머지 후 별도 작업
  - 소요: 1일

---

## 8. 사용자 안내 / 피드백 채널

- [ ] **🔴H 📝 베타 사용자 진입 가이드 작성**
  - 형태: Notion 페이지 또는 waitlist-landing 의 `/welcome` 페이지
  - 내용:
    - iOS: TestFlight 설치 안내 (App Store 에서 TestFlight 받기 → 초대 수락 → 앱 설치)
    - Android: APK 다운로드 안내 (출처 알 수 없는 앱 허용 토글 → 다운로드 → 설치)
    - 첫 로그인 → invite code 입력 흐름 (스크린샷 포함)
    - 알려진 한계 (영양 미지원, 베타 종료일 등)
    - 피드백 보내는 법
  - 소요: 카피 + 스크린샷 3시간

- [ ] **🟡M 💻 SettingsReportScreen 피드백 채널 구현**
  - 위치: `src/screens/profile/SettingsReportScreen.tsx` (placeholder)
  - 조치 (택1):
    - A. mailto: 링크 `mailto:beta@clir.app?subject=CLIR Beta Feedback&body=Version: 1.0.0%0AOS: ...`
    - B. Google Form 임베드 (WebView)
    - C. Slack incoming webhook (BE 라우트 1개 추가, FE 폼)
  - 권장: A — 베타 규모에서 충분
  - 소요: A 30분 / B 1시간 / C 2시간

- [ ] **🟡M 📝 invite code 발송 플로우 정리**
  - 현 상태: BE `/waitlist` POST 가 invite_code 컬럼 빈 채로 row 만 생성. 누가·언제 invite_code 채우고 이메일 발송하는지 정의 필요
  - 작업:
    - 운영 SQL: 일괄 invite_code 생성 (`UPDATE waitlist SET invite_code = encode(gen_random_bytes(6), 'hex') WHERE invite_code IS NULL`)
    - 메일 발송: 수동 (Gmail mail merge / Mailchimp 무료 티어) 또는 BE Resend / SendGrid 통합
    - 메일 본문 템플릿
  - 소요: 수동 방식 1시간 / 자동화 4시간

- [ ] **🟡M 📝 베타 종료 안내 / 정식판 마이그레이션 계획**
  - 베타 v1 → v1.1 / v1.0 정식 시점 결정 + 사용자 데이터 어떻게 carry over (Supabase auth.users 그대로 유지 가능 → 무손실)
  - 베타 종료 1주 전 in-app banner / 이메일 안내 사전 준비
  - 소요: 정책 결정 + 카피 2시간

---

## 9. 외부 서비스 / 베타 funnel

- [ ] **🔴H 🌐 waitlist-landing Vercel 배포 확인**
  - 위치: `https://clir-beta.vercel.app/`
  - 점검:
    - 페이지 정상 로드 확인
    - `POST /waitlist` 호출이 Railway BE 와 연결되는지
    - `privacy.html` 접근 가능 여부
    - DNS 또는 사용자 접근 URL 확정
  - 소요: 점검 15분 + (필요 시) 배포 1시간

- [ ] **🟡M 🌐 closed-beta-dashboard Vercel 배포 확인**
  - 위치: `closed-beta-dashboard/`
  - 점검: `/admin/beta-metrics` 호출 정상 / ADMIN_TOKEN 인증 / 메트릭 데이터 정상 표시
  - 소요: 점검 15분

- [ ] **🔴H 🌐 BE production env 확정**
  - 위치: Railway dashboard environment variables
  - 점검:
    - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 정확
    - `OPENAI_API_KEY` 유효 + 충분한 크레딧
    - `GOOGLE_APPLICATION_CREDENTIALS_JSON` 등록 (OCR Stage 4 폴백)
    - `REDIS_URL` (L3 pHash 캐시) 활성
    - `BETA_INVITE_REQUIRED=true` (게이트 활성)
    - `ADMIN_TOKEN` 안전한 32자
    - `SCHEMA_VERSION`, `PROMPT_VERSION` 명시
  - 소요: 점검 15분

- [ ] **🟢L 💻 BE rate limit 정책 확인**
  - 현 상태: `/waitlist` 가 IP 분당 5건 명시. 다른 라우트?
  - 점검: 베타 사용자 N명 기준 OCR 호출 동시성 한계 / OpenAI API 라인 한계
  - 소요: 점검 30분 / 정책 추가 1시간

---

## 10. 검증 / QA

- [ ] **🔴H 🌐 본 점검의 미해결 시나리오 6종 (closed-beta/F6)**
  - 위치: `docs/tasks/closed-beta/F6-verification.md` 의 시나리오 1~6
  - 현 상태: 자동 검증 (tsc/yaml) 통과. 수동 디바이스 시나리오 미실행
  - 조치: TestFlight 첫 빌드 받자마자 실 디바이스에서 6 시나리오 실행
  - 소요: 1.5시간 (사람)

- [ ] **🟡M 🌐 베타 신규 시나리오 — 디바이스 매트릭스 검증**
  - iOS: iPhone 12 mini / 14 / 15 Pro Max (다양한 화면 크기), iOS 16/17/18 OS 버전
  - Android: 저사양 (Galaxy A 시리즈) + 고사양 (Galaxy S 또는 Pixel)
  - 점검 항목: 카메라 OCR 정확도, 한글·영문·일문 라벨 인식, 다국어 description 표시 (Bug #2 머지 후), 언어 전환 후 재실행 (Bug #1)
  - 소요: 1일

- [ ] **🟡M 💻 네트워크 실패 UX**
  - 시나리오: WiFi 끊김, BE 다운, OCR 타임아웃, 401 토큰 만료
  - 현 상태: `apiFetch` 가 에러 throw → 화면별로 catch, 일부는 silent 일부는 Alert. 일관성 부족.
  - 조치: 공통 ErrorBoundary + 네트워크 실패 표준 모달 검토. 베타 v1 엔 우선순위 낮음 (현재 동작에 큰 결함 없음).
  - 소요: 점검 1시간 / 일괄 정리 4시간

- [ ] **🟡M 💻 OCR 흐름 통합 (PR #50 후속)**
  - 위치: `ScanScreen` / `OCRCaptureScreen` 의 inline 결과 오버레이
  - 현 상태: PR #50 에서 `scanLogId` 통합 완료. ScanFeedbackBar 노출 OK
  - 점검: 실 디바이스에서 OCR 흐름 → 피드백 버튼 표시 + 클릭 → BE `scan_logs.helpful` 갱신 검증
  - 소요: 30분 (사람)

- [ ] **🟢L 💻 a11y 베이스라인 (VoiceOver / TalkBack)**
  - 현 상태: 점검 안 됨. TouchableOpacity 등에 `accessibilityLabel` 빠진 곳 다수 예상
  - 조치: 정식 출시 전. 베타엔 보류.
  - 소요: 1~2일

- [ ] **🟢L 💻 성능 베이스라인 (TTI, 스캔 latency)**
  - 측정 대상: 콜드 스타트 → 메인 탭 진입 시간, 바코드 스캔 → verdict 표시 시간, OCR 처리 시간
  - 조치: Sentry Performance / React Native Performance Monitor. 베타 후반.
  - 소요: 측정 1일

---

## 11. 출시 후 운영 (베타 진행 중)

- [ ] **🟡M 📝 운영 일정 공유 — 누가 / 언제 / 어떻게**
  - 베타 사용자 N명 → invite code 발송 일정
  - 일일 메트릭 확인 책임자 (closed-beta-dashboard)
  - 크래시 리포트 triage 책임자
  - 매일·매주 사용자 피드백 정리 시간

- [ ] **🟡M 📝 베타 → 정식 종료 결정 기준**
  - 정량: redeem 수 / 활성 사용자 수 / 1탭 피드백 helpful 비율 / OCR 성공률 / 크래시 free 비율
  - 정성: 사용자 인터뷰 5명 이상 / 핵심 워크플로우 만족도

- [ ] **🟢L 💻 정식판 마이그레이션 코드 정리**
  - DEV 자동 로그인 블록 제거 (CLAUDE.md 의 src/store/user.store.ts DEV ONLY 블록 — 본 점검에서 확인 못 함, 별도 grep 필요)
  - 베타 게이트 제거 또는 그대로 유지 (waitlist 운영 지속 시)
  - 사용 안 한 i18n 키 청소

---

## 권장 실행 단위 (PR 묶음)

배포 전 PR 으로 묶는 것을 권장:

- **PR A (Security 1day)**: 1.1 + 1.2 + 1.3 = console.log 제거 + babel transform
- **PR B (Native config)**: 2.1 + 4.2 = expo-image-picker plugin + buildNumber/versionCode
- **PR C (Apple stub guard)**: 3.1.B (베타 v1 한정 — iOS 버튼 숨김)
- **PR D (Privacy/Terms)**: 5.1 + 5.2 = SettingsPrivacy 외부 링크 + Terms URL
- **운영 작업**: 4.3 + 4.4 + 4.5 + 4.6 (인증서·콘솔 셋업)
- **머지 정리**: 6.1 (체이닝된 7+1개 PR 일괄 머지)
- **빌드 컷**: 위 모두 끝난 후 `eas build --profile production` × 2 platform

---

## 메모 — 본 점검 시점 상태 (2026-05-07)

- FE 미머지 PR 7건, BE 미머지 PR 1건 — 위 6.1 참조
- BE Railway 배포: 자동 (clir-api `develop` 머지 → 자동)
- waitlist-landing Vercel 배포 상태: 미확인 — 위 9.1 참조
- 베타 사용자 invite code 발송 운영자 미정 — 위 8.3 참조

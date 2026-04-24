# CLIR — FE (React Native)

식품 바코드/OCR 스캔 → 성분 분석 → 알러지·식이 프로필 대조 → 개인화 위협 판정

- 전체 화면 구조·MVP Scope: `docs/ia.md`
- API 요청/응답 명세: `docs/api-spec.yaml`
- 새 화면 추가 전 `docs/ia.md` 확인 필수
- API 호출 방식 변경 전 `docs/api-spec.yaml` 확인 필수

---

## 런타임

- Expo SDK 54 + React Native 0.81.5
- 실행: `npx expo start` → Expo Go 앱에서 QR 스캔
- 타입 체크: `npx tsc --noEmit` (`.ts`, `.tsx` 수정 후 반드시 실행)
- 카메라: `expo-camera` 사용 — `react-native-vision-camera` 사용 금지 (Expo Go 미지원)

---

## DEV 유저 (임시 자동 로그인)

`src/store/user.store.ts` 의 `initialize()` 안에 개발용 임시 유저가 주입되어 있다.
앱 실행 시 로그인 없이 바로 메인 탭으로 진입한다.

**담당자 A가 실제 로그인 흐름(`auth.service → setUser`)을 완성하면 해당 블록을 삭제한다.**
블록은 `// ─── DEV ONLY ───` 주석으로 표시되어 있다.

DEV 유저 프로필:
- 알러지: ing-peanut (땅콩), ing-dairy (유제품)
- 식이 제한: vegan
- 민감도: strict

---

## API 연동 (실제 백엔드)

백엔드: `https://focused-imagination-production-49c9.up.railway.app` (Railway 배포)

### 공통 fetch 헬퍼 — `src/lib/api.ts`

모든 API 호출은 반드시 `apiFetch` / `apiFormFetch`를 통해야 한다. 화면에서 `fetch`를 직접 호출 금지.

```typescript
import { apiFetch, apiFormFetch } from '../lib/api';
```

- `apiFetch<T>(path, options?)` — JSON 요청. Authorization 헤더 자동 주입.
- `apiFormFetch<T>(path, formData)` — multipart 요청 (OCR 이미지 업로드).
- 401 수신 시 `UnauthorizedError` throw → 화면에서 catch 후 로그인 화면으로 이동.
- 그 외 오류는 `ApiError` (status, code, message 포함).

### 토큰 관리

```typescript
import { setAuthToken, clearAuthToken, getAuthToken } from '../lib/api';
```

- **저장**: `login()` 성공 시 `auth.service.ts` 내부에서 `setAuthToken(token)` 자동 호출.
- **삭제**: 로그아웃 시 `clearAuthToken()` 호출 + `useUserStore.logout()` 호출.
- **토큰 수명**: 앱 메모리 — 앱 재시작 시 초기화됨. 재시작 후 재로그인 필요 (MVP 범위).
- `getAuthToken()` 반환값이 `null` 이면 미인증 상태.

### 401 처리 패턴 (화면 레벨)

```typescript
import { UnauthorizedError } from '../lib/api';

try {
  const data = await someService();
} catch (err) {
  if (err instanceof UnauthorizedError) {
    clearAuthToken();
    useUserStore.getState().logout();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    return;
  }
  // 그 외 에러 처리
}
```

---

## 개발 모드: Mock 우선

백엔드 API가 준비되기 전까지 Mock 데이터로 완전 독립 개발한다.
API 연동 시 `src/services/` 구현부만 교체하며 화면 코드는 건드리지 않는다.

---

## 폴더 구조

```
src/
├── components/     컴포넌트 (재사용 가능한 UI 단위)
│   └── common/     앱 전반에서 쓰는 공통 컴포넌트
├── constants/      colors.ts / strings.ts / risk.ts — 하드코딩 금지
├── mocks/          Mock 데이터 — 화면에서 직접 import 금지
├── navigation/     네비게이터 파일 (화면 등록)
├── screens/        화면 컴포넌트 (탭별 폴더로 분리)
├── services/       API 호출 레이어 — 화면은 반드시 이 레이어를 경유
├── store/          Zustand 전역 상태 (user / scan / list)
└── types/
    └── index.ts    모든 타입 정의 — 이 파일에만 추가
```

---

## TypeScript 규칙

- `any` 금지. 타입이 불분명하면 `unknown` + 타입 가드 사용.
- 새 타입은 `src/types/index.ts` 에만 추가.
- 새 화면 추가 시 해당 `*ParamList` 에 반드시 등록.
- 타입 수정 후 `npx tsc --noEmit` 통과 확인 필수.

---

## 네비게이션 규칙

경로명은 `docs/ia.md` 기준으로 고정한다. 임의로 추가하거나 변경하지 않는다.

현재 등록된 ParamList (src/types/index.ts 기준):

```
AuthStackParamList:
  Splash / AuthHome / Signup / Survey / Login

MainTabParamList:
  ScanTab / SearchTab / ListTab / RecommendTab / ProfileTab

ScanStackParamList:
  Scan / ScanResult / ScanHistory / OCRCapture

SearchStackParamList:
  Search / SearchResult

ListStackParamList:
  List / Favorites / FavoritesMemo / FavoritesScanLog
  FavoritesAll / Shopping / ShoppingItems / ShoppingPurchase

RecommendStackParamList:
  Recommend / WeekendPopular / SimilarUsersFavorites

ProfileStackParamList:
  Profile / Personal / PersonalName / PersonalEmail
  PersonalPush / PersonalMembership / Personalization
  PersonalizationAllergy / PersonalizationSensitivity
  PersonalizationRelated / PersonalizationHealthCheck
  PersonalizationBandAid / MultiProfile / MultiProfileAdd
  MultiProfileList / MultiProfileDetail / Language
  Settings / SettingsHelp / SettingsPrivacy
  SettingsConsult / SettingsReport / SettingsDelete
```

---

## Service Layer 규칙

- `src/services/` 의 함수 시그니처는 변경 금지. 구현부만 교체 가능.
- 파일 상단 `// TODO: Real API 연동 시 이 파일의 구현부만 교체` 주석 유지.
- 화면 컴포넌트에서 `src/mocks/` 직접 import 금지. 반드시 `services/` 경유.

현재 서비스 파일:
```
auth.service.ts     회원가입 / 로그인
user.service.ts     사용자 프로필 조회·수정
scan.service.ts     바코드 스캔 / OCR / 성분 분석 / 이력
list.service.ts     즐겨찾기 / 쇼핑 리스트
recommend.service.ts 추천 목록
search.service.ts   검색
```

---

## 상태 관리 (Zustand)

전역 상태는 세 스토어로만 관리한다. 새 스토어 임의 생성 금지.

```
user.store.ts   currentUser, activeProfile, 멀티 프로필 전환
scan.store.ts   스캔 이력 (history)
list.store.ts   즐겨찾기 (favorites), 쇼핑 리스트 (shoppingItems)
```

---

## 주요 도메인 타입 (src/types/index.ts)

```typescript
RiskLevel       'safe' | 'caution' | 'danger'
SensitivityLevel 'strict' | 'normal'

Ingredient      id, name, nameKo, description, riskLevel, sources
Product         id, barcode, name, brand, image, ingredients,
                isSafe, riskLevel, riskIngredients,
                mayContainIngredients, alternatives
User            id, email, name, allergyProfile,
                dietaryRestrictions, sensitivityLevel,
                language, multiProfiles
ScanHistory     id, productId, userId, scannedAt, result, product
FavoriteItem    id, productId, userId, memo, addedAt, product
ShoppingItem    id, productId, userId, isPurchased, addedAt, product
```

---

## 상수 사용 규칙

- 문자열 하드코딩 금지. `src/constants/strings.ts` 사용.
- 색상 하드코딩 금지. `src/constants/colors.ts` 사용.
- 위험도 관련 색상·라벨 하드코딩 금지. `src/constants/risk.ts` 사용.

---

## 패키지 추가 규칙

```bash
# 반드시 이 명령 사용 (npm install 금지)
npx expo install <패키지명>
```

추가 전 Expo Go 호환 여부 확인: https://docs.expo.dev/versions/latest/

---

## 화면 구현 패턴

새 화면을 구현할 때 `src/screens/scan/ScanResultScreen.tsx` 의 구조를 따른다.

- 서비스 레이어 호출 방식 (useEffect + async/await)
- 로딩·에러 상태 처리 패턴 (useState)
- Zustand store 접근 방법 (useUserStore, useScanStore 등)
- 네비게이션 파라미터 수신 방법 (useRoute)
- 다른 화면으로 이동하는 방법 (useNavigation)

피그마 디자인이 제공된 경우 레이아웃·컴포넌트·색상은 피그마를 기준으로 한다.
코드 구조(상태 관리, 서비스 호출, 에러 처리)는 위 레퍼런스 파일을 따른다.

---

## 하지 말 것

- `any` 타입 사용
- `src/mocks/` 직접 import (반드시 `services/` 경유)
- `src/types/index.ts` 외 다른 파일에 타입 정의
- `docs/ia.md`에 없는 화면 임의 추가
- `services/` 함수 시그니처 변경
- `npm install`로 패키지 설치 (`npx expo install` 사용)
- `react-native-vision-camera` 사용 (Expo Go 미지원)
- 화면 컴포넌트에서 API URL 직접 하드코딩
- `docs/api-spec.yaml`에 없는 요청/응답 형태 임의 구현

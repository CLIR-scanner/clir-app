# 검색 탭 — Frontend 구현 지침

> **목표**: 유저 테스터 인터뷰용 검색 기능 구현. "리뷰할 무언가"를 주는 것이 최우선.
> **기준 문서**:
> - `docs/ia.md` §Tab 2: 검색 (/search, /search/result)
> - `docs/api-spec.yaml` — `GET /search/products`, `GET /search/suggestions` (BE Step 0에서 신설)
> - `CLIR/CLAUDE.md` — FE 규칙
>
> **범위**: `CLIR/` (Expo SDK 54 + Expo Go 호환). **Dev Client 불필요** — OCR 파이프라인과 병렬 작업 가능.
>
> 완료 형식: `- [x] 항목명 ✅ tsc: pass`
> 작업 순서는 위에서 아래로 고정.

---

## 설계 원칙

1. **인터뷰 관찰 대상 최대화**: 검색어 입력 · 자동완성 · 필터 적용 · 결과 탭 · 즐겨찾기 토글을 테스터가 모두 눈으로 볼 수 있게
2. **개인화가 드러나야 함**: 같은 검색어라도 사용자의 알러지 프로필에 따라 결과의 위험도 색상이 다르게 보여야 "왜 이 앱이 쓸모 있는지" 체감
3. **MVP 타이트 스코프**: ia.md의 4개 항목(자동완성 · 카테고리 · 성분 필터 · 정렬) 중 인터뷰 핵심 신호가 나올 **상위 2개만 1차 구현**. 나머지는 인터뷰 피드백 후 결정
4. **Expo Go 호환 유지**: OCR Full Product 작업과 병렬 가능. 네이티브 모듈 사용 금지
5. **Mock 우선**: BE Step 0 머지 전까지 `searchProducts` / `searchSuggestions` Mock으로 UI 완성

---

## 전제조건 (명세 · BE 선행)

- [ ] `docs/api-spec.yaml`에 `GET /search/products`, `GET /search/suggestions` 추가 (BE 담당)
- [ ] `docs/ia.md`의 검색 세부 기능 확정 — **1차 스코프는 "텍스트 검색 + 자동완성 + 정렬 + 안전 필터"**, 카테고리 필터와 성분 필터는 2차로 유예

---

## Step 0 — 타입 정의 (`src/types/index.ts`)

- [ ] `SearchSort` 타입:
  ```ts
  export type SearchSort = 'relevance' | 'safety' | 'name';
  ```
- [ ] `SearchFilters` 타입:
  ```ts
  export interface SearchFilters {
    query: string;
    sort: SearchSort;
    safeOnly: boolean;        // 내 프로필 기준 isSafe === true 만
  }
  ```
- [ ] `SearchSuggestion` 타입:
  ```ts
  export interface SearchSuggestion {
    productId: string;
    name: string;
    brand: string;
    highlight: { start: number; end: number }[];  // 매칭 구간 표시용
  }
  ```
- [ ] `SearchResultItem` 타입 — 기존 `Product`보다 가볍게 (리스트 렌더링 최적화):
  ```ts
  export interface SearchResultItem {
    id: string;
    name: string;
    brand: string;
    image?: string;
    riskLevel: RiskLevel;      // 서버가 내 프로필 기준으로 계산
    isSafe: boolean;
    isFavorited: boolean;      // 서버가 내 즐겨찾기 조인해서 반환
  }
  ```
- [ ] `SearchStackParamList` 갱신:
  ```ts
  export type SearchStackParamList = {
    Search: undefined;
    SearchResult: { filters: SearchFilters };
    HistoryProductDetail: { productId: string };   // 재사용
  };
  ```
- [ ] `npx tsc --noEmit` 통과

---

## Step 1 — 서비스 레이어 (`src/services/search.service.ts`)

기존 파일의 시그니처 변경 금지 규칙에 따라 **기존 `searchProducts(query)`는 유지하고 내부 구현만 교체**. 새 함수는 추가.

- [ ] 기존 `searchProducts(query: string): Promise<Product[]>` 유지 — 호환성
- [ ] 신규 `searchProductsV2(filters: SearchFilters, limit?, offset?): Promise<SearchResultItem[]>`
  - 내부에서 `apiFetch('/search/products?q=...&sort=...&safeOnly=...&limit=20&offset=0')`
- [ ] 신규 `searchSuggestions(query: string, limit = 5): Promise<SearchSuggestion[]>`
  - 200ms 디바운스는 화면 레벨에서 처리. 서비스는 단순 호출
- [ ] Mock 경로 — `USE_MOCK` 플래그로 분기. Mock 데이터는 `src/mocks/search.mock.ts`에 정의 (화면은 이 파일 직접 import 금지)
- [ ] 네트워크 에러는 상위로 throw — 화면에서 `ApiError` catch
- [ ] `npx tsc --noEmit` 통과

---

## Step 2 — 최근 검색어 저장 (`src/lib/recentSearches.ts`)

MMKV는 Dev Client 전용. Expo Go 호환 유지를 위해 `@react-native-async-storage/async-storage` 사용.

- [ ] `npx expo install @react-native-async-storage/async-storage`
- [ ] `getRecentQueries(): Promise<string[]>` — 최근 10건, 최신순
- [ ] `addRecentQuery(query: string): Promise<void>` — 중복 제거 후 앞에 추가, 10건 초과 시 뒤에서 버림
- [ ] `clearRecentQueries(): Promise<void>`
- [ ] 저장 키: `@search/recent`
- [ ] `npx tsc --noEmit` 통과

---

## Step 3 — 문자열 상수 (`src/constants/strings.ts`)

하드코딩 금지. i18n 6개 로케일 모두 추가 (`en / ko / ja / zh / es / fr`).

- [ ] `Strings.search.placeholder` — "제품명 또는 브랜드 검색"
- [ ] `Strings.search.empty` — "검색 결과가 없습니다"
- [ ] `Strings.search.errorNetwork` — "검색에 실패했습니다. 네트워크를 확인해주세요."
- [ ] `Strings.search.recentTitle` — "최근 검색"
- [ ] `Strings.search.recentClear` — "전체 삭제"
- [ ] `Strings.search.sortLabel` — "정렬"
- [ ] `Strings.search.sort.relevance` — "관련도순"
- [ ] `Strings.search.sort.safety` — "안전도순"
- [ ] `Strings.search.sort.name` — "이름순"
- [ ] `Strings.search.safeOnlyLabel` — "내게 안전한 제품만"
- [ ] `Strings.search.loading` — "검색 중..."
- [ ] `Strings.search.resultCount` — "{count}개 결과"

---

## Step 4 — SearchScreen 구현 (`src/screens/search/SearchScreen.tsx`)

현재 `PlaceholderScreen` 전체 교체.

### 4-A 레이아웃
- [ ] 상단 검색바 (`TextInput` + 검색 아이콘)
  - `autoFocus` 비활성 (테스터가 탭 진입 의도 확인 후 터치)
  - 우측 X 버튼으로 입력 초기화
- [ ] 검색어 비어있을 때: **최근 검색어 리스트** + "전체 삭제" 링크
- [ ] 검색어 입력 중: **자동완성 제안 리스트** (최대 5개)
- [ ] 자동완성 탭 시: `SearchResultScreen`으로 `{ filters: { query, sort: 'relevance', safeOnly: false } }` navigate
- [ ] "Enter / 검색 버튼" 시: `SearchResultScreen`으로 동일 navigate
- [ ] 최근 검색어 탭 시: 검색바에 채우고 즉시 `SearchResultScreen` navigate + `addRecentQuery()` 갱신

### 4-B 자동완성 디바운스
- [ ] 입력 후 200ms 디바운스 — `setTimeout` + cleanup
- [ ] 2글자 미만일 때는 API 호출 없이 최근 검색어 유지
- [ ] 이전 요청이 늦게 도착해도 현재 입력과 매치될 때만 반영 (race condition 방지 — `requestId` ref 비교)
- [ ] 로딩 중 스피너는 **자동완성 리스트 영역에만** 작게 표시 (화면 전체 덮지 않기)

### 4-C 에러 처리
- [ ] `UnauthorizedError` catch → 로그인 화면 reset (기존 패턴)
- [ ] `ApiError` / 네트워크 실패 → 자동완성 비활성 + 작은 에러 배너 (검색은 계속 가능)
- [ ] `npx tsc --noEmit` 통과

---

## Step 5 — SearchResultScreen 구현 (`src/screens/search/SearchResultScreen.tsx`)

현재 `PlaceholderScreen` 전체 교체. `route.params.filters`로 필터 수신.

### 5-A 레이아웃
- [ ] 상단: 검색어 표시 + "수정" 버튼 (뒤로가기)
- [ ] 툴바: 정렬 토글 3개 (`Relevance / Safety / Name`) + "내게 안전한 제품만" 토글
- [ ] 결과 수 카운트 (`{count}개 결과`)
- [ ] `FlatList` + 페이지네이션 (`onEndReached` → `offset += 20`)
- [ ] 각 행:
  - 썸네일(있으면)
  - 제품명 · 브랜드
  - **위험도 색상 배지** (`constants/risk.ts`의 `safe/caution/danger` 재사용)
  - 우측 하트 아이콘 (즐겨찾기 토글)
- [ ] 행 탭 시: `HistoryProductDetail` 화면으로 이동 (기존 상세 재사용)

### 5-B 상태 관리
- [ ] `useEffect([filters])` — 필터 변경 시 재조회. 페이지 0으로 초기화
- [ ] `loading / empty / error / loaded` 4상태 명시 — 로딩 스피너, 빈 결과 일러스트, 에러 재시도 버튼
- [ ] 정렬/토글 변경은 URL state가 아니라 로컬 state로만 관리 (뒤로가기 시 SearchScreen에서 다시 입력 가능)

### 5-C 즐겨찾기 토글
- [ ] 하트 탭 시 optimistic update:
  - 즉시 `isFavorited` 토글 + `useListStore.addFavorite()` / `removeFavorite()` 호출
  - API 실패 시 롤백 + 토스트
- [ ] 기존 `list.service.ts`의 `addFavorite` / `removeFavorite` 재사용 — 시그니처 변경 금지

### 5-D 개인화 색상
- [ ] 결과 행의 `riskLevel` 색상은 **서버가 내 프로필 기준으로 계산한 값** — 클라이언트에서 재계산 금지 (안전 판정 로직 이원화 방지)
- [ ] `npx tsc --noEmit` 통과

---

## Step 6 — 네비게이션 등록 (`src/navigation/SearchNavigator.tsx`)

- [ ] 기존 `SearchStack` 그대로 사용
- [ ] 헤더 옵션 — `SearchScreen`은 헤더 숨김 / `SearchResultScreen`은 `headerShown: true` + 검색어를 타이틀로
- [ ] `npx tsc --noEmit` 통과

---

## Step 7 — 인터뷰 관찰 계측 (경량)

테스터 인터뷰에서 "어느 지점에서 막혔는가" 판단용 로깅. 별도 분석 인프라 없이 로컬 콘솔 + 선택적 Sentry breadcrumb.

- [ ] `logSearchEvent(name: string, payload: object)` 헬퍼 — `__DEV__`에서는 `console.log`, 운영 빌드에서는 Sentry breadcrumb (Sentry 도입 후)
- [ ] 계측 지점:
  - `search_typed` — 검색어 1글자 입력 시 (throttle)
  - `search_submitted` — 결과 화면 진입 시 (query, sort, safeOnly)
  - `search_result_tapped` — 행 탭 시 (productId, position)
  - `search_filter_changed` — 정렬/안전 토글 변경 시
  - `search_empty_result` — 결과 0건 노출 시
  - `search_favorited` — 하트 탭 시
- [ ] 모든 이벤트는 payload에 `timestamp` + `sessionId`(앱 기동 시 생성한 uuid) 포함
- [ ] `npx tsc --noEmit` 통과

---

## Step 8 — Mock 데이터 (`src/mocks/search.mock.ts`)

BE 미완성 기간에 UI 개발 / 인터뷰 직전 서버 장애 폴백용.

- [ ] 20건 이상의 Mock 제품 — 알러지 제품과 안전 제품이 섞여 있어야 배지 색상 검증 가능
- [ ] `mockSearchProducts(filters)` — query 부분 문자열 매칭 + sort / safeOnly 반영
- [ ] `mockSearchSuggestions(query)` — 간단한 prefix 매칭
- [ ] 화면 컴포넌트에서 직접 import 금지 — 반드시 `search.service.ts`의 `USE_MOCK` 분기 경유 (CLAUDE.md 규칙)

---

## Step 9 — 전체 검증

- [ ] `cd CLIR && npx tsc --noEmit` — 무오류
- [ ] 시나리오 A (기본 검색): "sprite" 입력 → 자동완성 ≥ 1건 → 탭 → 결과 화면에 최소 1개 노출
- [ ] 시나리오 B (빈 결과): "zzzzz" → "검색 결과가 없습니다" 일러스트
- [ ] 시나리오 C (안전 필터): 내 알러지 프로필에 포함된 성분이 있는 제품 하나 찾아두고, "내게 안전한 제품만" ON 시 그 제품이 사라지는지
- [ ] 시나리오 D (정렬): 3가지 정렬 토글 각각 결과 순서 바뀌는지 육안 확인
- [ ] 시나리오 E (즐겨찾기): 하트 탭 → List 탭에서 즐겨찾기에 즉시 반영
- [ ] 시나리오 F (페이지네이션): 21번째 아이템까지 스크롤 시 자동 추가 로드
- [ ] 시나리오 G (네트워크 오프): 기기 에어플레인 모드 → 검색 에러 배너 + 재시도 버튼 동작
- [ ] 시나리오 H (최근 검색어): 3회 검색 후 SearchScreen 복귀 → 최근 검색어 3개 표시 → "전체 삭제" 동작

---

## Step 10 — 인터뷰 준비

- [ ] 테스터 5–8명 모집. 기준: 알러지 보유자 3명 이상, 비보유자 2명 이상
- [ ] 프로필 시드 준비 — 인터뷰 전 각 테스터 디바이스에 알러지 프로필 세팅 (Survey 완주 유도)
- [ ] 인터뷰 스크립트 5문항:
  1. "땅콩이 없는 과자를 찾고 싶다고 해볼게요. 어떻게 하시겠어요?" (자연스러운 검색 발견성)
  2. "결과 목록에서 색상이 다른 이유를 알겠어요?" (위험도 배지 해독)
  3. "정렬이나 필터는 써보셨나요?" (추가 기능 발견성)
  4. "검색이 기대한 대로 작동했나요?" (자동완성 품질)
  5. "이 앱에 검색이 없었다면 어땠을까요?" (가치 검증)
- [ ] 각 세션 후 `tasks/lessons.md`에 관찰/인용 기록
- [ ] 인터뷰 5건 완료 후 2차 스코프 결정 (카테고리 필터 / 성분 필터 추가 여부)

---

## 하지 말 것

- **`services/searchProducts(query)` 시그니처 변경** — 기존 호환 유지. V2는 신규 함수로 추가
- **`src/mocks/` 화면에서 직접 import** — 반드시 `services/` 경유
- **클라이언트에서 `riskLevel` 재계산** — 서버 응답 값을 그대로 사용. 이원화 금지
- **MMKV / Dev Client 전용 패키지 사용** — AsyncStorage로 충분
- **검색 결과 무한 로드 상한 없음** — offset 300 초과 시 "더 구체적으로 검색해주세요" 표시
- **하드코딩 문자열** — `Strings.search.*` 경유
- **자동완성 모든 키 입력마다 API 호출** — 200ms 디바운스 필수
- **이전 요청의 늦은 응답을 현재 입력에 반영** — `requestId` ref로 방어

---

## 완료 기준 요약

| Step | 완료 판단 |
|---|---|
| 0 | `tsc --noEmit` 통과, 타입 5종 정의 |
| 1 | Mock 모드에서 서비스 함수 동작 |
| 2 | 최근 검색어 앱 재시작 후 유지 |
| 3 | `Strings.search.*` 10+ 키 6개 로케일 존재 |
| 4 | 검색바 · 자동완성 · 최근 검색어 표시 |
| 5 | 결과 리스트 + 정렬 + 필터 + 즐겨찾기 |
| 6 | 네비게이션 동작 |
| 7 | 7개 이벤트 콘솔 로그로 확인 |
| 8 | 서비스 분기 동작 |
| 9 | 시나리오 A–H 모두 통과 |
| 10 | 인터뷰 5건 + lessons 기록 |

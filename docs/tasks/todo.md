# CLIR MVP 작업 목록

완료 형식: `- [x] 항목명 ✅ build: pass`

---

## Phase 0: 프로젝트 세팅

- [x] RN 프로젝트 초기화 → Expo SDK 54 마이그레이션 ✅ build: pass
- [x] Step 2: 의존성 전체 설치 (expo-camera, navigation, reanimated, gesture-handler, bottom-sheet, zustand) ✅
- [x] Step 3: 폴더 구조 생성 (src/ 하위 전체) ✅
- [x] Step 4: 타입 정의 (src/types/index.ts — 전체 ParamList + SignupData 포함) ✅ build: pass
- [x] Step 5: Mock 데이터 (user / product / ingredient / scanHistory) ✅
- [x] Step 6: 서비스 레이어 (scan / auth / user / list / recommend / search) ✅
- [x] Step 7: Zustand 스토어 (user / scan / list) ✅
- [x] Step 8: 네비게이션 Skeleton (5탭 + Auth + 전체 화면 skeleton) ✅ build: pass
- [x] Step 9: 상수 파일 (colors / strings) ✅
- [x] Step 10: 최종 검증 + git commit ✅ tsc: pass
- [x] Step 11: 코드 리뷰 후 수정 (W1: VERDICT_COPY Record<RiskLevel,...>, W2: toggleShoppingItemPurchased 해시 기반 mock, 가드 패턴 일관성) ✅ tsc: pass

---

## Phase 1: MVP 핵심 화면 (docs/ia.md MVP Scope 기준)

### 온보딩
- [x] /splash ✅ build: pass
- [x] /auth (회원가입/로그인 선택) ✅ build: pass
- [x] /auth/signup ✅ build: pass
- [x] /auth/signup/survey (알러지·식이·건강목표 설문) ✅ build: pass
- [x] /auth/login ✅ build: pass

### Tab 1: 바코드/사진 스캔 (핵심)
- [x] /scan (카메라 스캔 메인) ✅ build: pass
- [x] /scan/result (스캔 결과 + 위협 판정 UI) ✅ build: pass
- [x] /scan/result/detail (성분 상세 바텀시트 — ScanResultScreen 내 BottomSheet) ✅ build: pass
- [x] /scan/history (스캔 이력) ✅ build: pass

### Tab 5: 프로필/설정 (알러지 프로필)
- [x] /profile ✅ build: pass
- [x] /profile/personalization/allergy (식이제한 관리) ✅ build: pass
- [x] /profile/personalization/sensitivity (민감도 설정) ✅ build: pass
- [x] /profile/multi (멀티 프로필) ✅ build: pass

---

## Phase 2: 보조 화면

### Tab 2: 검색
- [ ] /search ← build gate
- [ ] /search/result ← build gate

### Tab 3: List
- [ ] /list/favorites ← build gate
- [ ] /list/favorites/memo ← build gate
- [ ] /list/shopping ← build gate
- [ ] /list/shopping/items ← build gate

### Tab 4: 추천
- [ ] /recommend/weekend ← build gate
- [ ] /recommend/similar-users ← build gate

### 나머지 프로필 화면
- [ ] /profile/personal (개인정보 설정) ← build gate
- [ ] /profile/personalization/related ← build gate
- [ ] /profile/personalization/health-check ← build gate
- [ ] /profile/settings ← build gate

---

## Phase 3: 백엔드 연동

### 3-A. 백엔드 API (clir-api develop 브랜치) — 전체 완료 ✅

#### 인프라
- [x] clir-api/ Fastify 프로젝트 초기화 (TypeScript, multipart, cors) ✅
- [x] src/lib/supabase.ts — service role client (환경변수 미설정 시 null 반환) ✅
- [x] src/lib/auth.ts — verifyToken preHandler + FastifyRequest.userId augmentation ✅
- [x] src/lib/safety.ts — computeVerdict / computeIsSafe 공용 판정 유틸 ✅
- [x] GET /health 엔드포인트 ✅

#### 인증
- [x] POST /auth/signup — auth.signUp + profiles insert + 롤백 처리 ✅
- [x] POST /auth/survey — JWT 인증 + profiles update (PGRST116 → 404) ✅
- [x] POST /auth/login — signInWithPassword + profiles 조회 + token 반환 ✅

#### 제품 / 스캔
- [x] GET /products/:barcode — Supabase seed → OFF US API → USDA FDC enrichment ✅
- [x] GET /products/:id/alternatives — trace_ids + sensitivity_level 반영, isSafe 실계산 ✅
- [x] POST /ocr — OpenAI gpt-4o-mini Vision 기반 성분 추출 ✅
- [x] POST /analysis — 서버사이드 성분 조회 + 위험도 판정 + dataCompleteness ✅

#### 성분
- [x] GET /ingredients/:id — 알러겐 9종+귀리 정적 레지스트리, sources: {title,url}[] ✅

#### 스캔 이력
- [x] POST /scan-history — productId 있으면 서버사이드 재판정 (클라이언트 result 무시) ✅
- [x] GET /scan-history — 현재 프로필 기준 isSafe 실계산 ✅

#### 즐겨찾기
- [x] POST /favorites — 원자적 insert + 23505 → 409 처리 ✅
- [x] GET /favorites — 현재 프로필 기준 isSafe 실계산 ✅
- [x] DELETE /favorites/:id — user_id 소유 확인 후 삭제 ✅

---

### 3-B. Supabase 스키마 설정 — ⚠️ 미완료 (연동 전 필수)

아래 순서대로 Supabase SQL Editor에서 실행 후 체크.

- [ ] `profiles` 테이블 생성 + RLS
  ```sql
  create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    allergy_profile text[] not null default '{}',
    dietary_restrictions text[] not null default '{}',
    sensitivity_level text not null default 'normal'
  );
  alter table profiles enable row level security;
  create policy "own profile" on profiles for all using (auth.uid() = id);
  ```
- [ ] `products` 테이블 생성 + RLS
  ```sql
  create table products (
    id text primary key,
    barcode text unique,
    name text not null,
    brand text not null default '',
    image_url text,
    ingredients_text text default '',
    allergen_ids text[] not null default '{}',
    trace_ids text[] not null default '{}'
  );
  alter table products enable row level security;
  create policy "read all products" on products for select using (true);
  ```
- [ ] `scan_history` 테이블 생성 + RLS
  ```sql
  create table scan_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id text references products(id),
    result text not null check (result in ('safe','caution','danger')),
    scanned_at timestamptz not null default now()
  );
  alter table scan_history enable row level security;
  create policy "own history" on scan_history for all using (auth.uid() = user_id);
  create index on scan_history(user_id, scanned_at desc);
  ```
- [ ] `favorites` 테이블 생성 + RLS + **unique 제약** (POST /favorites 원자성에 필수)
  ```sql
  create table favorites (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id text not null references products(id),
    added_at timestamptz not null default now(),
    unique (user_id, product_id)          -- ← 반드시 포함
  );
  alter table favorites enable row level security;
  create policy "own favorites" on favorites for all using (auth.uid() = user_id);
  ```
- [ ] Seed INSERT (Cheerios, Reese's, Nature Valley 3개) — `docs/backend-us.md` Section 5 참조

---

### 3-C. 환경변수 설정 — ⚠️ 미완료

- [ ] `clir-api/.env` — 실제 Supabase 값으로 교체
  ```env
  SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  OPENAI_API_KEY=sk-...
  OFF_USER_AGENT=CLIR/1.0 (contact@clir.app)
  ```
- [ ] `CLIR/.env` — FE 연동 URL 설정
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
  ```

---

### 3-D. FE 서비스 레이어 교체 — ⚠️ 미완료 (3-B·3-C 완료 후 진행)

- [ ] `auth.service.ts` — signUp(), login() 구현부 → 백엔드 호출로 교체
- [ ] `scan.service.ts` — scanBarcode(), recognizeIngredients() 구현부 → 백엔드 호출로 교체
- [ ] `list.service.ts` — saveScanHistory(), getScanHistory(), favorites 구현부 교체
- [ ] `CLIR/npx tsc --noEmit` 통과 확인

---

### 3-E. 배포 — ⚠️ 미완료 (3-D 완료 후 진행)

- [ ] `clir-api/Dockerfile` 작성
- [ ] Railway 프로젝트 생성 + GitHub 연결
- [ ] Railway 환경변수 설정 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)
- [ ] 프로덕션 URL로 `CLIR/.env` `EXPO_PUBLIC_API_BASE_URL` 교체

---

## Phase 4: 완성도

- [ ] docs/design-tokens.md 반영 (디자이너 산출물 도착 시)
- [ ] 엣지케이스 전체 점검 (빈 데이터, 네트워크 에러, 권한 거부)
- [ ] iOS / Android 테스트 빌드
- [ ] 성능 최적화 (FlatList, 이미지 캐싱)

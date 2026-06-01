// ⚠️  이 파일의 도메인 엔티티 타입(Product, Ingredient, OCRResult 등)은
//     clir-api/src/types/index.ts와 항상 동일하게 유지해야 한다.
//     변경 시 반드시 양쪽 동시 수정.
//
//     의도적 추가 항목 (FE 전용):
//       - *Store 인터페이스, *ParamList 타입 — BE에 없음

// ─── Primitives ───────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'caution' | 'danger';
export type SensitivityLevel = 'strict' | 'normal';
/** RiskLevel alias — ScanHistory.result 필드에 사용 */
export type ScanResult = RiskLevel;
/** 바코드 DB에서 가져온 제품 성분 정보의 완성도 */
export type DataCompleteness = 'complete' | 'partial' | 'not_found';
/** BCP-47 언어 코드 */
export type BCP47 = string;
/** 제품 레코드 출처 */
export type ProductSource = 'seed' | 'off' | 'ocr';
/** OCR 캐시 히트 경로 */
export type CacheHit = 'none' | 'phash-local' | 'phash-server' | 'barcode';
/** 폴백 사다리 단계 */
export type LadderStage = 1 | 2 | 3 | 4 | 5;

// ─── Domain Entities ──────────────────────────────────────────────────────────

export interface IngredientSummary {
  id: string;
  name: string;
  nameKo: string;
  /**
   * OCR 인식 신뢰도 (0.0–1.0). 바코드 경로에서는 생략.
   * 0이면 판독 실패 ([illegible]), 0.85 미만은 클라이언트에서 저신뢰 경고.
   */
  confidence?: number;
  /**
   * 과도기 — 다국어 성분명. 최종적으로 name/nameKo를 대체 예정
   * (docs/ocr-pipeline-rebuild-guide.md §10.2). 전환기에는 name/nameKo와 공존.
   */
  translations?: Record<BCP47, string>;
}

export interface Ingredient extends IngredientSummary {
  /**
   * 성분 설명. 전환기 union:
   * - 단일 string: BE 가 단일 언어 (한국어 legacy) 만 반환하던 시점의 shape
   * - Record<BCP47, string>: BE 다국어 카탈로그 마이그레이션 후 shape (en/ko/ja/zh/es/fr)
   * FE 는 getIngredientDescription(...) 헬퍼로 두 경우 모두 처리.
   * OCR 추출 성분은 빈 dict 또는 빈 문자열 → 화면에서 description 영역 숨김.
   */
  description: string | Record<BCP47, string>;
  riskLevel: RiskLevel;
  /** 근거자료 링크 목록 */
  sources: { title: string; url: string }[];
  /** may-contain 성분이 연관된 알러겐 ID (예: 'ing-may-peanut' → 'ing-peanut') */
  relatedAllergenId?: string;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand: string;
  image?: string;
  ingredients: Ingredient[];
  /** 현재 activeProfile 기준 안전 여부 */
  isSafe: boolean;
  riskLevel: RiskLevel;
  riskIngredients: Ingredient[];
  mayContainIngredients: Ingredient[];
  alternatives: Product[];
  /** 바코드 DB 성분 정보 완성도 */
  dataCompleteness?: DataCompleteness;
  /** 64-bit perceptual hash — OCR 업서트 시 설정 */
  phash?: string;
  /** 레코드 출처 */
  source?: ProductSource;
  /** 제품 카테고리 (FE 검색 필터용) */
  category?: string;
}

export interface SimilarUserReview {
  id: string;
  product: Product;
  author: string;
  location: string;
  rating: number;
  tag: string;
  body: string;
  likeCount: number;
  commentCount: number;
}

/** POST /ocr 응답 (SSE 스트림 종료 후 합산 결과 또는 캐시 히트 즉시 응답) */
export interface OCRResult {
  /** 이미지에서 추출한 원문 텍스트 */
  extractedText: string;
  /** 파싱된 성분 목록 (알러겐은 ing-* ID, 일반 성분은 ocr-{n} ID) */
  ingredients: IngredientSummary[];
  /** OCR 추출의 전체 신뢰도 (0.0–1.0). 0.85 미만이면 클라에서 경고 배너. */
  overallConfidence?: number;
  /** 판독 불가 영역 수. > 0이면 일부 성분 누락 가능성. */
  illegibleRegions?: number;
  /** 감지된 언어 목록 (BCP-47) */
  detectedLanguages?: BCP47[];
  /** product-upsert 파이프라인이 반환한 제품 ID. 즐겨찾기·이력 저장 시 사용. */
  productId?: string;
  /** 실제 추출에 도달한 폴백 사다리 단계 (관측성용) */
  ladderStage?: LadderStage;
  /** scan_logs 테이블에 기록된 이 스캔의 로그 ID. 교정 제출 시 사용. */
  scanLogId?: string;
  /** 캐시 히트 경로 */
  cacheHit?: CacheHit;
}

/** SSE `done` 이벤트의 data — OCRResult에서 ingredients/extractedText를 뺀 메타. */
export interface OCRDoneMeta {
  overallConfidence: number;
  illegibleRegions: number;
  detectedLanguages: BCP47[];
  productId?: string;
  ladderStage: LadderStage;
  scanLogId?: string;
  cacheHit: CacheHit;
}

/** SSE `error` 이벤트의 data. */
export interface OCRErrorEvent {
  error: string;
  message: string;
  retryable: boolean;
  ladderStage?: LadderStage;
}

/** SSE 이벤트 판별 union — FE 이벤트 핸들러의 타입 가드 기준. */
export type OCRSSEEvent =
  | { type: 'cached';     data: OCRResult }
  | { type: 'ingredient'; data: IngredientSummary }
  | { type: 'done';       data: OCRDoneMeta }
  | { type: 'error';      data: OCRErrorEvent };

/** POST /analysis 응답 */
export interface AnalysisResult {
  verdict: RiskLevel;
  isSafe: boolean;
  /** 위험·주의 판정을 유발한 성분 목록 */
  triggeredBy: TriggeredIngredient[];
  safeIngredients: IngredientSummary[];
  /**
   * 분석 대상 성분 데이터 완성도.
   * 'partial': productId 미제공(OCR) 또는 DB 미등록 제품 — 결과 신뢰도 낮음.
   * 'complete': 서버사이드 DB 조회로 성분 확정.
   */
  dataCompleteness: 'complete' | 'partial';
}

export interface TriggeredIngredient extends IngredientSummary {
  /** 판정 이유 (예: "알러지 프로필에 등록된 성분입니다.") */
  reason: string;
  riskLevel: 'danger' | 'caution';
}

/** GET /search/products items[] — 서버에서 개인화 판정 후 반환 */
export interface SearchResultItem {
  id: string;
  name: string;
  brand: string;
  image?: string;
  category?: string;
  riskLevel: RiskLevel;
  isSafe: boolean;
  isFavorited: boolean;
}

/** GET /search/suggestions suggestions[] — 개인화 없는 prefix 매칭 결과 */
export interface SearchSuggestion {
  productId: string;
  name: string;
  brand: string;
  highlight: SearchHighlight[];
}

/** 자동완성 UI에서 매칭 구간을 강조하기 위한 인덱스 정보 */
export interface SearchHighlight {
  field: 'name' | 'brand';
  start: number;
  end: number;
}

/** 개인정보 동의 플래그 — profiles 테이블 컬럼과 동일 shape. */
export interface ConsentFlags {
  imageRetention: boolean;
  corrections: boolean;
}

export interface Profile {
  id: string;
  name: string;
  profileImage?: string;
  allergyProfile: string[];
  dietaryRestrictions: string[];
  sensitivityLevel: SensitivityLevel;
}

export interface User extends Profile {
  email: string;
  language: string;
  /** 커뮤니티 전용 표시명. NULL/미설정 = 커뮤니티에서 '익명' 표시(BE 보장). optional — 0010 Supabase 적용 전 undefined 가능. */
  displayName?: string | null;
  multiProfiles: Profile[];
  consentFlags: ConsentFlags;
  hasCompletedSurvey?: boolean;
  /** 약관 동의 시각 (ISO8601). null = 미동의 또는 legacy. BE profiles.terms_accepted_at 동기. */
  termsAcceptedAt?: string | null;
  /** 동의한 약관 버전. TERMS_VERSION 상수와 다르면 가입 직후 acceptTerms() 자동 호출. */
  termsVersion?: string | null;
}

export interface ScanHistory {
  id: string;
  productId: string;
  userId: string;
  scannedAt: Date;
  result: ScanResult;
  product: Product;
  /** 플라이휠 — 이 이력과 scan_logs / corrections 연결. */
  scanLogId?: string;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  userId: string;
  memo?: string;
  addedAt: Date;
  product: Product;
}

export interface ShoppingItem {
  id: string;
  productId: string;
  userId: string;
  isPurchased: boolean;
  addedAt: Date;
  product: Product;
}

/** Q&A 카테고리 4종 — 'all' 은 product/allergy/vegetarian 어떤 필터에도 매칭되는 유니버설 값.
 *  api-spec.yaml QnaPostSummary.category enum 과 1:1 매칭. */
export type QnaCategory = 'all' | 'product' | 'allergy' | 'vegetarian';

export interface QAQuestion {
  id: string;
  label: string;          // CATEGORY_LABEL[category] (FE 표시명)
  title: string;
  body: string;
  author: string;
  /** 작성자 user id — 본인 글 판별 (isMine = userId === currentUser.id). */
  userId: string;
  viewCount: number;
  answerCount: number;
  isNotice?: boolean;
  /** 백엔드 category 원본 — 필터 칩·라벨 매핑용. */
  category?: QnaCategory;
  /** 첨부 이미지 signed URL (TTL 5분). 목록은 항상 빈 배열·undefined, 상세에서만 채워짐. */
  images?: string[];
}

export interface QAAnswer {
  id: string;
  questionId: string;
  /** 작성자 user id — 본인 답변 판별. */
  userId: string;
  author: string;
  body: string;
  createdAt: string;
}

// ─── Community Domain Types (F3) ─────────────────────────────────────────────
// api-spec.yaml Community 스키마 1:1 매핑.
// nullable/optional 규칙(리뷰 #1-Minor):
//   스펙 nullable:true → T|null
//   required 미포함   → key?: T
//   둘 다             → key?: T|null

/** GET /products/:id/reviews items[] */
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
  userNickname?: string;
}

/** GET /products/:id/likes 응답 + POST/DELETE 응답 공용.
 *  likeCount = products.like_count(트리거 비정규화 값) 조회 — 즉석 count 금지. */
export interface LikeState {
  productId: string;
  isLiked: boolean;
  likeCount: number;
}

/** GET /qna items[] — answerCount = qna_posts.answer_count(트리거) 조회. */
export interface QnaPostSummary {
  id: string;
  userId: string;
  title: string;
  content: string;
  answerCount: number;
  isResolved: boolean;
  createdAt: string;
  userNickname?: string;
  updatedAt?: string;
  relatedProductId?: string | null;
}

/** GET /qna/:id 의 answers[] 항목 */
export interface QnaAnswer {
  id: string;
  qnaId: string;
  userId: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  userNickname?: string;
}

/** GET /qna/:id 응답 — QnaPostSummary allOf + relatedProduct + answers */
export type QnaPostDetail = QnaPostSummary & {
  relatedProduct?: { productId: string; name: string; image: string | null } | null;
  /** 해당 게시글의 전체 답변 목록 (required, 비절단) */
  answers: QnaAnswer[];
};

/** GET /community/feed items[] */
export interface CommunityFeedItem {
  productId: string;
  name: string;
  isSafe: boolean;
  riskLevel: RiskLevel;
  likeCount: number;
  /** weekly_trending 조회 수, similar_picks 는 null */
  scanCount?: number | null;
  brand?: string | null;
  image?: string | null;
}

/** GET /community/feed 응답 — 두 큐레이션 리스트 동시 반환 (페이지네이션 없음). */
export interface CommunityFeedResponse {
  weeklyTrending: CommunityFeedItem[];
  similarUsersPicks: CommunityFeedItem[];
}

export interface MagazineItem {
  id: string;
  title: string;
  body: string;
  image: string;
  category?: string;
  publishedAt: string;
  isBookmarked?: boolean;
}

// ─── Alternatives ────────────────────────────────────────────────────────────

export type AlternativeReason = 'same_category' | 'brand_match' | 'user_frequent' | 'user_favorite' | 'fallback';

export interface ProductAlternative {
  id: string;
  name: string;
  brand: string;
  image?: string;
  isSafe: boolean;
  reason?: AlternativeReason;
}

// ─── Health Reports ───────────────────────────────────────────────────────────

export interface HealthReport {
  id: string;
  userId: string;
  title: string;
  reportDate?: string;
  fileMime: 'application/pdf' | 'image/jpeg' | 'image/png';
  fileSizeBytes: number;
  extractedAllergenIds: string[];
  notes: string;
  uploadedAt: string;
}

export interface HealthReportDownload {
  id: string;
  downloadUrl: string;
  expiresAt: string;
}

// ─── Multi-Profile ────────────────────────────────────────────────────────────

export interface MemberProfile {
  id: string;
  ownerId: string;
  name: string;
  profileImage?: string;
  allergyProfile: string[];
  dietaryRestrictions: string[];
  sensitivityLevel: SensitivityLevel;
  createdAt: string;
  updatedAt: string;
}

export type MemberProfileInput = Pick<MemberProfile,
  'name' | 'profileImage' | 'allergyProfile' | 'dietaryRestrictions' | 'sensitivityLevel'>;

export type MemberProfileUpdate = Partial<MemberProfileInput>;

// ─── Observability / Flywheel ────────────────────────────────────────────────

/** Supabase scan_logs 테이블의 도메인 표현 (snake_case 컬럼 → camelCase). */
export interface ScanLog {
  id: string;
  userId?: string;
  phash: string;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  extraction: unknown;
  userCorrections?: unknown;
  latencyMs: number;
  cacheHit: CacheHit;
  ladderStage: LadderStage;
  estCostUsd: number;
  createdAt: string;
}

/** 유저가 교정한 성분 1개. POST /corrections 요청/응답 공용. */
export interface CorrectionEntry {
  ingredientId?: string;
  originalName: string;
  correctedName: string;
}

/** Supabase corrections 테이블의 도메인 표현. */
export interface Correction {
  id: string;
  scanLogId: string;
  userId: string;
  corrections: CorrectionEntry[];
  createdAt: string;
}

// ─── Closed Beta ──────────────────────────────────────────────────────────────

/** 지원 로케일 3종 (영어/한국어/스페인어). i18n·waitlist.locale 공통. */
export type SupportedLocale = 'en' | 'ko' | 'es';

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


// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface SurveyData {
  allergyProfile: string[];
  dietaryRestrictions: string[];
  sensitivityLevel: SensitivityLevel;
}

// ─── Store Interfaces ─────────────────────────────────────────────────────────

export interface UserStore {
  currentUser: User;
  activeProfile: Profile;
  isInitialized: boolean;
  /**
   * 활성 프로필 변경(로그인·전환·편집 동기화) 때마다 단조 증가하는 카운터.
   * 화면들의 useEffect dependency 로 사용해 stale 데이터 자동 재조회 트리거.
   * 값 자체엔 의미 없음 — "변경됐다"는 신호로만 사용.
   */
  profileVersion: number;
  /** 스캔 시 메인 프로필에 추가로 적용할 멀티 프로필 ID 목록 */
  enabledProfileIds: string[];
  /**
   * 사용자가 *이 디바이스에서* 언어를 명시 선택했는지 여부.
   * - false (디폴트): setUser 시 BE 의 user.language 를 채택 + AsyncStorage 에 캐시 (다중 디바이스 first-run 호환)
   * - true: setUser 시 BE 값 무시, currentUser.language 보존 (사용자 의도 우선)
   * AsyncStorage 하이드레이션 또는 setLanguage 호출 시 true 로 전환.
   */
  hasExplicitLanguage: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
  /** 멀티 프로필 스캔 적용 토글 (메인 프로필은 항상 적용) */
  toggleProfileEnabled: (profileId: string) => void;
  updateActiveProfile: (updates: Partial<Profile>) => void;
  /**
   * 서버(POST /auth/survey)에 알러지·식이·민감도를 전체-치환 저장.
   * 낙관적 업데이트 → 실패 시 롤백 + throw. 메인 프로필(activeProfile.id === currentUser.id)에서만 서버 동기화.
   */
  syncActiveProfile: (
    updates: Partial<Pick<Profile, 'allergyProfile' | 'dietaryRestrictions' | 'sensitivityLevel'>>,
  ) => Promise<void>;
  updateUserName: (name: string) => void;
  /** store 의 currentUser.displayName 을 낙관적으로 갱신한다. */
  updateUserDisplayName: (displayName: string | null) => void;
  setLanguage: (language: string) => void;
  addMultiProfile: (profile: Omit<Profile, 'id'>) => Promise<Profile>;
  updateMultiProfile: (profileId: string, updates: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  deleteMultiProfile: (profileId: string) => Promise<void>;
  /** BE /profiles/members 목록을 불러와 currentUser.multiProfiles 갱신. */
  loadMultiProfiles: () => Promise<void>;
  /** 멀티 프로필 추가 설문 진행 중 여부 (FE 전용) */
  multiProfileMode: boolean;
  multiProfileName: string;
  setMultiProfileMode: (active: boolean, name?: string) => void;
}

/**
 * BE 동기화 실패한 스캔 큐. AsyncStorage 로 영구화되어 앱 재시작·네트워크
 * 회복 후 자동 재시도(processRetryQueue) 대상이 된다.
 *
 * 'ocr-local-' 접두사(BE upsert 실패 — productId 없음) 항목은 BE 가 어차피
 * FK 위반으로 받지 못하므로 큐에 넣지 않는다. saveScanHistory 호출이 실패한
 * 경우(network / 500 / TIMEOUT 등) 만 enqueue.
 */
export interface RetryScanItem {
  /** 큐 식별자 — 로컬 store 의 ScanHistory.id 와 동일 (replaceHistory 키) */
  localId: string;
  /** BE 가 알고 있는 productId — 'ocr-{phash}' 또는 바코드 */
  productId: string;
  result: RiskLevel;
  /** 재시도 횟수 (상한 5회) */
  tries: number;
  /** 첫 enqueue 시각(ms) — 24h 이후 폐기 */
  firstAttemptAt: number;
}

export interface ScanStore {
  history: ScanHistory[];
  // 캐시 무효화 메타 — 매 화면 진입 fetch 방지(stale 시에만 재조회)
  historyDirty: boolean;          // true = 다음 진입 시 재조회 필요
  historySyncedAt: number | null; // 마지막 서버 동기화 시각(ms) — TTL 판정용
  // BE 동기화 실패 항목 — AsyncStorage 영구화 + 네트워크 회복 시 재시도
  retryQueue: RetryScanItem[];
  setHistory: (items: ScanHistory[]) => void;
  addHistory: (item: ScanHistory) => void;
  /** store-first 흐름: local id 로 추가된 항목을 BE 응답의 server id 로 교체. */
  replaceHistory: (localId: string, item: ScanHistory) => void;
  clearHistory: () => void;
  markHistoryDirty: () => void;
  markHistorySynced: () => void;
  /** saveScanHistory 실패 시 호출. localId 는 history 의 임시 ID. */
  enqueueRetry: (item: Omit<RetryScanItem, 'tries' | 'firstAttemptAt'>) => void;
  /**
   * 큐 처리 (성공·만료 항목 제거). 반환: { synced, dropped, remaining } 통계.
   * App foreground 진입 / ScanHistoryScreen pull-to-refresh 시 호출.
   */
  processRetryQueue: () => Promise<{ synced: number; dropped: number; remaining: number }>;
}

export interface ListStore {
  favorites: FavoriteItem[];
  shoppingItems: ShoppingItem[];
  // 캐시 무효화 메타 — 매 화면 진입 fetch 방지(stale 시에만 재조회)
  favoritesDirty: boolean;          // true = 다음 진입 시 재조회 필요
  favoritesSyncedAt: number | null; // 마지막 서버 동기화 시각(ms) — TTL 판정용
  setFavorites: (items: FavoriteItem[]) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  markFavoritesDirty: () => void;
  markFavoritesSynced: () => void;
  setShoppingItems: (items: ShoppingItem[]) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  removeShoppingItem: (id: string) => void;
  togglePurchased: (id: string) => void;
}

// ─── Navigation Param Lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

/** 설문 진행 중 누적되는 데이터 (소셜 로그인 후 최초 진입 시에만 통과) */
export type SurveyParams = {
  dietaryType?: 'allergy' | 'vegetarian' | 'both';
  hasAllergyDoc?: boolean;
  allergySeverity?: 'mild' | 'moderate' | 'severe';
  allergyReactionType?: 'immediate' | 'delayed' | 'not_sure';
  vegetarianType?: 'fruitarian' | 'vegan' | 'lacto_vegetarian' | 'ovo_vegetarian' | 'lacto_ovo_vegetarian' | 'pesco_vegetarian' | 'pollo_vegetarian' | 'flexitarian';
  veganStrictness?: 'strict' | 'flexible';
  /** Both 플로우: 알러지 플로우에서 수집한 allergyProfile을 채식 플로우로 전달 */
  allergyProfileJson?: string;
};

// ─── Legal / Terms ────────────────────────────────────────────────────────────

export type TermsSectionKey =
  | 'terms'
  | 'privacy'
  | 'personalInfo'
  | 'healthDisclaimer'
  | 'ageConfirm'
  | 'marketing'
  | 'dataAnalytics';

export interface TermsAgreementListItem {
  id: TermsSectionKey;
  title: string;
  required: boolean;
  description?: string;
  secondLine?: string;
  hasDetail?: boolean;
}

export interface LegalSectionContent {
  id: TermsSectionKey;
  title: string;
  required: boolean;
  lastUpdated: string;
  body: string;
}

export type AuthStackParamList = {
  Splash: undefined;
  /** 사전 약관 동의 — 로그인 버튼 진입 시점에 노출. 동의 완료 후 pendingProvider 로 OAuth 이어가기. */
  TermsAgreement: { agreedSection?: TermsSectionKey; pendingProvider?: 'google' | 'apple' } | undefined;
  /** 약관 항목별 원문 상세 — TermsAgreement 에서 chevron 클릭 시 진입 */
  TermsDetail: { section: TermsSectionKey; agreed?: boolean };
  /** pendingProvider 가 있으면 약관 동의 직후 해당 provider 로그인 자동 진행 */
  AuthHome: { pendingProvider?: 'google' | 'apple' } | undefined;
  /** Survey 0: 설문 시작 랜딩 (Skip 가능) */
  SurveyLanding: SurveyParams;
  /** Survey 1: 식이 유형 선택 */
  Survey: SurveyParams;
  /** @deprecated 진단서 flow 제거됨 — 파일 보존용 */
  SurveyAllergy: SurveyParams;
  /** @deprecated 진단서 flow 제거됨 — 파일 보존용 */
  SurveyAllergyDoc: SurveyParams;
  /** @deprecated 진단서 flow 제거됨 — 파일 보존용 */
  SurveyAllergyDocResult: SurveyParams;
  /** Survey 2-A: 알러지 심각도 선택 */
  SurveyAllergySelect: SurveyParams;
  /** Survey 2-A Edit: 성분 직접 편집 */
  SurveyAllergyEditList: SurveyParams & { categoriesJson: string };
  /** Survey 4-A-No: 반응 유형 선택 (즉각/지연/모름) */
  SurveyAllergyReaction: SurveyParams;
  /** Survey 5-A-No: 알러지 유발 식품 직접 선택 */
  SurveyAllergyIngredients: SurveyParams;
  /** Survey 6-A-No: 선택한 성분 확인 및 완료 */
  SurveyAllergyConfirm: SurveyParams & { selectionJson: string };
  /** Survey 2-B: 채식 유형 선택 (Vegetarian / Both 플로우) */
  SurveyVegetarian: SurveyParams;
  /** Survey 3-B: Vegan 선택 시 엄격도 선택 */
  SurveyVeganStrictness: SurveyParams;
  /** Survey 4-B: 선택한 채식 preference 확인 */
  SurveyDietConfirm: SurveyParams;
  /** Survey 5-B: 식단 기반 avoided ingredients 확인 */
  SurveyVegetarianIngredients: SurveyParams;
};

export type MainTabParamList = {
  ScanTab: undefined;
  SearchTab: undefined;
  ListTab: undefined;
  RecommendTab: undefined;
  ProfileTab: undefined;
};

export type ScanStackParamList = {
  /** previousTab: 탭바 스캔 버튼 진입 시 직전 활성 탭 — 뒤로가기로 복귀 */
  Scan: { previousTab?: keyof MainTabParamList } | undefined;
  /**
   * productId: 바코드 스캔 시 제품 ID
   * fromHistory: true 시 스캔 이력에 중복 추가하지 않음
   * ocrProduct: OCR 결과 인라인 Product (productId 조회 생략)
   */
  ScanResult: { productId: string; fromHistory?: boolean; ocrProduct?: Product; scanLogId?: string };
  ScanHistory: undefined;
  /**
   * product: 표시할 제품 데이터
   * hideTitle: 대안 상품 상세에서 진입할 때 true → "History" 타이틀 숨김
   */
  HistoryProductDetail: { product: Product; hideTitle?: boolean };
  /** barcode: 미등록 제품 보완용 OCR 진입 시 함께 전달 / photoUri: 이미 촬영된 사진 URI (preview 상태로 바로 시작) */
  OCRCapture: { barcode?: string; photoUri?: string };
};

export type SearchStackParamList = {
  Search: undefined;
  SearchResult: { query: string };
  SearchProductDetail: { product: Product };
};

export type ListStackParamList = {
  List: undefined;
  Favorites: undefined;
  FavoritesMemo: undefined;
  FavoritesScanLog: undefined;
  FavoritesAll: undefined;
  Shopping: undefined;
  ShoppingItems: undefined;
  ShoppingPurchase: undefined;
  /** List 탭 전용 상세 화면 — 타이틀 "List", back 시 Favorites 로 복귀 */
  FavoriteProductDetail: { product: Product; hideTitle?: boolean };
};

export type RecommendStackParamList = {
  Recommend: undefined;
  WeekendPopular: undefined;
  SimilarUsersFavorites: undefined;
  QAScreen: undefined;
  QADetail: { questionId: string };
  QACreate: undefined;
  MagazineScreen: undefined;
  MagazineDetail: { articleId: string };
  RecommendProductDetail: { product: Product };
};

export type ProfileStackParamList = {
  Profile: undefined;
  MyProfileEdit: undefined;
  Personal: undefined;
  PersonalName: undefined;
  PersonalNickname: undefined;
  PersonalEmail: undefined;
  PersonalPush: undefined;
  PersonalMembership: undefined;
  Personalization: undefined;
  PersonalizationAllergy: undefined;
  PersonalizationSensitivity: undefined;
  PersonalizationRelated: undefined;
  PersonalizationHealthCheck: undefined;
  PersonalizationBandAid: undefined;
  MultiProfile: undefined;
  MultiProfileAdd: undefined;
  MultiProfileList: undefined;
  MultiProfileDetail: { profileId: string };
  MultiProfileEdit: { profileId: string };
  Language: undefined;
  Settings: undefined;
  SettingsHelp: undefined;
  SettingsPrivacy: undefined;
  SettingsConsult: undefined;
  SettingsReport: undefined;
  SettingsDelete: undefined;
};

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
  description: string;
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
  multiProfiles: Profile[];
  consentFlags: ConsentFlags;
  hasCompletedSurvey?: boolean;
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
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
  switchProfile: (profileId: string) => void;
  updateActiveProfile: (updates: Partial<Profile>) => void;
  /**
   * 서버(POST /auth/survey)에 알러지·식이·민감도를 전체-치환 저장.
   * 낙관적 업데이트 → 실패 시 롤백 + throw. 메인 프로필(activeProfile.id === currentUser.id)에서만 서버 동기화.
   */
  syncActiveProfile: (
    updates: Partial<Pick<Profile, 'allergyProfile' | 'dietaryRestrictions' | 'sensitivityLevel'>>,
  ) => Promise<void>;
  updateUserName: (name: string) => void;
  setLanguage: (language: string) => void;
  addMultiProfile: (profile: Omit<Profile, 'id'>) => void;
  updateMultiProfile: (profileId: string, updates: Partial<Omit<Profile, 'id'>>) => void;
  deleteMultiProfile: (profileId: string) => void;
}

export interface ScanStore {
  history: ScanHistory[];
  setHistory: (items: ScanHistory[]) => void;
  addHistory: (item: ScanHistory) => void;
  clearHistory: () => void;
}

export interface ListStore {
  favorites: FavoriteItem[];
  shoppingItems: ShoppingItem[];
  setFavorites: (items: FavoriteItem[]) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
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
  vegetarianType?: 'pescatarian' | 'vegan' | 'lacto_vegetarian' | 'ovo_vegetarian' | 'lacto_ovo_vegetarian' | 'pesco_vegetarian' | 'pollo_vegetarian' | 'flexitarian';
  veganStrictness?: 'strict' | 'flexible';
  /** Both 플로우: 알러지 플로우에서 수집한 allergyProfile을 채식 플로우로 전달 */
  allergyProfileJson?: string;
};

export type AuthStackParamList = {
  Splash: undefined;
  AuthHome: undefined;
  /** Survey 0: 설문 시작 랜딩 (Skip 가능) */
  SurveyLanding: SurveyParams;
  /** Survey 1: 식이 유형 선택 */
  Survey: SurveyParams;
  /** Survey 2-A: 알러지 진단 여부 확인 */
  SurveyAllergy: SurveyParams;
  /** Survey 3-A-Yes: 진단서 보유 → 문서 업로드 */
  SurveyAllergyDoc: SurveyParams;
  /** Survey 4-A-Yes: 문서 분석 결과 확인 */
  SurveyAllergyDocResult: SurveyParams;
  /** Survey 4-A-Yes Edit: 분석 결과 직접 편집 */
  SurveyAllergyEditList: SurveyParams & { categoriesJson: string };
  /** Survey 3-A-No: 알러지 심각도 선택 */
  SurveyAllergySelect: SurveyParams;
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
  Scan: undefined;
  /**
   * productId: 바코드 스캔 시 제품 ID
   * fromHistory: true 시 스캔 이력에 중복 추가하지 않음
   * ocrProduct: OCR 결과 인라인 Product (productId 조회 생략)
   */
  ScanResult: { productId: string; fromHistory?: boolean; ocrProduct?: Product };
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
};

export type ProfileStackParamList = {
  Profile: undefined;
  MyProfileEdit: undefined;
  Personal: undefined;
  PersonalName: undefined;
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
  Language: undefined;
  Settings: undefined;
  SettingsHelp: undefined;
  SettingsPrivacy: undefined;
  SettingsConsult: undefined;
  SettingsReport: undefined;
  SettingsDelete: undefined;
};

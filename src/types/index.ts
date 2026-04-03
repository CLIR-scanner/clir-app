// ─── Primitives ───────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'caution' | 'danger';
export type SensitivityLevel = 'strict' | 'normal';
/** RiskLevel의 alias — ScanHistory.result 필드에 사용 */
export type ScanResult = RiskLevel;

// ─── Domain Entities ──────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  riskLevel: RiskLevel;
  sources: string[];
  /** may-contain 성분이 실제로 연관된 알러겐 ID (예: 'ing-may-peanut' → 'ing-peanut') */
  relatedAllergenId?: string;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand: string;
  image?: string;
  ingredients: Ingredient[];
  isSafe: boolean;
  riskLevel: RiskLevel;
  riskIngredients: Ingredient[];
  mayContainIngredients: Ingredient[];
  alternatives: Product[];
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
}

export interface ScanHistory {
  id: string;
  productId: string;
  userId: string;
  scannedAt: Date;
  result: ScanResult;
  product: Product;
}

export interface FavoriteItem {
  id: string;
  productId: string;
  userId: string;
  memo: string;
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

// ─── Signup ───────────────────────────────────────────────────────────────────

export interface SignupData {
  email: string;
  password: string;
  name: string;
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
  switchProfile: (profileId: string) => void;
  updateActiveProfile: (updates: Partial<Profile>) => void;
}

export interface ScanStore {
  history: ScanHistory[];
  addHistory: (item: ScanHistory) => void;
  clearHistory: () => void;
}

export interface ListStore {
  favorites: FavoriteItem[];
  shoppingItems: ShoppingItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  removeShoppingItem: (id: string) => void;
  togglePurchased: (id: string) => void;
}

// ─── Navigation Param Lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  AuthHome: undefined;
  Signup: undefined;
  /** Signup에서 수집한 기본 정보를 Survey로 전달 */
  Survey: { name: string; email: string; password: string };
  Login: undefined;
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
  /** fromHistory: true 시 스캔 이력에 중복 추가하지 않음 */
  ScanResult: { productId: string; fromHistory?: boolean };
  ScanHistory: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  SearchResult: { query: string };
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
};

export type RecommendStackParamList = {
  Recommend: undefined;
  WeekendPopular: undefined;
  SimilarUsersFavorites: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
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

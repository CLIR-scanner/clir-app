/**
 * 식이(채식) 카탈로그 FE 어댑터.
 *
 * BE `GET /diets/catalog` 응답을 fetch·캐시하고, Survey/Personalization 화면이
 * 식이 타입과 회피 카테고리를 렌더할 때 사용한다. 하드코딩된 DIET_AVOIDED_CATEGORIES
 * / DIET_LABELS / VEGE_OPTIONS 의 대체 경로.
 *
 * 캐시 전략: 모듈 레벨 메모리 캐시. 앱 생애주기 동안 1회 fetch 로 충분.
 * BE 는 Cache-Control: public, max-age=3600 을 내리므로 네이티브 HTTP 캐시도 보조.
 */

import { apiFetch } from '../lib/api';

// ─── BE 응답 타입 (계약) ──────────────────────────────────────────────────────

export interface DietCategory {
  /** snake_case (예: 'red_meat'). products.category 와 매칭. */
  code: string;
  name: string;
}

export interface DietTypeCatalog {
  code: string;
  name: string;
  /** 매칭 시 'danger' 가 되는 ing-* ID 들. */
  avoidedAllergenIds: string[];
  /** 매칭 시 'danger' 가 되는 products.category 값들. */
  avoidedCategories: string[];
  /** 매칭 시 'caution' 만 띄우는 products.category. */
  cautionCategories: string[];
}

export interface DietCatalog {
  version: number;
  categories: DietCategory[];
  types: DietTypeCatalog[];
  veganStrictness: ('strict' | 'flexible')[];
}

// ─── 표시명 부트스트랩 (오프라인/첫 렌더용) ───────────────────────────────────
// 카탈로그 fetch 전에도 동기 표시가 가능하도록 8종 식이 타입을 보유.
// fetch 성공 시 BE 데이터로 덮어쓴다.

// avoidedCategories / cautionCategories 는 DIET_CATEGORIES 의 UI 코드(red_meat /
// poultry / dairy / eggs / seafood / vegetables / fruits_grains). BE 는 판정 시점에
// products.category(meat/seafood/...) 로 번역한다 (UI_CAT_TO_PRODUCT_CATS).
const BOOTSTRAP_TYPES: DietTypeCatalog[] = [
  { code: 'vegan',                name: 'Vegan',                avoidedAllergenIds: ['ing-milk','ing-egg','ing-fish','ing-shellfish'], avoidedCategories: ['red_meat','poultry','seafood','dairy','eggs'], cautionCategories: [] },
  { code: 'pescatarian',          name: 'Pescatarian',          avoidedAllergenIds: [], avoidedCategories: ['red_meat','poultry'], cautionCategories: [] },
  { code: 'lacto_vegetarian',     name: 'Lacto-Vegetarian',     avoidedAllergenIds: ['ing-egg','ing-fish','ing-shellfish'], avoidedCategories: ['red_meat','poultry','seafood','eggs'], cautionCategories: [] },
  { code: 'ovo_vegetarian',       name: 'Ovo-Vegetarian',       avoidedAllergenIds: ['ing-milk','ing-fish','ing-shellfish'], avoidedCategories: ['red_meat','poultry','seafood','dairy'], cautionCategories: [] },
  { code: 'lacto_ovo_vegetarian', name: 'Lacto-Ovo Vegetarian', avoidedAllergenIds: ['ing-fish','ing-shellfish'], avoidedCategories: ['red_meat','poultry','seafood'], cautionCategories: [] },
  { code: 'pesco_vegetarian',     name: 'Pesco-Vegetarian',     avoidedAllergenIds: [], avoidedCategories: ['red_meat','poultry'], cautionCategories: [] },
  { code: 'pollo_vegetarian',     name: 'Pollo-Vegetarian',     avoidedAllergenIds: ['ing-fish','ing-shellfish'], avoidedCategories: ['seafood'], cautionCategories: ['red_meat','poultry'] },
  { code: 'flexitarian',          name: 'Flexitarian',          avoidedAllergenIds: [], avoidedCategories: [], cautionCategories: ['red_meat','poultry'] },
];

const BOOTSTRAP_CATEGORIES: DietCategory[] = [
  { code: 'fruits_grains', name: 'Fruits / Grains' },
  { code: 'vegetables',    name: 'Vegetables' },
  { code: 'dairy',         name: 'Dairy' },
  { code: 'eggs',          name: 'Eggs' },
  { code: 'seafood',       name: 'Seafood' },
  { code: 'poultry',       name: 'Poultry' },
  { code: 'red_meat',      name: 'Red Meat' },
];

const BOOTSTRAP_CATALOG: DietCatalog = {
  version: 0,
  categories: BOOTSTRAP_CATEGORIES,
  types: BOOTSTRAP_TYPES,
  veganStrictness: ['strict', 'flexible'],
};

// ─── 카탈로그 캐시 ────────────────────────────────────────────────────────────

let dietCache: DietCatalog | null = null;
let dietPromise: Promise<DietCatalog> | null = null;

export async function fetchDietCatalog(lang: 'en' | 'ko' = 'en'): Promise<DietCatalog> {
  if (dietCache) return dietCache;
  if (dietPromise) return dietPromise;

  dietPromise = apiFetch<DietCatalog>(`/diets/catalog?lang=${lang}`)
    .then(res => {
      dietCache = res;
      dietPromise = null;
      return res;
    })
    .catch(err => {
      dietPromise = null;
      throw err;
    });
  return dietPromise;
}

/** 이미 fetch 된 카탈로그 반환. 없으면 부트스트랩으로 폴백 — sync 경로용. */
export function getCachedDietCatalogOrBootstrap(): DietCatalog {
  return dietCache ?? BOOTSTRAP_CATALOG;
}

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────────

/** dietary_restrictions 배열에서 첫 known DietType 키를 추출. */
export function getDietTypeKey(restrictions: string[], catalog?: DietCatalog): string | null {
  const c = catalog ?? getCachedDietCatalogOrBootstrap();
  const knownCodes = new Set(c.types.map(t => t.code));
  for (const r of restrictions) if (knownCodes.has(r)) return r;
  return null;
}

/** 카탈로그에서 type 의 회피 카테고리 코드 배열 (avoided + caution 합집합). */
export function getAvoidedCategoryCodes(typeCode: string, catalog?: DietCatalog): string[] {
  const c = catalog ?? getCachedDietCatalogOrBootstrap();
  const t = c.types.find(t => t.code === typeCode);
  if (!t) return [];
  return [...new Set([...t.avoidedCategories, ...t.cautionCategories])];
}

/** category code → 표시명 맵핑. 미정 카테고리는 raw code 반환. */
export function getCategoryDisplayName(code: string, catalog?: DietCatalog): string {
  const c = catalog ?? getCachedDietCatalogOrBootstrap();
  return c.categories.find(cat => cat.code === code)?.name ?? code;
}

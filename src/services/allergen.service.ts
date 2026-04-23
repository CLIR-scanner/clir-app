/**
 * 알러지 카탈로그 FE 어댑터.
 *
 * BE `GET /allergens/catalog` 응답을 fetch·캐시하고, Survey/Personalization
 * 화면이 카테고리·항목 트리를 렌더할 수 있도록 제공한다. 하드코딩된
 * ALLERGY_CATEGORIES / ALLERGY_CANDIDATES / ALLERGEN_NAME_MAP 의 대체 경로.
 *
 * 캐시 전략: 모듈 레벨 메모리 캐시. 앱 생애주기 동안 1회 fetch 로 충분.
 * BE 는 Cache-Control: public, max-age=3600 을 내리므로 네이티브 HTTP 캐시도
 * 보조로 작동.
 */

import { Ingredient, RiskLevel } from '../types';
import { apiFetch } from '../lib/api';

// ─── API 응답 타입 (BE 계약) ───────────────────────────────────────────────────

export interface CatalogItem {
  name: string;
  /** ing-* ID. undefined 면 BE 판정 범위 밖 항목(과일·첨가물 등). */
  allergenId?: string;
}

export interface CatalogCategory {
  code: string;
  name: string;
  items: CatalogItem[];
}

export interface CatalogAllergen {
  id: string;
  name: string;
  category: string;
  riskDefault: 'danger' | 'caution';
}

export interface AllergenCatalog {
  version: number;
  categories: CatalogCategory[];
  allergens: CatalogAllergen[];
}

// ─── 표시명 부트스트랩 ────────────────────────────────────────────────────────
// 카탈로그 fetch 전(첫 렌더·오프라인)에도 동기 표시가 필요한 경로가 있음:
//   - summaryToProduct(scan.service.ts) 의 makeRiskIngredient/makeMayContainIngredient
//
// BE 카탈로그와 동일한 10종을 부트스트랩으로 보유. 카탈로그 fetch 성공 시
// 해당 데이터로 덮어써 신규 알러겐(BE 가 추가한) 도 즉시 반영.

const BOOTSTRAP_DISPLAY: Record<string, { name: string; nameKo: string }> = {
  'ing-milk':      { name: 'Milk',      nameKo: '우유'   },
  'ing-egg':       { name: 'Egg',       nameKo: '달걀'   },
  'ing-peanut':    { name: 'Peanut',    nameKo: '땅콩'   },
  'ing-treenut':   { name: 'Tree Nuts', nameKo: '견과류' },
  'ing-wheat':     { name: 'Wheat',     nameKo: '밀'     },
  'ing-soy':       { name: 'Soy',       nameKo: '대두'   },
  'ing-shellfish': { name: 'Shellfish', nameKo: '갑각류' },
  'ing-fish':      { name: 'Fish',      nameKo: '생선'   },
  'ing-sesame':    { name: 'Sesame',    nameKo: '참깨'   },
  'ing-oat':       { name: 'Oat',       nameKo: '귀리'   },
};

let liveDisplay: Record<string, { name: string; nameKo: string }> = { ...BOOTSTRAP_DISPLAY };

// ─── 카탈로그 캐시 ────────────────────────────────────────────────────────────

let catalogCache: AllergenCatalog | null = null;
let catalogPromise: Promise<AllergenCatalog> | null = null;

/**
 * 카탈로그를 fetch. 모듈 캐시 히트 시 즉시 반환. 동시 호출 merge.
 * `lang='en'` 기준으로 받지만, nameKo 표시는 BOOTSTRAP_DISPLAY 의 한글을 유지한다
 * (BE 응답이 단일 lang 필드만 내려주므로).
 */
export async function fetchAllergenCatalog(lang: 'en' | 'ko' = 'en'): Promise<AllergenCatalog> {
  if (catalogCache) return catalogCache;
  if (catalogPromise) return catalogPromise;

  catalogPromise = apiFetch<AllergenCatalog>(`/allergens/catalog?lang=${lang}`)
    .then(res => {
      catalogCache = res;
      // allergens 응답으로 liveDisplay 갱신 (name 은 lang, nameKo 는 부트스트랩 유지).
      const next: Record<string, { name: string; nameKo: string }> = { ...BOOTSTRAP_DISPLAY };
      for (const a of res.allergens) {
        next[a.id] = {
          name: a.name,
          nameKo: BOOTSTRAP_DISPLAY[a.id]?.nameKo ?? a.name,
        };
      }
      liveDisplay = next;
      catalogPromise = null;
      return res;
    })
    .catch(err => {
      catalogPromise = null;
      throw err;
    });
  return catalogPromise;
}

/** 이미 fetch 된 카탈로그 반환. 없으면 null — 대기가 허용되지 않는 sync 경로용. */
export function getCachedCatalog(): AllergenCatalog | null {
  return catalogCache;
}

/** 동기 표시명 조회. 카탈로그 로드 전에도 부트스트랩 데이터로 정상 동작. */
export function getAllergenDisplay(id: string): { name: string; nameKo: string } {
  return liveDisplay[id] ?? { name: id, nameKo: id };
}

// ─── 선택 → ing-* ID 변환 ──────────────────────────────────────────────────────

/**
 * Survey UI 의 카테고리별 선택 맵을 ing-* ID 배열로 정규화.
 * 카탈로그의 items[].allergenId 를 lookup. 매핑 없는 항목(Apple 등)은 drop
 * (BE 판정 범위 밖이므로 의도된 동작).
 */
export function selectionToAllergenIds(
  selection: Record<string, string[]>,
  catalog: AllergenCatalog,
): string[] {
  const ids = new Set<string>();
  for (const [catKey, items] of Object.entries(selection)) {
    const cat = catalog.categories.find(c => c.code === catKey || c.name === catKey);
    if (!cat) continue;
    for (const itemName of items) {
      const item = cat.items.find(i => i.name === itemName);
      if (item?.allergenId) ids.add(item.allergenId);
    }
  }
  return [...ids];
}

// ─── Ingredient 빌더 (과거 constants/allergyData.ts 에서 이관) ─────────────────
// scan-history / favorites 응답의 allergenIds/traceIds 를 Ingredient 객체로 확장.

export function makeRiskIngredient(allergenId: string): Ingredient {
  const info = getAllergenDisplay(allergenId);
  return {
    id: allergenId,
    name: info.name,
    nameKo: info.nameKo,
    description: '',
    riskLevel: 'danger' as RiskLevel,
    sources: [],
  };
}

export function makeMayContainIngredient(allergenId: string): Ingredient {
  const info = getAllergenDisplay(allergenId);
  return {
    id: `ing-may-${allergenId.replace('ing-', '')}`,
    name: `May contain: ${info.name}`,
    nameKo: `${info.nameKo} 흔적 (May Contain)`,
    description: '',
    riskLevel: 'caution',
    sources: [],
    relatedAllergenId: allergenId,
  };
}

// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product, SearchResultItem, SearchSuggestion } from '../types';
import { apiFetch } from '../lib/api';

type SearchResultItemWire = Omit<SearchResultItem, 'image'> & {
  image?: string | null;
};

type SearchSuggestionWire = Omit<SearchSuggestion, 'highlight'> & {
  highlight?: SearchSuggestion['highlight'];
};

interface SearchProductsResponse {
  items: SearchResultItemWire[];
  total: number;
  hasMore: boolean;
}

interface SearchSuggestionsResponse {
  suggestions: SearchSuggestionWire[];
}

export interface SearchPage {
  items: Product[];
  total: number;
  hasMore: boolean;
}

const USE_PREVIEW_MOCK = false;

// TEMP: 검색 UI 확인용 목업. 실제 API 확인 후 USE_PREVIEW_MOCK=false 로 되돌리면 된다.
const PREVIEW_PRODUCTS: Product[] = [
  {
    id: 'preview-honey-barbeque-sauce',
    name: 'Honey Barbeque Sauce',
    brand: "Kellogg's",
    ingredients: [],
    isSafe: false,
    riskLevel: 'danger',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
    category: 'packaged',
  },
  {
    id: 'preview-sprite',
    name: 'Sprite',
    brand: 'The Coca-Cola Company',
    image: 'https://images.openfoodfacts.org/images/products/005/449/000/1520/front_en.4.400.jpg',
    ingredients: [],
    isSafe: true,
    riskLevel: 'safe',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
    category: 'beverages',
  },
  {
    id: 'preview-oreo',
    name: 'Oreo Original',
    brand: 'Nabisco',
    image: 'https://images.openfoodfacts.org/images/products/004/400/000/2687/front_en.12.400.jpg',
    ingredients: [],
    isSafe: false,
    riskLevel: 'caution',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
    category: 'desserts',
  },
  {
    id: 'preview-pringles',
    name: 'Pringles Original',
    brand: 'Pringles',
    image: 'https://images.openfoodfacts.org/images/products/038/000/845/7839/front_en.11.400.jpg',
    ingredients: [],
    isSafe: true,
    riskLevel: 'safe',
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
    category: 'packaged',
  },
];

function toSearchProduct(item: SearchResultItemWire): Product {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    image: item.image ?? undefined,
    ingredients: [],
    isSafe: item.isSafe,
    riskLevel: item.riskLevel,
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  };
}

/**
 * 검색어로 제품 목록을 반환한다.
 */
export async function searchProducts(query: string, offset = 0): Promise<SearchPage> {
  const q = query.trim();
  if (!q) return { items: [], total: 0, hasMore: false };

  if (USE_PREVIEW_MOCK) {
    const filtered = PREVIEW_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(q.toLowerCase()),
    );
    return { items: filtered, total: filtered.length, hasMore: false };
  }

  const params = new URLSearchParams({
    q,
    sort: 'relevance',
    limit: '20',
    offset: String(offset),
  });

  const res = await apiFetch<SearchProductsResponse>(`/search/products?${params.toString()}`);
  return { items: res.items.map(toSearchProduct), total: res.total, hasMore: res.hasMore };
}

/**
 * 전체 제품 목록 반환 (검색 전 그리드 표시용). q 없이 browse 모드 호출.
 */
export async function getAllProducts(offset = 0): Promise<SearchPage> {
  if (USE_PREVIEW_MOCK) {
    return { items: PREVIEW_PRODUCTS, total: PREVIEW_PRODUCTS.length, hasMore: false };
  }

  const params = new URLSearchParams({
    sort: 'name',
    limit: '20',
    offset: String(offset),
  });

  const res = await apiFetch<SearchProductsResponse>(`/search/products?${params.toString()}`);
  return { items: res.items.map(toSearchProduct), total: res.total, hasMore: res.hasMore };
}

/**
 * 자동완성 제안 목록 (제품명만 반환).
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  if (USE_PREVIEW_MOCK) {
    return PREVIEW_PRODUCTS
      .filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
      .map(p => p.name);
  }

  const params = new URLSearchParams({
    q,
    limit: '6',
  });

  const res = await apiFetch<SearchSuggestionsResponse>(`/search/suggestions?${params.toString()}`);
  return res.suggestions.map(s => s.name);
}

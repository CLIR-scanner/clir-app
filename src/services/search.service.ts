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

const USE_PREVIEW_MOCK = true;

// TEMP: 검색 UI 확인용 목업 1건. 실제 API 확인 후 USE_PREVIEW_MOCK=false 로 되돌리면 된다.
const PREVIEW_PRODUCT: Product = {
  id: 'preview-honey-barbeque-sauce',
  name: 'Honey Barbeque Sauce',
  brand: "Kellogg's",
  ingredients: [],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [],
  mayContainIngredients: [],
  alternatives: [],
};

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
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  if (USE_PREVIEW_MOCK) {
    return [PREVIEW_PRODUCT];
  }

  const params = new URLSearchParams({
    q,
    sort: 'relevance',
    limit: '20',
    offset: '0',
  });

  const res = await apiFetch<SearchProductsResponse>(`/search/products?${params.toString()}`);
  return res.items.map(toSearchProduct);
}

/**
 * 전체 제품 목록 반환 (검색 전 그리드 표시용).
 */
export async function getAllProducts(): Promise<Product[]> {
  return USE_PREVIEW_MOCK ? [PREVIEW_PRODUCT] : [];
}

/**
 * 자동완성 제안 목록 (제품명만 반환).
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  if (USE_PREVIEW_MOCK) {
    return [PREVIEW_PRODUCT.name];
  }

  const params = new URLSearchParams({
    q,
    limit: '6',
  });

  const res = await apiFetch<SearchSuggestionsResponse>(`/search/suggestions?${params.toString()}`);
  return res.suggestions.map(s => s.name);
}

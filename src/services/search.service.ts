// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product, Ingredient } from '../types';
import { mockProducts } from '../mocks/product.mock';

export async function searchProducts(query: string, userId: string): Promise<Product[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  const q = query.toLowerCase();
  return mockProducts.filter(
    (p: Product) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.ingredients.some(
        (i: Ingredient) =>
          i.nameKo.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      )
  );
}

export async function getRecentSearches(userId: string): Promise<string[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 200));
  return ['초콜릿', '귀리', '현미'];
}

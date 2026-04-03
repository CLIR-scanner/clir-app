// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product } from '../types';
import { mockProducts } from '../mocks/product.mock';

export async function getWeekendPopular(userId: string): Promise<Product[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return mockProducts.filter((p: Product) => p.riskLevel === 'safe');
}

export async function getSimilarUsersFavorites(userId: string): Promise<Product[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return mockProducts.filter((p: Product) => p.riskLevel !== 'danger');
}

export async function getPersonalizedRecommendations(userId: string): Promise<Product[]> {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  return mockProducts.filter((p: Product) => p.isSafe);
}

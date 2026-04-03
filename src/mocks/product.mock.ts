import {Product} from '../types';
import {mockIngredients as I} from './ingredient.mock';

// ─── 위험 제품: 땅콩 + 유제품 함유 ───────────────────────────────────────────
const dangerProduct: Product = {
  id: 'prod-001',
  barcode: '8801234567890',
  name: '견과류 초콜릿 바',
  brand: 'Choco Farm',
  ingredients: [I.cocoa, I.sugar, I.milk, I.peanut, I.vegetableOil],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [I.peanut, I.milk],
  mayContainIngredients: [],
  alternatives: [],
};

// ─── 주의 제품: 밀 함유 + 땅콩 흔적 ─────────────────────────────────────────
const cautionProduct: Product = {
  id: 'prod-002',
  barcode: '8809876543210',
  name: '통귀리 쿠키',
  brand: 'Healthy Bake',
  ingredients: [I.oat, I.wheat, I.sugar, I.vegetableOil, I.salt, I.mayContainPeanut],
  isSafe: false,
  riskLevel: 'caution',
  riskIngredients: [I.wheat],
  mayContainIngredients: [I.mayContainPeanut],
  alternatives: [],
};

// ─── 안전 제품: 알러지 성분 없음 ─────────────────────────────────────────────
const safeProduct: Product = {
  id: 'prod-003',
  barcode: '8801122334455',
  name: '현미 과자',
  brand: 'Nature Snack',
  ingredients: [I.rice, I.vegetableOil, I.salt, I.sugar],
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [],
  mayContainIngredients: [],
  alternatives: [],
};

// alternatives 연결
dangerProduct.alternatives = [safeProduct];
cautionProduct.alternatives = [safeProduct];

export const mockProducts: Product[] = [dangerProduct, cautionProduct, safeProduct];

export const mockProductMap: Record<string, Product> = {
  'prod-001': dangerProduct,
  'prod-002': cautionProduct,
  'prod-003': safeProduct,
};

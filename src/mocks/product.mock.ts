import { Product } from '../types';
import { mockIngredients as I } from './ingredient.mock';

// ─── US Demo Products (Supabase seed 바코드와 동일) ──────────────────────────
//
// 바코드: Supabase seed 데이터와 동일하게 맞춤.
// 백엔드 연동 전까지 이 mock이 스캔 결과를 반환.
// 백엔드 연동 후 scanBarcode() 구현부 교체 시 mock은 자동으로 bypass됨.
//
// analyzeProductForProfile()이 ingredients[]에서 allergyProfile과 매칭하므로
// allergen 성분은 반드시 ingredients 배열에 포함해야 함 (id가 'ing-*' 형태).

// ─── Nature Valley Oats & Honey (안전 기준 제품 — alternatives 참조 순서상 먼저 선언) ──
const natureValleyProduct: Product = {
  id: 'seed-003',
  barcode: '021130126026',
  name: 'Nature Valley Oats & Honey',
  brand: 'Nature Valley',
  ingredients: [I.oat, I.wheat, I.sugar, I.honey, I.salt, I.mayContainSoy, I.mayContainTreenut],
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [I.wheat],
  mayContainIngredients: [I.mayContainSoy, I.mayContainTreenut],
  alternatives: [],
};

// ─── Reese's Peanut Butter Cups (위험: peanut + milk + soy 함유) ─────────────
const reesesProduct: Product = {
  id: 'seed-002',
  barcode: '040000518495',
  name: "Reese's Peanut Butter Cups",
  brand: "Reese's",
  ingredients: [I.peanut, I.milk, I.soy, I.sugar, I.cocoa, I.salt],
  isSafe: false,
  riskLevel: 'danger',
  riskIngredients: [I.peanut, I.milk, I.soy],
  mayContainIngredients: [],
  alternatives: [natureValleyProduct],
};

// ─── Cheerios Original (주의: wheat 함유, milk 흔적) ────────────────────────
const cheeriosProduct: Product = {
  id: 'seed-001',
  barcode: '016000275607',
  name: 'Cheerios Original',
  brand: 'General Mills',
  ingredients: [I.oat, I.wheat, I.sugar, I.salt, I.mayContainMilk],
  isSafe: true,
  riskLevel: 'safe',
  riskIngredients: [I.wheat],
  mayContainIngredients: [I.mayContainMilk],
  alternatives: [natureValleyProduct],
};

export const mockProducts: Product[] = [reesesProduct, cheeriosProduct, natureValleyProduct];

export const mockProductMap: Record<string, Product> = {
  'seed-001': cheeriosProduct,
  'seed-002': reesesProduct,
  'seed-003': natureValleyProduct,
};

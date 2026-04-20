// TODO: Real API 연동 시 삭제
import { Product, Ingredient, RiskLevel } from '../types';

function ing(id: string, name: string, nameKo: string, riskLevel: RiskLevel): Ingredient {
  return { id, name, nameKo, description: '', riskLevel, sources: [] };
}

const DAIRY     = ing('ing-dairy',      'Dairy',             '유제품',             'danger');
const PEANUT    = ing('ing-peanut',     'Peanut',            '땅콩',               'danger');
const WHEAT     = ing('ing-wheat',      'Wheat',             '밀',                 'safe');
const EGG       = ing('ing-egg',        'Egg',               '달걀',               'safe');
const SOY       = ing('ing-soy',        'Soy',               '대두',               'safe');
const MAY_DAIRY = ing('ing-may-dairy',  'May contain dairy', '유제품 흔적 포함 가능', 'caution');
const MAY_PEANUT = ing('ing-may-peanut','May contain peanut','땅콩 흔적 포함 가능',  'caution');

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Oreo Original',
    brand: 'Mondelez',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, WHEAT, SOY],
    riskIngredients: [DAIRY],
    mayContainIngredients: [MAY_PEANUT],
    alternatives: [],
  },
  {
    id: 'prod-002',
    name: 'Pringles Original',
    brand: 'Kellogg\'s',
    riskLevel: 'caution',
    isSafe: false,
    ingredients: [WHEAT, SOY],
    riskIngredients: [],
    mayContainIngredients: [MAY_DAIRY, MAY_PEANUT],
    alternatives: [],
  },
  {
    id: 'prod-003',
    name: 'Snickers Bar',
    brand: 'Mars',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, PEANUT, SOY],
    riskIngredients: [DAIRY, PEANUT],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-004',
    name: 'Lay\'s Classic',
    brand: 'PepsiCo',
    riskLevel: 'safe',
    isSafe: true,
    ingredients: [SOY],
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-005',
    name: 'Nutella',
    brand: 'Ferrero',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, PEANUT, SOY],
    riskIngredients: [DAIRY, PEANUT],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-006',
    name: 'Ritz Crackers',
    brand: 'Mondelez',
    riskLevel: 'caution',
    isSafe: false,
    ingredients: [WHEAT, SOY],
    riskIngredients: [],
    mayContainIngredients: [MAY_DAIRY],
    alternatives: [],
  },
  {
    id: 'prod-007',
    name: 'Doritos Nacho Cheese',
    brand: 'PepsiCo',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, WHEAT, SOY],
    riskIngredients: [DAIRY],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-008',
    name: 'Cheez-It Original',
    brand: 'Kellogg\'s',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, WHEAT, EGG],
    riskIngredients: [DAIRY],
    mayContainIngredients: [MAY_PEANUT],
    alternatives: [],
  },
  {
    id: 'prod-009',
    name: 'Nature Valley Granola Bar',
    brand: 'General Mills',
    riskLevel: 'caution',
    isSafe: false,
    ingredients: [WHEAT, SOY],
    riskIngredients: [],
    mayContainIngredients: [MAY_DAIRY, MAY_PEANUT],
    alternatives: [],
  },
  {
    id: 'prod-010',
    name: 'Triscuit Original',
    brand: 'Mondelez',
    riskLevel: 'safe',
    isSafe: true,
    ingredients: [WHEAT, SOY],
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-011',
    name: 'Reese\'s Peanut Butter Cups',
    brand: 'Hershey\'s',
    riskLevel: 'danger',
    isSafe: false,
    ingredients: [DAIRY, PEANUT, SOY],
    riskIngredients: [DAIRY, PEANUT],
    mayContainIngredients: [],
    alternatives: [],
  },
  {
    id: 'prod-012',
    name: 'PopCorners Sea Salt',
    brand: 'PepsiCo',
    riskLevel: 'safe',
    isSafe: true,
    ingredients: [SOY],
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
  },
];

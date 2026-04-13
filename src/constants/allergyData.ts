// 알러지 카테고리 및 항목 더미 데이터 (백엔드 연결 전)
import { Ingredient, RiskLevel } from '../types';

// ─── allergen ID → 표시명 매핑 ────────────────────────────────────────────────
// scan.service.ts / list.service.ts 양쪽에서 공유. 새 알러겐 추가 시 이 파일만 수정.
// 백엔드 product.service.ts 의 ALLERGEN_INFO 와 동기화 필요.
export const ALLERGEN_NAME_MAP: Record<string, { name: string; nameKo: string }> = {
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

/** allergen ID → 직접 위험 성분 Ingredient 생성 */
export function makeRiskIngredient(allergenId: string): Ingredient {
  const info = ALLERGEN_NAME_MAP[allergenId] ?? { name: allergenId, nameKo: allergenId };
  return {
    id: allergenId,
    name: info.name,
    nameKo: info.nameKo,
    description: '',
    riskLevel: 'danger' as RiskLevel,
    sources: [],
  };
}

/** allergen ID → may-contain 성분 Ingredient 생성 */
export function makeMayContainIngredient(allergenId: string): Ingredient {
  const info = ALLERGEN_NAME_MAP[allergenId] ?? { name: allergenId, nameKo: allergenId };
  return {
    id: `ing-may-${allergenId.replace('ing-', '')}`,
    name: `May contain: ${info.name}`,
    nameKo: `${info.nameKo} 흔적 (May Contain)`,
    description: '',
    riskLevel: 'caution' as RiskLevel,
    sources: [],
    relatedAllergenId: allergenId,
  };
}

// ─── 알러지 카테고리 및 항목 더미 데이터 ─────────────────────────────────────

export const ALLERGY_CATEGORIES = [
  'Crustaceans', 'Dairy', 'Eggs', 'Fish', 'Food Additives',
  'Fruits', 'Grains', 'Legumes', 'Meat', 'Moollusks / Shellfish',
  'Seeds', 'Tree Nuts',
];

export const ALLERGY_CANDIDATES: Record<string, string[]> = {
  'Crustaceans':           ['Barnacle', 'Crab', 'Crayfish', 'Krill', 'Lobster', 'Prawn', 'Shrimp'],
  'Dairy':                 ['Butter', 'Casein', 'Cheese', 'Cream', 'Ghee', 'Ice Cream', 'Kefir', 'Milk', 'Whey', 'Yogurt'],
  'Eggs':                  ['Chicken Egg', 'Duck Egg', 'Egg White', 'Egg Yolk', 'Goose Egg', 'Quail Egg'],
  'Fish':                  ['Anchovy', 'Carp', 'Catfish', 'Cod', 'Flounder', 'Halibut', 'Herring', 'Mackerel', 'Salmon', 'Sardine', 'Sea Bass', 'Tilapia', 'Trout', 'Tuna'],
  'Food Additives':        ['Annatto', 'Aspartame', 'BHA', 'BHT', 'Benzoates', 'Carrageenan', 'MSG', 'Nitrates', 'Sulfites', 'Tartrazine'],
  'Fruits':                ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Kiwi', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pineapple', 'Raspberry', 'Strawberry', 'Watermelon'],
  'Grains':                ['Barley', 'Corn', 'Kamut', 'Millet', 'Oats', 'Rice', 'Rye', 'Sorghum', 'Spelt', 'Wheat'],
  'Legumes':               ['Black Bean', 'Chickpea', 'Fava Bean', 'Kidney Bean', 'Lentil', 'Lupine', 'Mung Bean', 'Pea', 'Peanut', 'Soybean'],
  'Meat':                  ['Beef', 'Bison', 'Chicken', 'Duck', 'Goat', 'Lamb', 'Pork', 'Turkey', 'Veal', 'Venison'],
  'Moollusks / Shellfish': ['Abalone', 'Clam', 'Cuttlefish', 'Mussel', 'Octopus', 'Oyster', 'Scallop', 'Snail', 'Squid'],
  'Seeds':                 ['Chia', 'Flaxseed', 'Hemp', 'Mustard Seed', 'Poppy', 'Pumpkin', 'Sesame', 'Sunflower'],
  'Tree Nuts':             ['Almond', 'Brazil Nut', 'Cashew', 'Chestnut', 'Hazelnut', 'Macadamia', 'Pecan', 'Pine Nut', 'Pistachio', 'Walnut'],
};

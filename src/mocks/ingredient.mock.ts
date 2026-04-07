import {Ingredient} from '../types';

export const mockIngredients: Record<string, Ingredient> = {
  peanut: {
    id: 'ing-peanut',
    name: 'Peanut',
    nameKo: '땅콩',
    description:
      '땅콩은 주요 알러지 유발 식품 중 하나입니다. 아나필락시스 쇼크를 포함한 심각한 알러지 반응을 일으킬 수 있습니다. 매우 적은 양에도 민감한 사람들은 반응할 수 있습니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergyresearch.org/peanut-allergy',
      'https://www.mayoclinic.org/diseases-conditions/peanut-allergy',
    ],
  },
  milk: {
    id: 'ing-milk',
    name: 'Milk (Dairy)',
    nameKo: '우유 (유제품)',
    description:
      '우유 알러지는 유아와 어린이에게 흔하며, 카세인과 유청 단백질에 대한 면역 반응입니다. 유당 불내증과는 다릅니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/milk',
    ],
  },
  wheat: {
    id: 'ing-wheat',
    name: 'Wheat',
    nameKo: '밀 (글루텐)',
    description:
      '밀에 포함된 글루텐은 셀리악병 환자와 글루텐 민감성이 있는 사람들에게 소화 장애, 복통, 피부 발진을 유발할 수 있습니다.',
    riskLevel: 'caution',
    sources: [
      'https://celiac.org/gluten-free-living/what-is-gluten',
    ],
  },
  soy: {
    id: 'ing-soy',
    name: 'Soy',
    nameKo: '대두 (콩)',
    description:
      '대두는 FDA Big 9 주요 알러젠 중 하나입니다. 두유, 두부, 된장 등 다양한 형태로 식품에 포함됩니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/soy',
    ],
  },
  treenut: {
    id: 'ing-treenut',
    name: 'Tree Nut',
    nameKo: '견과류',
    description:
      '견과류(아몬드, 호두, 캐슈 등)는 심각한 알러지 반응을 유발할 수 있는 FDA Big 9 알러젠입니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/tree-nut',
    ],
  },
  honey: {
    id: 'ing-honey',
    name: 'Honey',
    nameKo: '꿀',
    description: '천연 감미료입니다. 1세 미만 영아에게는 보툴리눔 위험이 있어 주의가 필요합니다.',
    riskLevel: 'safe',
    sources: [],
  },
  egg: {
    id: 'ing-egg',
    name: 'Egg',
    nameKo: '달걀',
    description:
      '달걀 알러지는 소아에게 흔한 알러지 중 하나입니다. 난백(알부민)이 주요 알러겐입니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/egg',
    ],
  },
  fish: {
    id: 'ing-fish',
    name: 'Fish',
    nameKo: '생선',
    description:
      '생선 알러지는 성인에게 흔하며 평생 지속되는 경우가 많습니다. 연어, 참치, 고등어 등이 포함됩니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/fish',
    ],
  },
  shellfish: {
    id: 'ing-shellfish',
    name: 'Shellfish',
    nameKo: '갑각류',
    description:
      '갑각류(새우, 게, 랍스터 등) 알러지는 성인에게 가장 흔한 알러지 중 하나입니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/shellfish',
    ],
  },
  sesame: {
    id: 'ing-sesame',
    name: 'Sesame',
    nameKo: '참깨',
    description:
      '참깨는 2023년부터 FDA Big 9 알러겐으로 지정되었습니다. 빵, 과자, 후무스 등에 포함됩니다.',
    riskLevel: 'danger',
    sources: [
      'https://www.foodallergy.org/living-food-allergies/food-allergy-essentials/common-allergens/sesame',
    ],
  },
  mayContainPeanut: {
    id: 'ing-may-peanut',
    name: 'May contain: Peanut',
    nameKo: '땅콩 흔적 (May Contain)',
    description:
      '동일한 시설에서 땅콩을 처리하므로 극소량의 땅콩이 포함될 수 있습니다. 엄격한 알러지 환자는 주의가 필요합니다.',
    riskLevel: 'caution',
    sources: [],
    relatedAllergenId: 'ing-peanut',
  },
  mayContainMilk: {
    id: 'ing-may-milk',
    name: 'May contain: Milk',
    nameKo: '유제품 흔적 (May Contain)',
    description:
      '동일한 시설에서 유제품을 처리하므로 극소량의 유제품이 포함될 수 있습니다.',
    riskLevel: 'caution',
    sources: [],
    relatedAllergenId: 'ing-milk',
  },
  mayContainSoy: {
    id: 'ing-may-soy',
    name: 'May contain: Soy',
    nameKo: '대두 흔적 (May Contain)',
    description:
      '동일한 시설에서 대두를 처리하므로 극소량의 대두가 포함될 수 있습니다.',
    riskLevel: 'caution',
    sources: [],
    relatedAllergenId: 'ing-soy',
  },
  mayContainTreenut: {
    id: 'ing-may-treenut',
    name: 'May contain: Tree Nut',
    nameKo: '견과류 흔적 (May Contain)',
    description:
      '동일한 시설에서 견과류를 처리하므로 극소량의 견과류가 포함될 수 있습니다.',
    riskLevel: 'caution',
    sources: [],
    relatedAllergenId: 'ing-treenut',
  },
  sugar: {
    id: 'ing-sugar',
    name: 'Sugar',
    nameKo: '설탕',
    description: '일반적으로 안전한 감미료입니다. 과다 섭취 시 혈당에 영향을 줄 수 있습니다.',
    riskLevel: 'safe',
    sources: [],
  },
  cocoa: {
    id: 'ing-cocoa',
    name: 'Cocoa Powder',
    nameKo: '카카오 파우더',
    description: '카카오 열매에서 추출한 천연 성분입니다. 항산화 성분이 풍부합니다.',
    riskLevel: 'safe',
    sources: [],
  },
  oat: {
    id: 'ing-oat',
    name: 'Oat',
    nameKo: '귀리',
    description:
      '귀리는 일반적으로 안전하나, 글루텐 민감성이 있는 경우 교차 오염에 주의하세요.',
    // riskLevel은 'safe'로 고정. 귀리 알러지(ing-oat) 설정 시
    // analyzeProductForProfile()이 allergyProfile 기준으로 'danger'로 재계산함.
    riskLevel: 'safe',
    sources: [],
  },
  rice: {
    id: 'ing-rice',
    name: 'Rice',
    nameKo: '쌀',
    description: '가장 안전한 곡물 중 하나입니다. 알러지 반응이 매우 드뭅니다.',
    riskLevel: 'safe',
    sources: [],
  },
  salt: {
    id: 'ing-salt',
    name: 'Salt',
    nameKo: '소금',
    description: '나트륨이 포함된 일반 조미료입니다. 과다 섭취 시 혈압에 영향을 줄 수 있습니다.',
    riskLevel: 'safe',
    sources: [],
  },
  vegetableOil: {
    id: 'ing-veg-oil',
    name: 'Vegetable Oil',
    nameKo: '식물성 오일',
    description: '카놀라 또는 해바라기씨 오일로 만든 식물성 지방입니다.',
    riskLevel: 'safe',
    sources: [],
  },
};

import type { IngredientSummary } from '../types';

const SUPPORTED_DISPLAY_LANGUAGES = ['en', 'ko', 'ja', 'zh', 'es', 'fr'];

type DisplayNameSource = {
  id?: string;
  allergenId?: string;
  name: string;
  nameKo?: string;
  translations?: IngredientSummary['translations'];
};

const DISPLAY_NAMES: Record<string, Record<string, string>> = {
  peanut: {
    en: 'Peanut',
    ko: '땅콩',
    ja: 'ピーナッツ',
    zh: '花生',
    es: 'Cacahuete',
    fr: 'Arachide',
  },
  dairy: {
    en: 'Dairy',
    ko: '유제품',
    ja: '乳製品',
    zh: '乳制品',
    es: 'Lácteos',
    fr: 'Produits laitiers',
  },
  butter: { en: 'Butter', ko: '버터' },
  casein: { en: 'Casein', ko: '카제인' },
  cheese: { en: 'Cheese', ko: '치즈' },
  cream: { en: 'Cream', ko: '크림' },
  ghee: { en: 'Ghee', ko: '기버터' },
  ice_cream: { en: 'Ice Cream', ko: '아이스크림' },
  kefir: { en: 'Kefir', ko: '케피어' },
  whey: { en: 'Whey', ko: '유청' },
  yogurt: { en: 'Yogurt', ko: '요거트' },
  milk: {
    en: 'Milk',
    ko: '우유',
    ja: '牛乳',
    zh: '牛奶',
    es: 'Leche',
    fr: 'Lait',
  },
  egg: {
    en: 'Egg',
    ko: '달걀',
    ja: '卵',
    zh: '鸡蛋',
    es: 'Huevo',
    fr: 'Oeuf',
  },
  chicken_egg: { en: 'Chicken Egg', ko: '닭고기 달걀' },
  duck_egg: { en: 'Duck Egg', ko: '오리알' },
  egg_white: { en: 'Egg White', ko: '흰자' },
  egg_yolk: { en: 'Egg Yolk', ko: '노른자' },
  goose_egg: { en: 'Goose Egg', ko: '거위알' },
  quail_egg: { en: 'Quail Egg', ko: '메추리알' },
  wheat: {
    en: 'Wheat',
    ko: '밀',
    ja: '小麦',
    zh: '小麦',
    es: 'Trigo',
    fr: 'Blé',
  },
  gluten: {
    en: 'Gluten',
    ko: '글루텐',
    ja: 'グルテン',
    zh: '麸质',
    es: 'Gluten',
    fr: 'Gluten',
  },
  soy: {
    en: 'Soy',
    ko: '대두',
    ja: '大豆',
    zh: '大豆',
    es: 'Soja',
    fr: 'Soja',
  },
  shellfish: {
    en: 'Shellfish',
    ko: '갑각류',
    ja: '甲殻類',
    zh: '贝类',
    es: 'Mariscos',
    fr: 'Crustacés',
  },
  crustaceans: {
    en: 'Crustaceans',
    ko: '갑각류',
    es: 'Crustáceos',
  },
  barnacle: { en: 'Barnacle', ko: '따개비' },
  crayfish: { en: 'Crayfish', ko: '가재' },
  krill: { en: 'Krill', ko: '크릴' },
  fish: {
    en: 'Fish',
    ko: '생선',
    ja: '魚',
    zh: '鱼',
    es: 'Pescado',
    fr: 'Poisson',
  },
  anchovy: { en: 'Anchovy', ko: '멸치' },
  carp: { en: 'Carp', ko: '잉어' },
  catfish: { en: 'Catfish', ko: '메기' },
  cod: { en: 'Cod', ko: '대구' },
  flounder: { en: 'Flounder', ko: '가자미' },
  halibut: { en: 'Halibut', ko: '넙치' },
  herring: { en: 'Herring', ko: '청어' },
  mackerel: { en: 'Mackerel', ko: '고등어' },
  salmon: { en: 'Salmon', ko: '연어' },
  sardine: { en: 'Sardine', ko: '정어리' },
  sea_bass: { en: 'Sea Bass', ko: '농어' },
  tilapia: { en: 'Tilapia', ko: '틸라피아' },
  trout: { en: 'Trout', ko: '송어' },
  tuna: { en: 'Tuna', ko: '참치' },
  treenut: {
    en: 'Tree Nuts',
    ko: '견과류',
    ja: '木の実',
    zh: '坚果',
    es: 'Frutos secos',
    fr: 'Fruits à coque',
  },
  almond: { en: 'Almond', ko: '아몬드' },
  brazil_nut: { en: 'Brazil Nut', ko: '브라질너트' },
  cashew: { en: 'Cashew', ko: '캐슈넛' },
  chestnut: { en: 'Chestnut', ko: '밤' },
  hazelnut: { en: 'Hazelnut', ko: '헤이즐넛' },
  macadamia: { en: 'Macadamia', ko: '마카다미아' },
  pecan: { en: 'Pecan', ko: '피칸' },
  pine_nut: { en: 'Pine Nut', ko: '잣' },
  pistachio: { en: 'Pistachio', ko: '피스타치오' },
  walnut: { en: 'Walnut', ko: '호두' },
  sesame: {
    en: 'Sesame',
    ko: '참깨',
    ja: 'ごま',
    zh: '芝麻',
    es: 'Sésamo',
    fr: 'Sésame',
  },
  oat: {
    en: 'Oat',
    ko: '귀리',
    ja: 'オート麦',
    zh: '燕麦',
    es: 'Avena',
    fr: 'Avoine',
  },
  corn: {
    en: 'Corn',
    ko: '옥수수',
  },
  millet: {
    en: 'Millet',
    ko: '기장',
  },
  rice: {
    en: 'Rice',
    ko: '쌀',
  },
  sorghum: {
    en: 'Sorghum',
    ko: '수수',
  },
  barley: {
    en: 'Barley',
    ko: '보리',
  },
  rye: {
    en: 'Rye',
    ko: '호밀',
  },
  kamut: { en: 'Kamut', ko: '카무트' },
  spelt: { en: 'Spelt', ko: '스펠트밀' },
  shrimp: {
    en: 'Shrimp',
    ko: '새우',
  },
  crab: {
    en: 'Crab',
    ko: '게',
  },
  lobster: {
    en: 'Lobster',
    ko: '바닷가재',
  },
  prawn: {
    en: 'Prawn',
    ko: '대하',
  },
  clam: {
    en: 'Clam',
    ko: '조개',
  },
  mussel: {
    en: 'Mussel',
    ko: '홍합',
  },
  oyster: {
    en: 'Oyster',
    ko: '굴',
  },
  scallop: {
    en: 'Scallop',
    ko: '가리비',
  },
  abalone: { en: 'Abalone', ko: '전복' },
  cuttlefish: { en: 'Cuttlefish', ko: '갑오징어' },
  octopus: { en: 'Octopus', ko: '문어' },
  snail: { en: 'Snail', ko: '달팽이' },
  squid: { en: 'Squid', ko: '오징어' },
  annatto: { en: 'Annatto', ko: '안나토' },
  aspartame: { en: 'Aspartame', ko: '아스파탐' },
  bha: { en: 'BHA', ko: 'BHA' },
  bht: { en: 'BHT', ko: 'BHT' },
  benzoates: { en: 'Benzoates', ko: '벤조산염' },
  carrageenan: { en: 'Carrageenan', ko: '카라기난' },
  msg: { en: 'MSG', ko: 'MSG' },
  nitrates: { en: 'Nitrates', ko: '질산염' },
  sulfites: { en: 'Sulfites', ko: '아황산염' },
  tartrazine: { en: 'Tartrazine', ko: '타르트라진' },
  apple: { en: 'Apple', ko: '사과' },
  banana: { en: 'Banana', ko: '바나나' },
  blueberry: { en: 'Blueberry', ko: '블루베리' },
  cherry: { en: 'Cherry', ko: '체리' },
  grape: { en: 'Grape', ko: '포도' },
  kiwi: { en: 'Kiwi', ko: '키위' },
  lemon: { en: 'Lemon', ko: '레몬' },
  mango: { en: 'Mango', ko: '망고' },
  orange: { en: 'Orange', ko: '오렌지' },
  peach: { en: 'Peach', ko: '복숭아' },
  pineapple: { en: 'Pineapple', ko: '파인애플' },
  raspberry: { en: 'Raspberry', ko: '라즈베리' },
  strawberry: { en: 'Strawberry', ko: '딸기' },
  watermelon: { en: 'Watermelon', ko: '수박' },
  black_bean: { en: 'Black Bean', ko: '검은콩' },
  chickpea: { en: 'Chickpea', ko: '병아리콩' },
  fava_bean: { en: 'Fava Bean', ko: '잠두콩' },
  kidney_bean: { en: 'Kidney Bean', ko: '강낭콩' },
  lentil: { en: 'Lentil', ko: '렌틸콩' },
  lupine: { en: 'Lupine', ko: '루핀' },
  mung_bean: { en: 'Mung Bean', ko: '녹두' },
  pea: { en: 'Pea', ko: '완두콩' },
  soybean: { en: 'Soybean', ko: '대두' },
  beef: { en: 'Beef', ko: '소고기' },
  bison: { en: 'Bison', ko: '들소고기' },
  chicken: { en: 'Chicken', ko: '닭고기' },
  duck: { en: 'Duck', ko: '오리고기' },
  goat: { en: 'Goat', ko: '염소고기' },
  lamb: { en: 'Lamb', ko: '양고기' },
  pork: { en: 'Pork', ko: '돼지고기' },
  turkey: { en: 'Turkey', ko: '칠면조고기' },
  veal: { en: 'Veal', ko: '송아지고기' },
  venison: { en: 'Venison', ko: '사슴고기' },
  chia: { en: 'Chia', ko: '치아시드' },
  flaxseed: { en: 'Flaxseed', ko: '아마씨' },
  hemp: { en: 'Hemp', ko: '햄프씨드' },
  mustard_seed: { en: 'Mustard Seed', ko: '겨자씨' },
  poppy: { en: 'Poppy', ko: '양귀비씨' },
  pumpkin: { en: 'Pumpkin', ko: '호박씨' },
  sunflower: { en: 'Sunflower', ko: '해바라기씨' },
  fruits_grains: {
    en: 'Fruits / Grains',
    ko: '과일 / 곡물',
    ja: '果物 / 穀物',
    zh: '水果 / 谷物',
    es: 'Frutas / Cereales',
    fr: 'Fruits / Céréales',
  },
  fruits: {
    en: 'Fruits',
    ko: '과일',
    ja: '果物',
    zh: '水果',
    es: 'Frutas',
    fr: 'Fruits',
  },
  grains: {
    en: 'Grains',
    ko: '곡물',
    ja: '穀物',
    zh: '谷物',
    es: 'Cereales',
    fr: 'Céréales',
  },
  food_additives: {
    en: 'Food Additives',
    ko: '식품첨가물',
    es: 'Aditivos alimentarios',
  },
  legumes: {
    en: 'Legumes',
    ko: '콩류',
    es: 'Legumbres',
  },
  vegetables: {
    en: 'Vegetables',
    ko: '채소',
    ja: '野菜',
    zh: '蔬菜',
    es: 'Verduras',
    fr: 'Légumes',
  },
  seafood: {
    en: 'Seafood',
    ko: '해산물',
    ja: '魚介類',
    zh: '海鲜',
    es: 'Productos del mar',
    fr: 'Fruits de mer',
  },
  poultry: {
    en: 'Poultry',
    ko: '가금류',
    ja: '家禽',
    zh: '禽肉',
    es: 'Aves',
    fr: 'Volaille',
  },
  red_meat: {
    en: 'Red Meat',
    ko: '붉은 고기',
    ja: '赤身肉',
    zh: '红肉',
    es: 'Carne roja',
    fr: 'Viande rouge',
  },
  meat: { en: 'Meat', ko: '고기', es: 'Carne' },
  mollusks_shellfish: { en: 'Mollusks / Shellfish', ko: '연체동물 / 조개류', es: 'Moluscos / Mariscos' },
  seeds: { en: 'Seeds', ko: '씨앗류', es: 'Semillas' },
};

const ALIASES: Record<string, string> = {
  'ing-peanut': 'peanut',
  peanut: 'peanut',
  peanuts: 'peanut',
  'ing-dairy': 'dairy',
  dairy: 'dairy',
  butter: 'butter',
  casein: 'casein',
  cheese: 'cheese',
  cream: 'cream',
  ghee: 'ghee',
  'ice cream': 'ice_cream',
  ice_cream: 'ice_cream',
  kefir: 'kefir',
  whey: 'whey',
  yogurt: 'yogurt',
  'ing-milk': 'milk',
  milk: 'milk',
  'ing-egg': 'egg',
  egg: 'egg',
  eggs: 'egg',
  'chicken egg': 'chicken_egg',
  'duck egg': 'duck_egg',
  'egg white': 'egg_white',
  'egg yolk': 'egg_yolk',
  'goose egg': 'goose_egg',
  'quail egg': 'quail_egg',
  'ing-wheat': 'wheat',
  wheat: 'wheat',
  'ing-gluten': 'gluten',
  gluten: 'gluten',
  'ing-soy': 'soy',
  soy: 'soy',
  'ing-shellfish': 'shellfish',
  shellfish: 'shellfish',
  crustaceans: 'crustaceans',
  crustacean: 'crustaceans',
  barnacle: 'barnacle',
  barnacles: 'barnacle',
  crayfish: 'crayfish',
  krill: 'krill',
  'ing-fish': 'fish',
  fish: 'fish',
  anchovy: 'anchovy',
  anchovies: 'anchovy',
  carp: 'carp',
  catfish: 'catfish',
  cod: 'cod',
  flounder: 'flounder',
  halibut: 'halibut',
  herring: 'herring',
  mackerel: 'mackerel',
  salmon: 'salmon',
  sardine: 'sardine',
  sardines: 'sardine',
  'sea bass': 'sea_bass',
  tilapia: 'tilapia',
  trout: 'trout',
  tuna: 'tuna',
  'ing-treenut': 'treenut',
  'tree nuts': 'treenut',
  'tree nut': 'treenut',
  treenut: 'treenut',
  treenuts: 'treenut',
  almond: 'almond',
  almonds: 'almond',
  'brazil nut': 'brazil_nut',
  'brazil nuts': 'brazil_nut',
  cashew: 'cashew',
  cashews: 'cashew',
  chestnut: 'chestnut',
  chestnuts: 'chestnut',
  hazelnut: 'hazelnut',
  hazelnuts: 'hazelnut',
  macadamia: 'macadamia',
  pecan: 'pecan',
  pecans: 'pecan',
  'pine nut': 'pine_nut',
  'pine nuts': 'pine_nut',
  pistachio: 'pistachio',
  pistachios: 'pistachio',
  walnut: 'walnut',
  walnuts: 'walnut',
  'ing-sesame': 'sesame',
  sesame: 'sesame',
  'ing-oat': 'oat',
  oat: 'oat',
  oats: 'oat',
  corn: 'corn',
  maize: 'corn',
  millet: 'millet',
  rice: 'rice',
  sorghum: 'sorghum',
  barley: 'barley',
  rye: 'rye',
  kamut: 'kamut',
  spelt: 'spelt',
  shrimp: 'shrimp',
  shrimps: 'shrimp',
  crab: 'crab',
  crabs: 'crab',
  lobster: 'lobster',
  lobsters: 'lobster',
  prawn: 'prawn',
  prawns: 'prawn',
  clam: 'clam',
  clams: 'clam',
  mussel: 'mussel',
  mussels: 'mussel',
  oyster: 'oyster',
  oysters: 'oyster',
  scallop: 'scallop',
  scallops: 'scallop',
  abalone: 'abalone',
  cuttlefish: 'cuttlefish',
  octopus: 'octopus',
  snail: 'snail',
  snails: 'snail',
  squid: 'squid',
  annatto: 'annatto',
  aspartame: 'aspartame',
  bha: 'bha',
  bht: 'bht',
  benzoates: 'benzoates',
  carrageenan: 'carrageenan',
  msg: 'msg',
  nitrates: 'nitrates',
  sulfites: 'sulfites',
  tartrazine: 'tartrazine',
  apple: 'apple',
  apples: 'apple',
  banana: 'banana',
  bananas: 'banana',
  blueberry: 'blueberry',
  blueberries: 'blueberry',
  cherry: 'cherry',
  cherries: 'cherry',
  grape: 'grape',
  grapes: 'grape',
  kiwi: 'kiwi',
  lemon: 'lemon',
  mango: 'mango',
  orange: 'orange',
  peach: 'peach',
  pineapple: 'pineapple',
  raspberry: 'raspberry',
  raspberries: 'raspberry',
  strawberry: 'strawberry',
  strawberries: 'strawberry',
  watermelon: 'watermelon',
  'black bean': 'black_bean',
  'black beans': 'black_bean',
  chickpea: 'chickpea',
  chickpeas: 'chickpea',
  'fava bean': 'fava_bean',
  'fava beans': 'fava_bean',
  'kidney bean': 'kidney_bean',
  'kidney beans': 'kidney_bean',
  lentil: 'lentil',
  lentils: 'lentil',
  lupine: 'lupine',
  'mung bean': 'mung_bean',
  'mung beans': 'mung_bean',
  pea: 'pea',
  peas: 'pea',
  soybean: 'soybean',
  soybeans: 'soybean',
  beef: 'beef',
  bison: 'bison',
  chicken: 'chicken',
  duck: 'duck',
  goat: 'goat',
  lamb: 'lamb',
  pork: 'pork',
  turkey: 'turkey',
  veal: 'veal',
  venison: 'venison',
  chia: 'chia',
  flaxseed: 'flaxseed',
  hemp: 'hemp',
  'mustard seed': 'mustard_seed',
  'mustard seeds': 'mustard_seed',
  poppy: 'poppy',
  pumpkin: 'pumpkin',
  sunflower: 'sunflower',
  fruits: 'fruits',
  grains: 'grains',
  grain: 'grains',
  'fruits / grains': 'fruits_grains',
  fruits_grains: 'fruits_grains',
  'food additives': 'food_additives',
  food_additives: 'food_additives',
  additives: 'food_additives',
  legumes: 'legumes',
  legume: 'legumes',
  vegetables: 'vegetables',
  vegetable: 'vegetables',
  seafood: 'seafood',
  poultry: 'poultry',
  'red meat': 'red_meat',
  red_meat: 'red_meat',
  meat: 'meat',
  'mollusks / shellfish': 'mollusks_shellfish',
  'molluscs / shellfish': 'mollusks_shellfish',
  mollusks_shellfish: 'mollusks_shellfish',
  seeds: 'seeds',
  seed: 'seeds',
};

const MAY_CONTAIN_PREFIX: Record<string, string> = {
  en: 'May contain',
  ko: '함유 가능',
  ja: '含まれる可能性',
  zh: '可能含有',
  es: 'Puede contener',
  fr: 'Peut contenir',
};

function getDisplayLanguage(language: string): string {
  const base = language.split(/[-_]/)[0].toLowerCase();
  return SUPPORTED_DISPLAY_LANGUAGES.includes(base) ? base : 'en';
}

function normalizeLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]{2}:/, '')
    .replace(/^may contain:\s*/, '')
    .replace(/^may contain\s+/, '')
    .replace(/\s+traces?\s*\(may contain\)$/i, '')
    .replace(/[(),.]/g, '')
    .replace(/&/g, ' ')
    .replace(/\s+/g, ' ');
}

function keyFromId(id?: string): string | undefined {
  if (!id) return undefined;
  if (ALIASES[id]) return ALIASES[id];
  if (id.startsWith('ing-may-')) {
    const allergenId = `ing-${id.replace('ing-may-', '')}`;
    return ALIASES[allergenId];
  }
  return undefined;
}

function keyFromName(name: string): string | undefined {
  const normalized = normalizeLookupKey(name);
  return ALIASES[normalized] ?? ALIASES[normalized.replace(/\s+/g, '_')];
}

function translateKey(key: string | undefined, language: string): string | undefined {
  if (!key) return undefined;
  const lang = getDisplayLanguage(language);
  return DISPLAY_NAMES[key]?.[lang] ?? DISPLAY_NAMES[key]?.en;
}

function splitMayContain(name: string): { isMayContain: boolean; name: string } {
  const trimmed = name.trim();
  const match = trimmed.match(/^may contain:\s*(.+)$/i);
  if (match) return { isMayContain: true, name: match[1] };
  return { isMayContain: false, name: trimmed };
}

export function getIngredientDisplayName(
  ingredient: DisplayNameSource | IngredientSummary | string,
  language: string,
): string {
  const lang = getDisplayLanguage(language);
  const rawName = typeof ingredient === 'string' ? ingredient : ingredient.name;
  const { isMayContain, name } = splitMayContain(rawName);

  if (typeof ingredient !== 'string') {
    const translated = ingredient.translations?.[lang] ?? ingredient.translations?.[language];
    if (translated) return isMayContain ? `${MAY_CONTAIN_PREFIX[lang]}: ${translated}` : translated;
  }

  const key = typeof ingredient === 'string'
    ? keyFromName(name)
    : keyFromName(name) ??
      keyFromId(ingredient.id) ??
      keyFromId('allergenId' in ingredient ? ingredient.allergenId : undefined);
  const translated = translateKey(key, lang) ?? name;

  if (translated !== name) {
    return isMayContain ? `${MAY_CONTAIN_PREFIX[lang]}: ${translated}` : translated;
  }

  if (typeof ingredient !== 'string' && lang === 'ko' && ingredient.nameKo && ingredient.nameKo !== ingredient.name) {
    return isMayContain ? `${MAY_CONTAIN_PREFIX[lang]}: ${ingredient.nameKo}` : ingredient.nameKo;
  }

  return isMayContain ? `${MAY_CONTAIN_PREFIX[lang]}: ${translated}` : translated;
}

export function getAllergenDisplayName(idOrName: string, language: string): string {
  return translateKey(keyFromId(idOrName) ?? keyFromName(idOrName), language) ?? idOrName;
}

export function getCatalogCategoryDisplayName(
  category: { code: string; name: string } | string,
  language: string,
): string {
  const codeOrName = typeof category === 'string' ? category : category.code || category.name;
  const fallback = typeof category === 'string' ? category : category.name;
  return translateKey(keyFromName(codeOrName) ?? keyFromName(fallback), language) ?? fallback;
}

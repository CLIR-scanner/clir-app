// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { Product, QAAnswer, QAQuestion, RiskLevel } from '../types';

type RankedProduct = Product & {
  favoriteCount: number;
  rating: number;
};

const PRODUCT_IMAGES = {
  icedTea: 'https://images.openfoodfacts.org/images/products/004/900/005/0314/front_en.12.400.jpg',
  oatMilk: 'https://images.openfoodfacts.org/images/products/541/118/811/9098/front_en.13.400.jpg',
  cookies: 'https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.11.400.jpg',
  juice: 'https://images.openfoodfacts.org/images/products/003/800/014/1081/front_en.13.400.jpg',
  bread: 'https://images.openfoodfacts.org/images/products/007/874/213/0645/front_en.13.400.jpg',
  sparkling: 'https://images.openfoodfacts.org/images/products/005/449/000/1520/front_en.4.400.jpg',
  cereal: 'https://images.openfoodfacts.org/images/products/003/800/013/8913/front_en.15.400.jpg',
  chips: 'https://images.openfoodfacts.org/images/products/002/840/002/0235/front_en.13.400.jpg',
  chocolate: 'https://images.openfoodfacts.org/images/products/004/000/005/1245/front_en.13.400.jpg',
  jam: 'https://images.openfoodfacts.org/images/products/005/150/000/0251/front_en.12.400.jpg',
  crackers: 'https://images.openfoodfacts.org/images/products/004/400/003/1151/front_en.12.400.jpg',
  sauce: 'https://images.openfoodfacts.org/images/products/002/100/000/6663/front_en.11.400.jpg',
  yogurt: 'https://images.openfoodfacts.org/images/products/003/666/320/3010/front_en.11.400.jpg',
  granola: 'https://images.openfoodfacts.org/images/products/001/600/026/4307/front_en.12.400.jpg',
  lemonade: 'https://images.openfoodfacts.org/images/products/007/611/130/0046/front_en.11.400.jpg',
};

function makeProduct(params: {
  id: string;
  name: string;
  brand: string;
  image: string;
  category: string;
  riskLevel: RiskLevel;
  favoriteCount: number;
  rating: number;
}): RankedProduct {
  return {
    id: params.id,
    name: params.name,
    brand: params.brand,
    image: params.image,
    category: params.category,
    ingredients: [],
    isSafe: params.riskLevel === 'safe',
    riskLevel: params.riskLevel,
    riskIngredients: [],
    mayContainIngredients: [],
    alternatives: [],
    favoriteCount: params.favoriteCount,
    rating: params.rating,
  };
}

const WEEKEND_POPULAR_PRODUCTS: RankedProduct[] = [
  makeProduct({ id: 'trend-iced-tea', name: 'Peach Iced Tea', brand: 'Pure Leaf', image: PRODUCT_IMAGES.icedTea, category: 'beverages', riskLevel: 'safe', favoriteCount: 3205, rating: 4.75 }),
  makeProduct({ id: 'trend-oat-milk', name: 'Barista Oat Milk', brand: 'Oatly', image: PRODUCT_IMAGES.oatMilk, category: 'beverages', riskLevel: 'safe', favoriteCount: 2894, rating: 4.68 }),
  makeProduct({ id: 'trend-cookies', name: 'Oreo Original', brand: 'Nabisco', image: PRODUCT_IMAGES.cookies, category: 'cookies', riskLevel: 'caution', favoriteCount: 2391, rating: 4.60 }),
  makeProduct({ id: 'trend-juice', name: 'Apple Juice', brand: 'Mott\'s', image: PRODUCT_IMAGES.juice, category: 'beverages', riskLevel: 'safe', favoriteCount: 2107, rating: 4.50 }),
  makeProduct({ id: 'trend-bread', name: 'Whole Grain Bread', brand: 'Nature\'s Own', image: PRODUCT_IMAGES.bread, category: 'bakery', riskLevel: 'caution', favoriteCount: 2034, rating: 4.42 }),
  makeProduct({ id: 'trend-sparkling', name: 'Sprite', brand: 'The Coca-Cola Company', image: PRODUCT_IMAGES.sparkling, category: 'beverages', riskLevel: 'safe', favoriteCount: 1845, rating: 4.30 }),
  makeProduct({ id: 'trend-cereal', name: 'Honey Nut Cereal', brand: 'Cheerios', image: PRODUCT_IMAGES.cereal, category: 'cereals', riskLevel: 'caution', favoriteCount: 1789, rating: 4.80 }),
  makeProduct({ id: 'trend-chips', name: 'Classic Potato Chips', brand: 'Lay\'s', image: PRODUCT_IMAGES.chips, category: 'snacks', riskLevel: 'safe', favoriteCount: 1639, rating: 4.50 }),
  makeProduct({ id: 'trend-chocolate', name: 'Dark Chocolate Bar', brand: 'Lindt', image: PRODUCT_IMAGES.chocolate, category: 'chocolates', riskLevel: 'danger', favoriteCount: 1532, rating: 4.28 }),
  makeProduct({ id: 'trend-jam', name: 'Strawberry Jam', brand: 'Smucker\'s', image: PRODUCT_IMAGES.jam, category: 'spreads', riskLevel: 'safe', favoriteCount: 1437, rating: 4.32 }),
  makeProduct({ id: 'trend-crackers', name: 'Original Crackers', brand: 'Ritz', image: PRODUCT_IMAGES.crackers, category: 'cookies', riskLevel: 'caution', favoriteCount: 1329, rating: 4.65 }),
  makeProduct({ id: 'trend-sauce', name: 'Tomato Basil Sauce', brand: 'Prego', image: PRODUCT_IMAGES.sauce, category: 'condiments', riskLevel: 'safe', favoriteCount: 1207, rating: 4.20 }),
  makeProduct({ id: 'trend-yogurt', name: 'Greek Yogurt', brand: 'Chobani', image: PRODUCT_IMAGES.yogurt, category: 'dairy', riskLevel: 'danger', favoriteCount: 1112, rating: 4.85 }),
  makeProduct({ id: 'trend-granola', name: 'Crunchy Granola', brand: 'Nature Valley', image: PRODUCT_IMAGES.granola, category: 'cereals', riskLevel: 'caution', favoriteCount: 1050, rating: 4.70 }),
  makeProduct({ id: 'trend-lemonade', name: 'Lemonade', brand: 'Simply', image: PRODUCT_IMAGES.lemonade, category: 'beverages', riskLevel: 'safe', favoriteCount: 942, rating: 4.25 }),
];

const EXTRA_PRODUCT_SEEDS = [
  { name: 'Vanilla Almond Milk', brand: 'Silk', image: PRODUCT_IMAGES.oatMilk, category: 'beverages', riskLevel: 'danger' as const },
  { name: 'Blueberry Bagels', brand: 'Thomas', image: PRODUCT_IMAGES.bread, category: 'bakery', riskLevel: 'caution' as const },
  { name: 'Sea Salt Crackers', brand: 'Simple Mills', image: PRODUCT_IMAGES.crackers, category: 'cookies', riskLevel: 'safe' as const },
  { name: 'Ginger Ale', brand: 'Canada Dry', image: PRODUCT_IMAGES.sparkling, category: 'beverages', riskLevel: 'safe' as const },
  { name: 'Chocolate Granola', brand: 'Kind', image: PRODUCT_IMAGES.granola, category: 'cereals', riskLevel: 'caution' as const },
  { name: 'Honey Mustard Sauce', brand: 'French\'s', image: PRODUCT_IMAGES.sauce, category: 'condiments', riskLevel: 'safe' as const },
  { name: 'Kettle Cooked Chips', brand: 'Cape Cod', image: PRODUCT_IMAGES.chips, category: 'snacks', riskLevel: 'safe' as const },
  { name: 'Raspberry Jam', brand: 'Bonne Maman', image: PRODUCT_IMAGES.jam, category: 'spreads', riskLevel: 'safe' as const },
  { name: 'Milk Chocolate Minis', brand: 'Hershey\'s', image: PRODUCT_IMAGES.chocolate, category: 'chocolates', riskLevel: 'danger' as const },
  { name: 'Vanilla Greek Yogurt', brand: 'Fage', image: PRODUCT_IMAGES.yogurt, category: 'dairy', riskLevel: 'danger' as const },
  { name: 'Orange Juice', brand: 'Tropicana', image: PRODUCT_IMAGES.juice, category: 'beverages', riskLevel: 'safe' as const },
  { name: 'Sourdough Bread', brand: 'Dave\'s Killer Bread', image: PRODUCT_IMAGES.bread, category: 'bakery', riskLevel: 'caution' as const },
  { name: 'Peanut Butter Cookies', brand: 'Nutter Butter', image: PRODUCT_IMAGES.cookies, category: 'cookies', riskLevel: 'danger' as const },
  { name: 'Sparkling Lemon Water', brand: 'LaCroix', image: PRODUCT_IMAGES.lemonade, category: 'beverages', riskLevel: 'safe' as const },
  { name: 'Corn Flakes', brand: 'Kellogg\'s', image: PRODUCT_IMAGES.cereal, category: 'cereals', riskLevel: 'safe' as const },
];

const EXTRA_WEEKEND_POPULAR_PRODUCTS: RankedProduct[] = Array.from({ length: 45 }, (_, index) => {
  const seed = EXTRA_PRODUCT_SEEDS[index % EXTRA_PRODUCT_SEEDS.length];
  const wave = Math.floor(index / EXTRA_PRODUCT_SEEDS.length) + 1;
  const favoriteCount = Math.max(108, 920 - index * 17 - wave * 9);
  return makeProduct({
    id: `trend-extra-${index + 16}`,
    name: wave === 1 ? seed.name : `${seed.name} ${wave}`,
    brand: seed.brand,
    image: seed.image,
    category: seed.category,
    riskLevel: seed.riskLevel,
    favoriteCount,
    rating: 4.15 + ((index % 9) * 0.07),
  });
});

const QA_QUESTIONS: QAQuestion[] = [
  {
    id: 'qa-notice-guideline',
    label: 'Notice',
    title: 'Clir Guideline',
    body: 'Official notes from the Clir team on how to ask clearer product safety questions.',
    author: 'Clir Official Team',
    viewCount: 125,
    answerCount: 12,
    isNotice: true,
  },
  {
    id: 'qa-product-match',
    label: 'Asking',
    title: 'Which is the right product?',
    body: 'I found two similar packages at the store. Which one should I choose for a dairy allergy profile?',
    author: 'mika_shop',
    viewCount: 125,
    answerCount: 12,
  },
  {
    id: 'qa-hidden-dairy',
    label: 'Products Asking',
    title: 'Which product is this? Does it contain hidden dairy?',
    body: 'This product is not working. I want to go to the who will categories who want to yes please of course yes who ...',
    author: 'allergy_mom',
    viewCount: 125,
    answerCount: 12,
  },
  {
    id: 'qa-oat-milk',
    label: 'Products Asking',
    title: 'Is this oat milk safe for strict vegan settings?',
    body: 'The label mentions vitamin D and natural flavor. Has anyone checked whether this brand is okay?',
    author: 'vegan_k',
    viewCount: 98,
    answerCount: 8,
  },
  {
    id: 'qa-bakery',
    label: 'Products Asking',
    title: 'Can I buy this bread with a peanut allergy?',
    body: 'The package says it may contain tree nuts but does not mention peanuts. I am confused about the risk level.',
    author: 'jun_food',
    viewCount: 87,
    answerCount: 6,
  },
  {
    id: 'qa-sauce',
    label: 'Products Asking',
    title: 'Does this sauce include anchovy or seafood extract?',
    body: 'I scanned it but the ingredient text was blurry. Looking for help from anyone who bought the same product.',
    author: 'safe_cart',
    viewCount: 72,
    answerCount: 4,
  },
];

let QA_ANSWERS: QAAnswer[] = [
  {
    id: 'answer-guideline-1',
    questionId: 'qa-notice-guideline',
    author: 'Clir Official Team',
    body: 'Please include the product name, brand, and a clear photo of the ingredient label when you ask a safety question.',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'answer-product-match-1',
    questionId: 'qa-product-match',
    author: 'safe_reader',
    body: 'For dairy allergy, choose the one with a clear allergen statement. If the package only says natural flavor, I would avoid it until verified.',
    createdAt: '2026-05-02T08:30:00Z',
  },
  {
    id: 'answer-product-match-2',
    questionId: 'qa-product-match',
    author: 'Clir Official Team',
    body: 'The safer option is usually the product with complete ingredient disclosure and no may-contain dairy warning.',
    createdAt: '2026-05-02T12:15:00Z',
  },
  {
    id: 'answer-hidden-dairy-1',
    questionId: 'qa-hidden-dairy',
    author: 'label_helper',
    body: 'Check for whey, casein, lactose, milk powder, and butter oil. Those are common hidden dairy terms.',
    createdAt: '2026-05-03T09:10:00Z',
  },
  {
    id: 'answer-oat-milk-1',
    questionId: 'qa-oat-milk',
    author: 'vegan_labeler',
    body: 'Some vitamin D can be animal-derived. If strict vegan mode matters, look for D2 or explicit vegan certification.',
    createdAt: '2026-05-03T15:42:00Z',
  },
];

/**
 * /recommend/weekend — 주말 인기 제품 목록을 반환한다.
 */
export async function getWeekendPopular(): Promise<Product[]> {
  return [...WEEKEND_POPULAR_PRODUCTS, ...EXTRA_WEEKEND_POPULAR_PRODUCTS]
    .sort((a, b) => b.favoriteCount - a.favoriteCount);
}

/**
 * /recommend/similar-users — 유사 프로필 사용자들의 이번 주 즐겨찾기를 반환한다.
 */
export async function getSimilarUsersFavorites(): Promise<Product[]> {
  throw new Error('Not implemented');
}

/**
 * /recommend/qa — 커뮤니티 Q&A 질문 목록을 반환한다.
 */
export async function getQAQuestions(): Promise<QAQuestion[]> {
  return QA_QUESTIONS.map(question => ({
    ...question,
    answerCount: QA_ANSWERS.filter(answer => answer.questionId === question.id).length || question.answerCount,
  }));
}

/**
 * /recommend/qa/:id — Q&A 질문 상세와 답글 목록을 반환한다.
 */
export async function getQAQuestionDetail(questionId: string): Promise<{
  question: QAQuestion;
  answers: QAAnswer[];
}> {
  const question = QA_QUESTIONS.find(item => item.id === questionId);
  if (!question) {
    throw new Error('Question not found');
  }
  const answers = QA_ANSWERS.filter(answer => answer.questionId === questionId);
  return {
    question: {
      ...question,
      answerCount: answers.length || question.answerCount,
    },
    answers,
  };
}

/**
 * /recommend/qa/:id/answers — Q&A 답글을 추가한다.
 */
export async function addQAAnswer(params: {
  questionId: string;
  author: string;
  body: string;
}): Promise<QAAnswer> {
  const answer: QAAnswer = {
    id: `answer-local-${Date.now()}`,
    questionId: params.questionId,
    author: params.author,
    body: params.body,
    createdAt: new Date().toISOString(),
  };
  QA_ANSWERS = [...QA_ANSWERS, answer];
  return answer;
}

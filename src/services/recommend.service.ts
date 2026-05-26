// TODO: Real API 연동 시 이 파일의 구현부만 교체
import { MagazineItem, Product, QAAnswer, QAQuestion, QnaCategory, RiskLevel } from '../types';
import { apiFetch, apiFormFetch } from '../lib/api';

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

// ─── Q&A API 내부 타입 (BE QnaPostSummary / QnaAnswer / QnaImage 와 1:1) ─────

type QnaImageApi = {
  storagePath: string;
  url: string;
  expiresAt: string;
};

type QnaPostSummaryApi = {
  id: string;
  userId: string;
  userNickname?: string;
  title: string;
  content: string;
  category: QnaCategory;
  answerCount: number;
  isResolved: boolean;
  relatedProductId?: string | null;
  createdAt: string;
  updatedAt?: string;
  /** 목록은 항상 빈 배열, 상세에서만 채워짐 (BE 비용 절감 정책). */
  images: QnaImageApi[];
};

type QnaAnswerApi = {
  id: string;
  qnaId: string;
  userId: string;
  userNickname?: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
};

type QnaPostDetailApi = QnaPostSummaryApi & {
  relatedProduct?: { productId: string; name: string; image: string | null } | null;
  answers: QnaAnswerApi[];
};

/** category → 화면 표시 label. QACreateScreen 의 카테고리 칩과 동일 텍스트. */
const CATEGORY_LABEL: Record<QnaCategory, string> = {
  all:        'All',
  product:    'Product Asking',
  allergy:    'Allergy',
  vegetarian: 'Vegetarian Diet',
};

function mapQnaToQuestion(post: QnaPostSummaryApi): QAQuestion {
  return {
    id: post.id,
    label: CATEGORY_LABEL[post.category],
    title: post.title,
    body: post.content,
    author: post.userNickname ?? '익명',
    viewCount: 0,                      // BE 미지원 — 후속 PR
    answerCount: post.answerCount,
    category: post.category,
    images: post.images.map(i => i.url),
  };
}

function mapQnaAnswer(ans: QnaAnswerApi): QAAnswer {
  return {
    id: ans.id,
    questionId: ans.qnaId,
    author: ans.userNickname ?? '익명',
    body: ans.content,
    createdAt: ans.createdAt,
  };
}

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
  return [
    makeProduct({ id: 'similar-yogurt', name: 'Coconut Yogurt', brand: 'So Delicious', image: PRODUCT_IMAGES.yogurt, category: 'dairy', riskLevel: 'danger', favoriteCount: 2391, rating: 4.60 }),
    makeProduct({ id: 'similar-lemonade', name: 'Organic Lemonade', brand: 'Santa Cruz', image: PRODUCT_IMAGES.lemonade, category: 'beverages', riskLevel: 'safe', favoriteCount: 2391, rating: 4.60 }),
    makeProduct({ id: 'similar-water', name: 'Mineral Water', brand: 'Evian', image: PRODUCT_IMAGES.sparkling, category: 'beverages', riskLevel: 'safe', favoriteCount: 2391, rating: 4.60 }),
    makeProduct({ id: 'similar-cereal', name: 'Blueberry Cereal', brand: 'Nature Path', image: PRODUCT_IMAGES.cereal, category: 'cereals', riskLevel: 'caution', favoriteCount: 2391, rating: 4.60 }),
    makeProduct({ id: 'similar-chips', name: 'Sea Salt Chips', brand: 'Kettle Brand', image: PRODUCT_IMAGES.chips, category: 'snacks', riskLevel: 'safe', favoriteCount: 2391, rating: 4.60 }),
    makeProduct({ id: 'similar-crackers', name: 'Seed Crackers', brand: 'Simple Mills', image: PRODUCT_IMAGES.crackers, category: 'cookies', riskLevel: 'safe', favoriteCount: 2391, rating: 4.60 }),
  ];
}

/**
 * GET /qna — Q&A 게시글 목록.
 *  - opts.category 'all' 또는 미지정 = 전체 (필터 없음)
 *  - opts.category product/allergy/vegetarian = 해당 + 'all' 합집합
 *  - 기본 sort=latest, limit=20
 */
export async function getQAQuestions(opts: {
  category?: QnaCategory;
  search?: string;
  sort?: 'latest' | 'oldest' | 'mostAnswered';
  limit?: number;
  offset?: number;
} = {}): Promise<{ questions: QAQuestion[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (opts.category) params.set('category', opts.category);
  if (opts.search)   params.set('search', opts.search);
  params.set('sort',   opts.sort ?? 'latest');
  params.set('limit',  String(opts.limit  ?? 20));
  params.set('offset', String(opts.offset ?? 0));

  const data = await apiFetch<{
    posts: QnaPostSummaryApi[];
    total: number;
    hasMore: boolean;
  }>(`/qna?${params.toString()}`);

  return {
    questions: data.posts.map(mapQnaToQuestion),
    total: data.total,
    hasMore: data.hasMore,
  };
}

/**
 * GET /qna/:id — Q&A 상세. 응답의 images 는 TTL 5분 signed URL.
 * 만료 시 동일 호출로 새 URL 회수.
 */
export async function getQAQuestionDetail(questionId: string): Promise<{
  question: QAQuestion;
  answers: QAAnswer[];
}> {
  const data = await apiFetch<QnaPostDetailApi>(
    `/qna/${encodeURIComponent(questionId)}`,
  );
  return {
    question: mapQnaToQuestion(data),
    answers: data.answers.map(mapQnaAnswer),
  };
}

/**
 * POST /qna/:id/answers — 답변 등록. 작성자는 토큰에서 추출되므로 author 미전송.
 */
export async function addQAAnswer(params: {
  questionId: string;
  author: string;
  body: string;
}): Promise<QAAnswer> {
  const data = await apiFetch<QnaAnswerApi>(
    `/qna/${encodeURIComponent(params.questionId)}/answers`,
    { method: 'POST', body: JSON.stringify({ content: params.body }) },
  );
  return mapQnaAnswer(data);
}

/**
 * POST /qna — Q&A 게시글 등록 (multipart). 이미지 ≤4장, 파일당 ≤5MB.
 *  - category 필수 (all/product/allergy/vegetarian)
 *  - photos 는 RN 이미지 picker 의 uri 배열 (file:// 등)
 */
export async function createQAQuestion(params: {
  title: string;
  content: string;
  category: QnaCategory;
  photos: string[];
  relatedProductId?: string;
}): Promise<QAQuestion> {
  const form = new FormData();
  form.append('title',    params.title);
  form.append('content',  params.content);
  form.append('category', params.category);
  if (params.relatedProductId) form.append('relatedProductId', params.relatedProductId);

  for (const uri of params.photos) {
    const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
    const mime = ext === 'png'  ? 'image/png'
               : ext === 'webp' ? 'image/webp'
               :                  'image/jpeg';
    // RN FormData 의 파일 시그니처 — { uri, name, type }
    form.append('images', {
      uri,
      name: `photo-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`,
      type: mime,
    } as unknown as Blob);
  }

  const data = await apiFormFetch<QnaPostSummaryApi>('/qna', form);
  return mapQnaToQuestion(data);
}

const MAGAZINE_ITEMS: MagazineItem[] = [
  {
    id: 'mag-001',
    title: 'Top 10 Allergen-Free Snacks of 2026',
    body: "Discover the best snacks free from top 8 allergens. We reviewed over 200 products so you don't have to — here are the safest and tastiest options available right now.",
    image: 'https://loremflickr.com/800/500/healthy,snack,food?lock=101',
    category: 'snack',
    publishedAt: '2026-05-06T02:00:00Z',
  },
  {
    id: 'mag-002',
    title: 'Reading Food Labels Like a Pro',
    body: 'A complete guide to ingredient lists and allergen warnings. From "may contain" disclaimers to hidden dairy names — learn exactly what to look for before you buy.',
    image: 'https://loremflickr.com/800/500/food,label,package?lock=102',
    category: 'guide',
    publishedAt: '2026-05-05T08:30:00Z',
  },
  {
    id: 'mag-003',
    title: 'Vegan Substitutes That Actually Work',
    body: 'Plant-based swaps that make recipes just as delicious. Eggs, dairy, gelatin — we tested the most popular alternatives so your allergy-friendly meals never feel like a compromise.',
    image: 'https://loremflickr.com/800/500/vegan,plant,food?lock=103',
    category: 'recipe',
    publishedAt: '2026-05-04T14:00:00Z',
  },
  {
    id: 'mag-004',
    title: 'Hidden Peanut Ingredients You Might Miss',
    body: 'Peanut oil, groundnut paste, mixed nut butter — these terms all mean peanut. This guide helps strict allergy profiles catch every hidden name before it becomes a risk.',
    image: 'https://loremflickr.com/800/500/peanut,allergy,ingredient?lock=104',
    category: 'guide',
    publishedAt: '2026-05-03T10:00:00Z',
  },
  {
    id: 'mag-005',
    title: 'Grocery Shopping With Kids Who Have Allergies',
    body: 'How to turn every shopping trip into a safe and empowering experience for allergy-conscious families. Tips from parents who have been navigating this for years.',
    image: 'https://loremflickr.com/800/500/grocery,family,shopping?lock=105',
    category: 'lifestyle',
    publishedAt: '2026-05-02T09:00:00Z',
  },
];

/**
 * /recommend/magazine — 매거진 아티클 목록을 반환한다.
 */
export async function getMagazineItems(category?: string): Promise<MagazineItem[]> {
  if (!category || category === 'all') return MAGAZINE_ITEMS;
  return MAGAZINE_ITEMS.filter(item => item.category === category);
}

/**
 * /recommend/magazine/:id — 매거진 아티클 단건 조회
 */
export async function getMagazineItem(id: string): Promise<MagazineItem | null> {
  return MAGAZINE_ITEMS.find(m => m.id === id) ?? null;
}

/**
 * /recommend/magazine/:id/bookmark — 북마크 토글
 */
export async function toggleMagazineBookmark(id: string): Promise<boolean> {
  const item = MAGAZINE_ITEMS.find(m => m.id === id);
  if (!item) return false;
  item.isBookmarked = !item.isBookmarked;
  return item.isBookmarked;
}

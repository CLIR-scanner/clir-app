// 제품 카테고리 SSOT (Single Source of Truth) — Phase 1.
//
// 이 정의는 다음 3곳에서 동일하게 참조된다:
//   - FE 카테고리 chip / 필터 UI (FilterBottomSheet 의 INITIAL_FILTER_CATEGORIES)
//   - BE OFF → 내부 카테고리 매핑 결과 (clir-api/src/lib/offCategoryMap.ts 의 결과값)
//   - docs/api-spec.yaml 의 product.category enum
//
// ⚠️ 이 파일을 수정할 때는 clir-api/src/lib/categories.ts 도 동일하게 수정해야 한다.
// 두 레포가 분리되어 monorepo 자동 sync 불가 — 수동 sync 정책.
//
// candies → chocolates 흡수 (의미 인접: "Chocolates & Candy" label 통합)
// meals 폐기 (Phase 1 시점에 OFF 매핑 미정의, 시드 row 만 존재 → 다른 카테고리 reassign)

export interface ProductCategory {
  /** BE products.category 컬럼 값 + FE chip id */
  readonly id: string;
  /** chip / 필터 UI 표시 라벨 (영문 — i18n 통합은 별도 작업) */
  readonly label: string;
}

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  { id: 'beverages',  label: 'Beverages'           },
  { id: 'snacks',     label: 'Snacks & Chips'      },
  { id: 'bakery',     label: 'Bakery & Bread'      },
  { id: 'dairy',      label: 'Dairy Products'      },
  { id: 'cereals',    label: 'Cereals & Grains'    },
  { id: 'cookies',    label: 'Cookies & Crackers'  },
  { id: 'chocolates', label: 'Chocolates & Candy'  },
  { id: 'spreads',    label: 'Spreads & Jams'      },
  { id: 'condiments', label: 'Sauces & Condiments' },
  { id: 'meat',       label: 'Meat & Poultry'      },
  { id: 'seafood',    label: 'Seafood'             },
  { id: 'pasta',      label: 'Pasta & Noodles'     },
  { id: 'frozen',     label: 'Frozen Foods'        },
  { id: 'nuts',       label: 'Nuts & Dried Fruit'  },
] as const;

export type ProductCategoryId = typeof PRODUCT_CATEGORIES[number]['id'];

export const PRODUCT_CATEGORY_IDS: readonly string[] =
  PRODUCT_CATEGORIES.map(c => c.id);

export function isProductCategory(v: unknown): v is ProductCategoryId {
  return typeof v === 'string' && PRODUCT_CATEGORY_IDS.includes(v);
}

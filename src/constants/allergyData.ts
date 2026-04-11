// 알러지 카테고리 및 항목 더미 데이터 (백엔드 연결 전)

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

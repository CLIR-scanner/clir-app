export const DIET_RESTRICTION_CATEGORIES = [
  'Fruits / Grains',
  'Vegetables',
  'Dairy',
  'Eggs',
  'Seafood',
  'Poultry',
  'Red Meat',
];

export const DIET_LABELS: Record<string, string> = {
  pescatarian:          'Pescatarian',
  vegan:                'Vegan',
  lacto_vegetarian:     'Lacto-Vegetarian',
  ovo_vegetarian:       'Ovo-Vegetarian',
  lacto_ovo_vegetarian: 'Lacto-ovo Vegetarian',
  pesco_vegetarian:     'Pesco-Vegetarian',
  pollo_vegetarian:     'Pollo-Vegetarian',
  flexitarian:          'Flexitarian',
  strict:               'Strict Vegan',
  flexible:             'Flexible Vegan',
};

export const DIET_TITLES: Record<string, string> = {
  pescatarian:          'a Pescatarian',
  vegan:                'a Vegan',
  lacto_vegetarian:     'a Lacto-Vegetarian',
  ovo_vegetarian:       'an Ovo-Vegetarian',
  lacto_ovo_vegetarian: 'a Lacto-ovo-Vegetarian',
  pesco_vegetarian:     'a Pesco-Vegetarian',
  pollo_vegetarian:     'a Pollo-Vegetarian',
  flexitarian:          'a Flexitarian',
  strict:               'a Strict Vegan',
  flexible:             'a Flexible Vegan',
};

export const DIET_AVOIDED_CATEGORIES: Record<string, string[]> = {
  pescatarian:          ['Poultry', 'Red Meat'],
  vegan:                ['Dairy', 'Eggs', 'Seafood', 'Poultry', 'Red Meat'],
  lacto_vegetarian:     ['Eggs', 'Seafood', 'Poultry', 'Red Meat'],
  ovo_vegetarian:       ['Dairy', 'Seafood', 'Poultry', 'Red Meat'],
  lacto_ovo_vegetarian: ['Seafood', 'Poultry', 'Red Meat'],
  pesco_vegetarian:     ['Poultry', 'Red Meat'],
  pollo_vegetarian:     ['Seafood', 'Red Meat'],
  flexitarian:          ['Red Meat'],
  strict:               ['Dairy', 'Eggs', 'Seafood', 'Poultry', 'Red Meat'],
  flexible:             ['Dairy', 'Eggs', 'Seafood', 'Poultry', 'Red Meat'],
};

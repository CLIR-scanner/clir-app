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
  pescatarian:          'Fruitarian',
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
  pescatarian:          'a Fruitarian',
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

export const DIET_TYPE_DESCRIPTIONS: Record<string, string> = {
  pescatarian:          '✓  Fruits, grains, nuts\n✗  Vegetables, meat, dairy, eggs, seafood',
  vegan:                '✓  All plant-based foods\n✗  Meat, seafood, dairy, eggs, honey',
  lacto_vegetarian:     '✓  Vegetables, dairy\n✗  Meat, seafood, eggs',
  ovo_vegetarian:       '✓  Vegetables, eggs\n✗  Meat, seafood, dairy',
  lacto_ovo_vegetarian: '✓  Vegetables, dairy, eggs\n✗  Meat, seafood',
  pesco_vegetarian:     '✓  Vegetables, fish & seafood\n✗  Meat, poultry',
  pollo_vegetarian:     '✓  Vegetables, fish & seafood, poultry\n✗  Red meat (beef, pork, lamb)',
  flexitarian:          '✓  Mostly plant-based\n✗  Nothing strictly — just minimizes meat',
};

export const DIET_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Fruits / Grains': 'Includes fruits, grains, cereals, bread, pasta, rice, and other plant-based staples.',
  'Vegetables':      'Includes all vegetables — leafy greens, root vegetables, legumes, and more.',
  'Dairy':           'Includes milk, cheese, yogurt, butter, and all products derived from animal milk.',
  'Eggs':            'Includes chicken eggs and any products that contain eggs.',
  'Seafood':         'Includes fish, shellfish, crustaceans, and all other aquatic animals.',
  'Poultry':         'Includes chicken, turkey, duck, and other birds raised for food.',
  'Red Meat':        'Includes beef, pork, lamb, and other red meats from mammals.',
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

// 모든 플로우 total = 10 고정, 각 화면을 0~100% 범위에 고르게 분배
// allergy (5화면): 20→40→60→80→100
const ALLERGY_STEPS: Record<string, number> = {
  Survey: 2,
  SurveyAllergySelect: 4,
  SurveyAllergyReaction: 6,
  SurveyAllergyIngredients: 8,
  SurveyAllergyConfirm: 10,
};

// vegetarian (5화면): 20→40→60→80→100 (일정 간격)
const VEGETARIAN_STEPS: Record<string, number> = {
  Survey: 2,
  SurveyVegetarian: 4,
  SurveyVeganStrictness: 6,
  SurveyDietConfirm: 8,
  SurveyVegetarianIngredients: 10,
};

// both (9화면): 1→2→3→4→5→7→8→9→10
const BOTH_STEPS: Record<string, number> = {
  Survey: 1,
  SurveyAllergySelect: 2,
  SurveyAllergyReaction: 3,
  SurveyAllergyIngredients: 4,
  SurveyAllergyConfirm: 5,
  SurveyVegetarian: 7,
  SurveyVeganStrictness: 8,
  SurveyDietConfirm: 9,
  SurveyVegetarianIngredients: 10,
};

export function getSurveyProgress(
  screenName: string,
  dietaryType?: string,
): { step: number; total: number } {
  if (dietaryType === 'both') {
    return { step: BOTH_STEPS[screenName] ?? 1, total: 10 };
  }
  if (dietaryType === 'vegetarian') {
    return { step: VEGETARIAN_STEPS[screenName] ?? 2, total: 10 };
  }
  return { step: ALLERGY_STEPS[screenName] ?? 2, total: 10 };
}

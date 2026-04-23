// 모든 플로우 total = 10 고정, 각 화면을 0~100% 범위에 고르게 분배
// allergy (6화면): 20→40→50→60→80→100
const ALLERGY_STEPS: Record<string, number> = {
  Survey: 2,
  SurveyAllergy: 4,
  SurveyAllergyDoc: 5,
  SurveyAllergyDocResult: 5,
  SurveyAllergySelect: 5,
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

// both (10화면): 10→20→...→100 (10%씩)
const BOTH_STEPS: Record<string, number> = {
  Survey: 1,
  SurveyAllergy: 2,
  SurveyAllergyDoc: 3,
  SurveyAllergyDocResult: 3,
  SurveyAllergySelect: 3,
  SurveyAllergyReaction: 4,
  SurveyAllergyIngredients: 5,
  SurveyAllergyConfirm: 6,
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

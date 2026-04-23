import React, { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

export const SurveyProgressContext = createContext<SharedValue<number> | null>(null);

export function useSurveyProgressShared(): SharedValue<number> {
  const ctx = useContext(SurveyProgressContext);
  if (!ctx) throw new Error('SurveyProgressContext not provided');
  return ctx;
}

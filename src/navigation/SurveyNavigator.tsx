import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSharedValue } from 'react-native-reanimated';
import { AuthStackParamList } from '../types';
import { SurveyProgressContext } from '../contexts/SurveyProgressContext';

import SurveyLandingScreen from '../screens/auth/SurveyLandingScreen';
import SurveyScreen from '../screens/auth/SurveyScreen';
import SurveyAllergyEditListScreen from '../screens/auth/SurveyAllergyEditListScreen';
import SurveyAllergySelectScreen from '../screens/auth/SurveyAllergySelectScreen';
import SurveyAllergyReactionScreen from '../screens/auth/SurveyAllergyReactionScreen';
import SurveyAllergyIngredientsScreen from '../screens/auth/SurveyAllergyIngredientsScreen';
import SurveyAllergyConfirmScreen from '../screens/auth/SurveyAllergyConfirmScreen';
import SurveyVegetarianScreen from '../screens/auth/SurveyVegetarianScreen';
import SurveyVeganStrictnessScreen from '../screens/auth/SurveyVeganStrictnessScreen';
import SurveyDietConfirmScreen from '../screens/auth/SurveyDietConfirmScreen';
import SurveyVegetarianIngredientsScreen from '../screens/auth/SurveyVegetarianIngredientsScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function SurveyNavigator() {
  const surveyProgress = useSharedValue(0);
  return (
    <SurveyProgressContext.Provider value={surveyProgress}>
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDFFFD' } }} initialRouteName="SurveyLanding">
      <Stack.Screen name="SurveyLanding"             component={SurveyLandingScreen}             />
      {/* 설문 단계 전환: cross-fade. 각 화면이 자체 SurveyHeader(진행바)를 렌더하므로
          slide 계열을 쓰면 진행바가 가로로 끌려나가 연속 채움 애니메이션이 깨진다.
          fade 는 헤더를 제자리에 둔 채 콘텐츠만 부드럽게 디졸브 → 진행바 연속성 유지. */}
      <Stack.Group screenOptions={{ animation: 'fade', animationDuration: 220 }}>
        <Stack.Screen name="Survey"                    component={SurveyScreen}                    />
        <Stack.Screen name="SurveyAllergyEditList"     component={SurveyAllergyEditListScreen}     />
        <Stack.Screen name="SurveyAllergySelect"       component={SurveyAllergySelectScreen}       />
        <Stack.Screen name="SurveyAllergyReaction"     component={SurveyAllergyReactionScreen}     />
        <Stack.Screen name="SurveyAllergyIngredients"  component={SurveyAllergyIngredientsScreen}  />
        <Stack.Screen name="SurveyAllergyConfirm"      component={SurveyAllergyConfirmScreen}      />
        <Stack.Screen name="SurveyVegetarian"          component={SurveyVegetarianScreen}          />
        <Stack.Screen name="SurveyVeganStrictness"     component={SurveyVeganStrictnessScreen}     />
        <Stack.Screen name="SurveyDietConfirm"         component={SurveyDietConfirmScreen}         />
        <Stack.Screen name="SurveyVegetarianIngredients" component={SurveyVegetarianIngredientsScreen} />
      </Stack.Group>
    </Stack.Navigator>
    </SurveyProgressContext.Provider>
  );
}

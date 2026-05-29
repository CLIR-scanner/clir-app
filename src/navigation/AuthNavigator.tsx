import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSharedValue } from 'react-native-reanimated';
import { SurveyProgressContext } from '../contexts/SurveyProgressContext';
import { AuthStackParamList } from '../types';
import { START_AT_SURVEY } from '../constants/dev';
import AuthHomeScreen from '../screens/auth/AuthHomeScreen';
import TermsAgreementScreen from '../screens/auth/TermsAgreementScreen';
import TermsDetailScreen from '../screens/auth/TermsDetailScreen';
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

export default function AuthNavigator() {
  const surveyProgress = useSharedValue(0);
  return (

    <SurveyProgressContext.Provider value={surveyProgress}>
    {/* 앱 실행 직후 화면은 App.tsx 의 SplashOverlay 가 담당 → 별도 Splash(progress) 화면 없이
        곧바로 AuthHome(로그인). 오버레이 로고가 AuthHome 로고 위치/크기로 hold 후 핸드오프된다. */}
    <Stack.Navigator
      initialRouteName={START_AT_SURVEY ? 'SurveyLanding' : 'AuthHome'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDFFFD' } }}
    >
      <Stack.Screen name="TermsAgreement" component={TermsAgreementScreen} />
      <Stack.Screen name="TermsDetail" component={TermsDetailScreen} />
      <Stack.Screen name="AuthHome" component={AuthHomeScreen} />
      <Stack.Screen name="SurveyLanding" component={SurveyLandingScreen} />
      {/* 설문 단계 전환: cross-fade — 진행바(SurveyHeader) 연속성 유지를 위해 slide 대신 fade.
          상세 사유는 SurveyNavigator.tsx 참고. */}
      <Stack.Group screenOptions={{ animation: 'fade', animationDuration: 220 }}>
        <Stack.Screen name="Survey" component={SurveyScreen} />
        <Stack.Screen name="SurveyAllergyEditList" component={SurveyAllergyEditListScreen} />
        <Stack.Screen name="SurveyAllergySelect" component={SurveyAllergySelectScreen} />
        <Stack.Screen name="SurveyAllergyReaction" component={SurveyAllergyReactionScreen} />
        <Stack.Screen name="SurveyAllergyIngredients" component={SurveyAllergyIngredientsScreen} />
        <Stack.Screen name="SurveyAllergyConfirm" component={SurveyAllergyConfirmScreen} />
        <Stack.Screen name="SurveyVegetarian" component={SurveyVegetarianScreen} />
        <Stack.Screen name="SurveyVeganStrictness" component={SurveyVeganStrictnessScreen} />
        <Stack.Screen name="SurveyDietConfirm" component={SurveyDietConfirmScreen} />
        <Stack.Screen name="SurveyVegetarianIngredients" component={SurveyVegetarianIngredientsScreen} />
      </Stack.Group>
    </Stack.Navigator>
    </SurveyProgressContext.Provider>
  );
}

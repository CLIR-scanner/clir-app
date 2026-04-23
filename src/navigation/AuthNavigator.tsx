import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthHomeScreen from '../screens/auth/AuthHomeScreen';
import SurveyLandingScreen from '../screens/auth/SurveyLandingScreen';
import SurveyScreen from '../screens/auth/SurveyScreen';
import SurveyAllergyScreen from '../screens/auth/SurveyAllergyScreen';
import SurveyAllergyDocScreen from '../screens/auth/SurveyAllergyDocScreen';
import SurveyAllergyDocResultScreen from '../screens/auth/SurveyAllergyDocResultScreen';
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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9FFF3' } }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="AuthHome" component={AuthHomeScreen} />
      <Stack.Screen name="SurveyLanding" component={SurveyLandingScreen} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="SurveyAllergy" component={SurveyAllergyScreen} />
      <Stack.Screen name="SurveyAllergyDoc" component={SurveyAllergyDocScreen} />
      <Stack.Screen name="SurveyAllergyDocResult" component={SurveyAllergyDocResultScreen} />
      <Stack.Screen name="SurveyAllergyEditList" component={SurveyAllergyEditListScreen} />
      <Stack.Screen name="SurveyAllergySelect" component={SurveyAllergySelectScreen} />
      <Stack.Screen name="SurveyAllergyReaction" component={SurveyAllergyReactionScreen} />
      <Stack.Screen name="SurveyAllergyIngredients" component={SurveyAllergyIngredientsScreen} />
      <Stack.Screen name="SurveyAllergyConfirm" component={SurveyAllergyConfirmScreen} />
      <Stack.Screen name="SurveyVegetarian" component={SurveyVegetarianScreen} />
      <Stack.Screen name="SurveyVeganStrictness" component={SurveyVeganStrictnessScreen} />
      <Stack.Screen name="SurveyDietConfirm" component={SurveyDietConfirmScreen} />
      <Stack.Screen name="SurveyVegetarianIngredients" component={SurveyVegetarianIngredientsScreen} />
    </Stack.Navigator>
  );
}

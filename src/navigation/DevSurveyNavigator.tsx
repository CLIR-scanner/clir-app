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

// ─── DEV ONLY ───
export default function DevSurveyNavigator() {
  const surveyProgress = useSharedValue(0);
  return (
    <SurveyProgressContext.Provider value={surveyProgress}>
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDFFFD' } }} initialRouteName="SurveyLanding">
      <Stack.Screen name="SurveyLanding"             component={SurveyLandingScreen}             />
      <Stack.Group screenOptions={{ animation: 'none' }}>
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
// ─── DEV ONLY ───

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import SplashScreen from '../screens/auth/SplashScreen';
import AuthHomeScreen from '../screens/auth/AuthHomeScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import EmailCodeScreen from '../screens/auth/EmailCode';
import SurveyScreen from '../screens/auth/SurveyScreen';
import SurveyAllergyScreen from '../screens/auth/SurveyAllergyScreen';
import SurveyAllergyDocScreen from '../screens/auth/SurveyAllergyDocScreen';
import SurveyAllergyDocResultScreen from '../screens/auth/SurveyAllergyDocResultScreen';
import SurveyAllergyEditListScreen from '../screens/auth/SurveyAllergyEditListScreen';
import SurveyAllergySelectScreen from '../screens/auth/SurveyAllergySelectScreen';
import SurveyVegetarianScreen from '../screens/auth/SurveyVegetarianScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="AuthHome" component={AuthHomeScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EmailCode" component={EmailCodeScreen} />
      <Stack.Screen name="Survey" component={SurveyScreen} />
      <Stack.Screen name="SurveyAllergy" component={SurveyAllergyScreen} />
      <Stack.Screen name="SurveyAllergyDoc" component={SurveyAllergyDocScreen} />
      <Stack.Screen name="SurveyAllergyDocResult" component={SurveyAllergyDocResultScreen} />
      <Stack.Screen name="SurveyAllergyEditList" component={SurveyAllergyEditListScreen} />
      <Stack.Screen name="SurveyAllergySelect" component={SurveyAllergySelectScreen} />
      <Stack.Screen name="SurveyVegetarian" component={SurveyVegetarianScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

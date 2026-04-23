import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyProfileEditScreen from '../screens/profile/MyProfileEditScreen';
import PersonalScreen from '../screens/profile/PersonalScreen';
import PersonalNameScreen from '../screens/profile/PersonalNameScreen';
import PersonalEmailScreen from '../screens/profile/PersonalEmailScreen';
import PersonalPushScreen from '../screens/profile/PersonalPushScreen';
import PersonalMembershipScreen from '../screens/profile/PersonalMembershipScreen';
import PersonalizationScreen from '../screens/profile/PersonalizationScreen';
import PersonalizationAllergyScreen from '../screens/profile/PersonalizationAllergyScreen';
import PersonalizationSensitivityScreen from '../screens/profile/PersonalizationSensitivityScreen';
import PersonalizationRelatedScreen from '../screens/profile/PersonalizationRelatedScreen';
import PersonalizationHealthCheckScreen from '../screens/profile/PersonalizationHealthCheckScreen';
import PersonalizationBandAidScreen from '../screens/profile/PersonalizationBandAidScreen';
import MultiProfileScreen from '../screens/profile/MultiProfileScreen';
import MultiProfileAddScreen from '../screens/profile/MultiProfileAddScreen';
import MultiProfileListScreen from '../screens/profile/MultiProfileListScreen';
import MultiProfileDetailScreen from '../screens/profile/MultiProfileDetailScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SettingsHelpScreen from '../screens/profile/SettingsHelpScreen';
import SettingsPrivacyScreen from '../screens/profile/SettingsPrivacyScreen';
import SettingsConsultScreen from '../screens/profile/SettingsConsultScreen';
import SettingsReportScreen from '../screens/profile/SettingsReportScreen';
import SettingsDeleteScreen from '../screens/profile/SettingsDeleteScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="MyProfileEdit" component={MyProfileEditScreen} />
      <Stack.Screen name="Personal" component={PersonalScreen} />
      <Stack.Screen name="PersonalName" component={PersonalNameScreen} />
      <Stack.Screen name="PersonalEmail" component={PersonalEmailScreen} />
      <Stack.Screen name="PersonalPush" component={PersonalPushScreen} />
      <Stack.Screen name="PersonalMembership" component={PersonalMembershipScreen} />
      <Stack.Screen name="Personalization" component={PersonalizationScreen} />
      <Stack.Screen name="PersonalizationAllergy" component={PersonalizationAllergyScreen} />
      <Stack.Screen name="PersonalizationSensitivity" component={PersonalizationSensitivityScreen} />
      <Stack.Screen name="PersonalizationRelated" component={PersonalizationRelatedScreen} />
      <Stack.Screen name="PersonalizationHealthCheck" component={PersonalizationHealthCheckScreen} />
      <Stack.Screen name="PersonalizationBandAid" component={PersonalizationBandAidScreen} />
      <Stack.Screen name="MultiProfile" component={MultiProfileScreen} />
      <Stack.Screen name="MultiProfileAdd" component={MultiProfileAddScreen} />
      <Stack.Screen name="MultiProfileList" component={MultiProfileListScreen} />
      <Stack.Screen name="MultiProfileDetail" component={MultiProfileDetailScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SettingsHelp" component={SettingsHelpScreen} />
      <Stack.Screen name="SettingsPrivacy" component={SettingsPrivacyScreen} />
      <Stack.Screen name="SettingsConsult" component={SettingsConsultScreen} />
      <Stack.Screen name="SettingsReport" component={SettingsReportScreen} />
      <Stack.Screen name="SettingsDelete" component={SettingsDeleteScreen} />
    </Stack.Navigator>
  );
}

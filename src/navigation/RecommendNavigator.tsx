import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecommendStackParamList } from '../types';
import CommunityScreen from '../screens/recommend/CommunityScreen';
import WeekendPopularScreen from '../screens/recommend/WeekendPopularScreen';
import SimilarUsersFavoritesScreen from '../screens/recommend/SimilarUsersFavoritesScreen';

const Stack = createNativeStackNavigator<RecommendStackParamList>();

export default function RecommendNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Recommend" component={CommunityScreen} />
      <Stack.Screen name="WeekendPopular" component={WeekendPopularScreen} />
      <Stack.Screen name="SimilarUsersFavorites" component={SimilarUsersFavoritesScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecommendStackParamList } from '../types';
import CommunityScreen from '../screens/recommend/CommunityScreen';
import WeekendPopularScreen from '../screens/recommend/WeekendPopularScreen';
import SimilarUsersFavoritesScreen from '../screens/recommend/SimilarUsersFavoritesScreen';
import SearchProductDetailScreen from '../screens/search/SearchProductDetailScreen';
import QAScreen from '../screens/recommend/QAScreen';
import QADetailScreen from '../screens/recommend/QADetailScreen';
import MagazineScreen from '../screens/recommend/MagazineScreen';
import MagazineDetailScreen from '../screens/recommend/MagazineDetailScreen';

const Stack = createNativeStackNavigator<RecommendStackParamList>();
const RecommendProductDetailScreen = SearchProductDetailScreen as unknown as React.ComponentType<
  NativeStackScreenProps<RecommendStackParamList, 'RecommendProductDetail'>
>;

export default function RecommendNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Recommend" component={CommunityScreen} />
      <Stack.Screen name="WeekendPopular" component={WeekendPopularScreen} />
      <Stack.Screen name="SimilarUsersFavorites" component={SimilarUsersFavoritesScreen} />
      <Stack.Screen name="QAScreen" component={QAScreen} />
      <Stack.Screen name="QADetail" component={QADetailScreen} />
      <Stack.Screen name="MagazineScreen" component={MagazineScreen} />
      <Stack.Screen name="MagazineDetail" component={MagazineDetailScreen} />
      <Stack.Screen name="RecommendProductDetail" component={RecommendProductDetailScreen} />
    </Stack.Navigator>
  );
}

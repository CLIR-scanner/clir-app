import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import SearchScreen from '../screens/search/SearchScreen';
import SearchResultScreen from '../screens/search/SearchResultScreen';
import SearchProductDetailScreen from '../screens/search/SearchProductDetailScreen';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Search"       component={SearchScreen}       />
      <Stack.Screen name="SearchResult"        component={SearchResultScreen}        />
      <Stack.Screen name="SearchProductDetail" component={SearchProductDetailScreen} />
    </Stack.Navigator>
  );
}

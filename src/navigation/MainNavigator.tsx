import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import ScanNavigator from './ScanNavigator';
import SearchNavigator from './SearchNavigator';
import ListNavigator from './ListNavigator';
import RecommendNavigator from './RecommendNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="ScanTab" component={ScanNavigator} options={{ title: '스캔' }} />
      <Tab.Screen name="SearchTab" component={SearchNavigator} options={{ title: '검색' }} />
      <Tab.Screen name="ListTab" component={ListNavigator} options={{ title: '목록' }} />
      <Tab.Screen name="RecommendTab" component={RecommendNavigator} options={{ title: '추천' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: '프로필' }} />
    </Tab.Navigator>
  );
}

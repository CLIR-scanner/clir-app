import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { Strings } from '../constants/strings';
import ScanNavigator from './ScanNavigator';
import SearchNavigator from './SearchNavigator';
import ListNavigator from './ListNavigator';
import RecommendNavigator from './RecommendNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="ScanTab" component={ScanNavigator} options={{ title: Strings.tabScan }} />
      <Tab.Screen name="SearchTab" component={SearchNavigator} options={{ title: Strings.tabSearch }} />
      <Tab.Screen name="ListTab" component={ListNavigator} options={{ title: Strings.tabList }} />
      <Tab.Screen name="RecommendTab" component={RecommendNavigator} options={{ title: Strings.tabRecommend }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: Strings.tabProfile }} />
    </Tab.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListStackParamList } from '../types';
import ListScreen from '../screens/list/ListScreen';
import FavoritesScreen from '../screens/list/FavoritesScreen';
import FavoritesMemoScreen from '../screens/list/FavoritesMemoScreen';
import FavoritesScanLogScreen from '../screens/list/FavoritesScanLogScreen';
import FavoritesAllScreen from '../screens/list/FavoritesAllScreen';
import ShoppingScreen from '../screens/list/ShoppingScreen';
import ShoppingItemsScreen from '../screens/list/ShoppingItemsScreen';
import ShoppingPurchaseScreen from '../screens/list/ShoppingPurchaseScreen';
// ScanStack과 동일한 화면을 ListStack에도 등록 — back 시 List 탭으로 정상 복귀
import HistoryProductDetailScreen from '../screens/scan/HistoryProductDetailScreen';

const Stack = createNativeStackNavigator<ListStackParamList>();

export default function ListNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Favorites">
      <Stack.Screen name="List" component={ListScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="FavoritesMemo" component={FavoritesMemoScreen} />
      <Stack.Screen name="FavoritesScanLog" component={FavoritesScanLogScreen} />
      <Stack.Screen name="FavoritesAll" component={FavoritesAllScreen} />
      <Stack.Screen name="Shopping" component={ShoppingScreen} />
      <Stack.Screen name="ShoppingItems" component={ShoppingItemsScreen} />
      <Stack.Screen name="ShoppingPurchase" component={ShoppingPurchaseScreen} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Stack.Screen name="HistoryProductDetail" component={HistoryProductDetailScreen as React.ComponentType<any>} />
    </Stack.Navigator>
  );
}

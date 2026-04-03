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

const Stack = createNativeStackNavigator<ListStackParamList>();

export default function ListNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="List" component={ListScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="FavoritesMemo" component={FavoritesMemoScreen} />
      <Stack.Screen name="FavoritesScanLog" component={FavoritesScanLogScreen} />
      <Stack.Screen name="FavoritesAll" component={FavoritesAllScreen} />
      <Stack.Screen name="Shopping" component={ShoppingScreen} />
      <Stack.Screen name="ShoppingItems" component={ShoppingItemsScreen} />
      <Stack.Screen name="ShoppingPurchase" component={ShoppingPurchaseScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListStackParamList } from '../types';
import FavoritesMemoScreen from '../screens/list/FavoritesMemoScreen';
import FavoritesScanLogScreen from '../screens/list/FavoritesScanLogScreen';
import FavoritesAllScreen from '../screens/list/FavoritesAllScreen';
import ShoppingScreen from '../screens/list/ShoppingScreen';
import ShoppingItemsScreen from '../screens/list/ShoppingItemsScreen';
import ShoppingPurchaseScreen from '../screens/list/ShoppingPurchaseScreen';
// ScanStack과 동일한 화면을 ListStack에도 등록 — back 시 List 탭으로 정상 복귀
import HistoryProductDetailScreen from '../screens/scan/HistoryProductDetailScreen';

function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📋</Text>
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.subtitle}>This feature is currently under development.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

const Stack = createNativeStackNavigator<ListStackParamList>();

export default function ListNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Favorites">
      <Stack.Screen name="List" component={ComingSoonScreen} />
      <Stack.Screen name="Favorites" component={ComingSoonScreen} />
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

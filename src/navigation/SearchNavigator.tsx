import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from '../types';
import SearchResultScreen from '../screens/search/SearchResultScreen';
import SearchProductDetailScreen from '../screens/search/SearchProductDetailScreen';

function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔍</Text>
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
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Search"              component={ComingSoonScreen}          />
      <Stack.Screen name="SearchResult"        component={SearchResultScreen}        />
      <Stack.Screen name="SearchProductDetail" component={SearchProductDetailScreen} />
    </Stack.Navigator>
  );
}

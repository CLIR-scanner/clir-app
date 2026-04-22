import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RecommendStackParamList } from '../types';
import WeekendPopularScreen from '../screens/recommend/WeekendPopularScreen';
import SimilarUsersFavoritesScreen from '../screens/recommend/SimilarUsersFavoritesScreen';

function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌐</Text>
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

const Stack = createNativeStackNavigator<RecommendStackParamList>();

export default function RecommendNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Recommend"             component={ComingSoonScreen}           />
      <Stack.Screen name="WeekendPopular"         component={WeekendPopularScreen}       />
      <Stack.Screen name="SimilarUsersFavorites"  component={SimilarUsersFavoritesScreen} />
    </Stack.Navigator>
  );
}

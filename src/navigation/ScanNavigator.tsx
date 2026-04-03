import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ScanStackParamList} from '../types';
import ScanScreen from '../screens/scan/ScanScreen';
import ScanResultScreen from '../screens/scan/ScanResultScreen';
import ScanHistoryScreen from '../screens/scan/ScanHistoryScreen';

const Stack = createNativeStackNavigator<ScanStackParamList>();

export default function ScanNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} />
      <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} />
    </Stack.Navigator>
  );
}

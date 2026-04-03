import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useUserStore } from '../store/user.store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  const isInitialized = useUserStore(s => s.isInitialized);
  const currentUserId = useUserStore(s => s.currentUser.id);

  // 인증 상태 기반 조건부 렌더링:
  // isInitialized가 false → 초기화 중 (App.tsx의 ActivityIndicator가 처리)
  // isInitialized가 true + id 있음 → 로그인 상태 → MainNavigator
  // isInitialized가 true + id 없음(guest) → 미로그인 → AuthNavigator
  const isLoggedIn = isInitialized && currentUserId !== '';

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

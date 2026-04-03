import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useUserStore } from '../store/user.store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  // isInitialized는 App.tsx에서 이미 검사 — RootNavigator가 렌더될 때는 항상 true.
  // 따라서 여기서는 currentUser.id 만으로 로그인 여부를 판단한다.
  // 두 내비게이터 간 화면 이름이 겹치지 않으므로(AuthStackParamList vs MainTabParamList)
  // 단일 NavigationContainer 안에서의 조건부 스왑은 안전하다.
  const currentUserId = useUserStore(s => s.currentUser.id);
  const isLoggedIn = currentUserId !== '';

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

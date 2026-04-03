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
  //
  // [stale-nav 안전성] 로그인 완료 시 setUser()가 동기적으로 상태를 갱신하고
  // isLoggedIn이 true로 전환되면서 AuthNavigator가 unmount된다.
  // SplashScreen의 clearTimeout cleanup이 이 시점에 실행되어 1500ms 타이머를
  // 취소하므로 stale navigation.replace() 호출은 발생하지 않는다.
  const currentUserId = useUserStore(s => s.currentUser.id);
  const isLoggedIn = currentUserId !== '';

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

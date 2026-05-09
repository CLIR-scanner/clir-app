import 'react-native-gesture-handler';
import './src/i18n';           // i18n 초기화 (최상단 임포트)
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import i18n from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { useUserStore } from './src/store/user.store';
import { Colors } from './src/constants/colors';

// 크래시 / unhandled error 리포팅. DSN 미설정 시 SDK 가 no-op (안전).
// EAS Build 시 source map 자동 업로드 — eas-cli sentry hook 설정 필요 (F9 runbook 참조).
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // 베타 단계: __DEV__ 모드는 리포팅 비활성 — 개발 노이즈 차단
  enabled: !__DEV__,
});

function App() {
  const isInitialized = useUserStore(s => s.isInitialized);
  const initialize    = useUserStore(s => s.initialize);
  const language      = useUserStore(s => s.currentUser.language);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // store 언어가 바뀌면 i18n에 즉시 반영
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

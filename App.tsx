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
import ClirLogo from './src/components/common/ClirLogo';

// 크래시 / unhandled error 리포팅. DSN 미설정 시 SDK 가 no-op (안전).
// release / dist 는 native build 정보(CFBundleVersion / versionName) 에서 자동 감지 —
// EAS Build 의 @sentry/react-native/expo plugin 이 source map 업로드 시 동일 포맷으로 매칭.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // 베타 단계: __DEV__ 모드는 리포팅 비활성 — 개발 노이즈 차단
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',
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
      <View style={{ flex: 1, backgroundColor: '#F9FFF3', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 80 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ClirLogo width={140} height={83} />
        </View>
        <ActivityIndicator color="#1C3A19" />
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

import 'react-native-gesture-handler';
import './src/i18n';           // i18n 초기화 (최상단 임포트)
import React, { useEffect, useState } from 'react';
import { AppState, View, Text, TextInput } from 'react-native';

// fontFamily 미지정 Text / TextInput 의 기본 폰트를 Pretendard-Regular 로 설정
(Text as any).defaultProps = { ...(Text as any).defaultProps, style: { fontFamily: 'Pretendard-Regular' } };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, style: { fontFamily: 'Pretendard-Regular' } };
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import i18n from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { useUserStore } from './src/store/user.store';
import { useScanStore } from './src/store/scan.store';
import SplashOverlay from './src/components/common/SplashOverlay';

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

  // 스플래시 오버레이가 전 과정(인트로→hold→C 수축→스캔버튼 tuck→앱 노출)을
  // 끝낼 때까지 위에 떠 있는다. 로딩이 아무리 빨라도 모션이 잘리지 않는다.
  const [splashFinished, setSplashFinished] = useState(false);

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular':    require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Light':      require('./assets/fonts/Pretendard-Light.ttf'),
    'Pretendard-SemiBold':   require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold':       require('./assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold':  require('./assets/fonts/Pretendard-ExtraBold.ttf'),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  // store 언어가 바뀌면 i18n에 즉시 반영
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // App foreground 진입 시 scan history retry queue 비우기.
  // background 중 네트워크 회복 / 토큰 갱신 후 BE 누락분을 자동 동기화한다.
  // 초기 mount 시점에도 1회 실행 — 직전 세션에서 영구화된 retryQueue 처리.
  useEffect(() => {
    const process = () => {
      void useScanStore.getState().processRetryQueue();
    };
    process(); // 부팅 시 1회
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') process();
    });
    return () => sub.remove();
  }, []);

  const appReady = isInitialized && fontsLoaded;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#F9FFF3' }}>
          {/* 앱은 오버레이 아래에 미리 mount — 배경 페이드 시 즉시 드러난다 */}
          {appReady && <RootNavigator />}
          {/* 스플래시 전 과정 종료 전까지 최상단 유지 */}
          {!splashFinished && (
            <SplashOverlay ready={appReady} onFinished={() => setSplashFinished(true)} />
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(App);

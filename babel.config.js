module.exports = function (api) {
  // KEEP_CONSOLE_LOGS env 가 바뀌면 babel 캐시 무효화 — 빌드마다 다른 동작 보장.
  api.cache.using(() => process.env.KEEP_CONSOLE_LOGS ?? '');

  // 디버깅 빌드 한정으로 production 에서도 console.* 보존.
  // EAS env (또는 로컬) 에 KEEP_CONSOLE_LOGS=true 설정 시 활성.
  // 토큰 / OAuth 로그 누출 방지 위해 평소엔 반드시 미설정 — 디버깅 끝나면 즉시 unset.
  const keepConsoleLogs = process.env.KEEP_CONSOLE_LOGS === 'true';

  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    // production 빌드(EAS / expo export) 에서만 모든 console.* 호출 제거.
    // 운영 release 빌드의 로그 누출 방지 (F8 §1.2/1.3). dev 모드는 그대로 보존.
    env: {
      production: {
        plugins: keepConsoleLogs ? [] : ['transform-remove-console'],
      },
    },
  };
};

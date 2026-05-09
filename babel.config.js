module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
    // production 빌드(EAS / expo export) 에서만 모든 console.* 호출 제거.
    // 운영 release 빌드의 로그 누출 방지 (F8 §1.2/1.3). dev 모드는 그대로 보존.
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};

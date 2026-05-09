// Sentry source map 생성을 위해 Metro config 를 Sentry wrapper 로 감싼다.
// EAS Build 시 @sentry/react-native/expo plugin 이 이 config 의 출력 source map 을
// 자동으로 sentry.io 에 업로드 (SENTRY_AUTH_TOKEN env 필요).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);

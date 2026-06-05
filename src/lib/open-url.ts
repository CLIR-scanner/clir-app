import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

/**
 * 외부 URL 을 인앱 브라우저(SFSafariViewController / Chrome Custom Tab)로 연다.
 *
 * 왜 Linking.openURL 직접 호출이 아니라 이걸 쓰나:
 * - Linking.openURL 은 관리형/심사(App Review) 기기처럼 외부 브라우저가 제한된 환경에서
 *   'Unable to open URL' 로 reject 한다. 호출부가 `void Linking.openURL(...)` 로 무시하면
 *   unhandled promise rejection 이 되어 Sentry 에 error 로 잡힌다(출처 링크 클릭 시 발생).
 * - 인앱 브라우저는 그런 환경에서도 더 안정적으로 열리고, 사용자를 앱 밖으로 보내지 않는다.
 *
 * 모든 실패는 swallow — 외부 링크가 안 열려도 화면의 출처 '텍스트'는 그대로 남으므로
 * UX/컴플라이언스(1.4.1 출처 표기)에 영향이 없다.
 */
export async function openExternalUrl(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      /* 외부 브라우저 자체가 막힌 환경 — 무시 (출처 텍스트는 화면에 유지됨) */
    }
  }
}

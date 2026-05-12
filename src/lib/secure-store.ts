// OAuth refresh_token 등 보안성 있는 값을 OS keychain (iOS) / keystore (Android) 에 저장.
// Web 빌드는 expo-secure-store 가 동작 안 하므로 AsyncStorage 로 폴백 (브라우저 localStorage).
//
// 토큰 자체는 BE Authorization 헤더용 — 평문이 노출돼도 Supabase 측에서 invalidate 가능.
// 그래도 일반 AsyncStorage 보다는 native keychain 이 안전.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'clir.access_token';
const REFRESH_KEY = 'clir.refresh_token';

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export type StoredSession = {
  access: string;
  refresh: string;
};

/** OAuth 세션 토큰 저장소. 둘 다 있을 때만 valid session 으로 간주. */
export const sessionStore = {
  read: async (): Promise<StoredSession | null> => {
    try {
      const [access, refresh] = await Promise.all([
        getItem(ACCESS_KEY),
        getItem(REFRESH_KEY),
      ]);
      if (!access || !refresh) return null;
      return { access, refresh };
    } catch {
      return null;
    }
  },
  write: async (session: StoredSession): Promise<void> => {
    try {
      await Promise.all([
        setItem(ACCESS_KEY, session.access),
        setItem(REFRESH_KEY, session.refresh),
      ]);
    } catch {
      /* swallow — 다음 cold start 시 재로그인 fallback */
    }
  },
  clear: async (): Promise<void> => {
    try {
      await Promise.all([
        deleteItem(ACCESS_KEY),
        deleteItem(REFRESH_KEY),
      ]);
    } catch {
      /* swallow */
    }
  },
};

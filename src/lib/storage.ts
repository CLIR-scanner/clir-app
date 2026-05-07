// AsyncStorage 얇은 래퍼 — 영속화가 필요한 디바이스 단위 사용자 선호도용.
// 토큰처럼 보안이 중요한 값은 expo-secure-store 를 별도로 사용 (현재 토큰은 in-memory).

import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'clir.language';

export const languageStorage = {
  /** 저장된 언어 코드 반환. 미저장 시 null. */
  read: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch {
      return null;
    }
  },
  /** 언어 코드 저장. 실패는 silent — 호출자에 전파하지 않음. */
  write: async (code: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
    } catch {
      /* swallow — durability best-effort */
    }
  },
  /** 저장된 언어 제거 (테스트·계정 삭제 시 사용). */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LANGUAGE_KEY);
    } catch {
      /* swallow */
    }
  },
};

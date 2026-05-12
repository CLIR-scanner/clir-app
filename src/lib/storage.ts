// AsyncStorage 얇은 래퍼 — 영속화가 필요한 디바이스 단위 사용자 선호도용.
// 토큰처럼 보안이 중요한 값은 expo-secure-store 를 별도로 사용 (현재 토큰은 in-memory).

import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'clir.language';
const TERMS_KEY = 'clir.termsAcceptedVersion';

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

/** 약관 동의 — 디바이스 단위 1회성. 사용자 신원과 무관 (OAuth 전 게이트).
 *  저장된 TERMS_VERSION 이 현재 코드의 TERMS_VERSION 과 일치하면 약관 화면 skip.
 *  BE 측 audit trail (acceptTerms) 은 OAuth 직후 별도로 기록. */
export const termsStorage = {
  read: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TERMS_KEY);
    } catch {
      return null;
    }
  },
  write: async (version: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(TERMS_KEY, version);
    } catch {
      /* swallow — 실패 시 다음 cold start 에 약관 다시 노출 (수용 가능) */
    }
  },
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TERMS_KEY);
    } catch {
      /* swallow */
    }
  },
};

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
/** 스캔 가이드 노출 — "매 앱 실행마다 1회" (세션 단위, 모드별 분리).
 *  바코드/OCR 각각 그 세션의 첫 사용 시점에 한 번만 노출. 영속화 X —
 *  앱을 새로 켤 때마다(새 JS 컨텍스트) 다시 초기화되어 또 한 번 노출된다.
 *  (이전엔 AsyncStorage 영구 저장이라 기기 최초 1회 후 영영 안 떴음.)
 *  세션 내 재진입(탭 blur→focus)에는 markSeen 으로 재노출 방지.
 *  help 아이콘 수동 트리거는 플래그와 무관하게 항상 재노출. */
export type ScanGuideMode = 'barcode' | 'ocr';

// 모듈 스코프 = 앱 실행(번들 로드)마다 초기화. 영속 저장하지 않는다.
const scanGuideSeen = { barcode: false, ocr: false };

export const scanGuideStorage = {
  read: async (): Promise<{ barcode: boolean; ocr: boolean }> => {
    return { ...scanGuideSeen };
  },
  markSeen: async (mode: ScanGuideMode): Promise<void> => {
    scanGuideSeen[mode] = true;
  },
  clear: async (): Promise<void> => {
    scanGuideSeen.barcode = false;
    scanGuideSeen.ocr = false;
  },
};

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

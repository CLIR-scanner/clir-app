// AsyncStorage 얇은 래퍼 — 영속화가 필요한 디바이스 단위 사용자 선호도용.
// 토큰처럼 보안이 중요한 값은 expo-secure-store 를 별도로 사용 (현재 토큰은 in-memory).

import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'clir.language';
const TERMS_KEY = 'clir.termsAcceptedVersion';
const SCAN_GUIDE_BARCODE_KEY = 'clir.scanGuide.barcodeSeen';
const SCAN_GUIDE_OCR_KEY = 'clir.scanGuide.ocrSeen';

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
/** 스캔 가이드 노출 — 디바이스 단위 1회성, 모드별 분리.
 *  바코드/OCR 각각 처음 사용 시점에 한 번만 노출 후 영구 dismiss.
 *  사용자가 명시적으로 help 아이콘을 누르면 플래그와 무관하게 재노출 (storage 미수정). */
export type ScanGuideMode = 'barcode' | 'ocr';

export const scanGuideStorage = {
  read: async (): Promise<{ barcode: boolean; ocr: boolean }> => {
    try {
      const [barcode, ocr] = await Promise.all([
        AsyncStorage.getItem(SCAN_GUIDE_BARCODE_KEY),
        AsyncStorage.getItem(SCAN_GUIDE_OCR_KEY),
      ]);
      return { barcode: barcode === '1', ocr: ocr === '1' };
    } catch {
      return { barcode: false, ocr: false };
    }
  },
  markSeen: async (mode: ScanGuideMode): Promise<void> => {
    const key = mode === 'barcode' ? SCAN_GUIDE_BARCODE_KEY : SCAN_GUIDE_OCR_KEY;
    try {
      await AsyncStorage.setItem(key, '1');
    } catch {
      /* swallow — 실패 시 다음 launch 에 한 번 더 노출 (수용 가능) */
    }
  },
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([SCAN_GUIDE_BARCODE_KEY, SCAN_GUIDE_OCR_KEY]);
    } catch {
      /* swallow */
    }
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

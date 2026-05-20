export const DEFAULT_LANGUAGE = 'en';

// 변경 가능한 언어: 영어 / 한국어 / 스페인어 만 노출.
// (ja/zh/fr 리소스는 i18n 에 폴백용으로 남아있으나 선택 목록에서는 제외)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'ko', label: 'Korean',   native: '한국어' },
  { code: 'es', label: 'Spanish',  native: 'Español' },
] as const;

export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(language => language.code === code);
}

export function getCatalogLanguage(code: string): 'en' | 'ko' {
  return code === 'ko' ? 'ko' : 'en';
}

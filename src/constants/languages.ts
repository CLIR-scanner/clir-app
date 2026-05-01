export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'ko', label: 'Korean',   native: '한국어' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese',  native: '中文' },
  { code: 'es', label: 'Spanish',  native: 'Español' },
  { code: 'fr', label: 'French',   native: 'Français' },
] as const;

export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(language => language.code === code);
}

export function getCatalogLanguage(code: string): 'en' | 'ko' {
  return code === 'ko' ? 'ko' : 'en';
}

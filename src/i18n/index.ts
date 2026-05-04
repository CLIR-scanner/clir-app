import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import ko from './ko';
import ja from './ja';
import zh from './zh';
import es from './es';
import fr from './fr';
import { DEFAULT_LANGUAGE } from '../constants/languages';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
      zh: { translation: zh },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '@i18n/locales/en.json';
import fr from '@i18n/locales/fr.json';
import { getLocale, setLocale } from '@shared/utils/storage';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales();
  return locales[0]?.languageCode ?? 'fr';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

getLocale().then((savedLocale) => {
  if (savedLocale) {
    i18n.changeLanguage(savedLocale);
  }
});

i18n.on('languageChanged', (lng) => {
  setLocale(lng);
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonVI from './locales/vi/common.json';
import dashboardVI from './locales/vi/dashboard.json';
import adminVI from './locales/vi/admin.json';

import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import adminEN from './locales/en/admin.json';

const resources = {
  en: {
    translation: {
      ...commonEN,
      dashboard: dashboardEN,
      admin: adminEN
    }
  },
  vi: {
    translation: {
      ...commonVI,
      dashboard: dashboardVI,
      admin: adminVI
    }
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;

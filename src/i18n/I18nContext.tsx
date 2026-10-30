import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { TranslationKey } from '@/lib/translation-keys';
import { DEFAULT_LOCALE, getLocale, isRTL, type Locale } from '@/lib/locales';
import en from '@/i18n/locales/en';
import ar from '@/i18n/locales/ar';
import fr from '@/i18n/locales/fr';
import hi from '@/i18n/locales/hi';
import es from '@/i18n/locales/es';
import de from '@/i18n/locales/de';

const translations: Record<string, Record<TranslationKey, string>> = {
  en, ar, fr, hi, es, de,
};

export interface I18nContextValue {
  locale: string;
  dir: 'ltr' | 'rtl';
  setLocale: (code: string) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  /** Translate a TranslatedString object, falling back to English then the key. */
  ts: (value: Record<string, string> | undefined, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'lingua.locale';

function getInitialLocale(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && getLocale(stored)) return stored;
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = useCallback((code: string) => {
    if (!getLocale(code)) return;
    setLocaleState(code);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const table = translations[locale] ?? translations[DEFAULT_LOCALE];
      let value = table[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return value;
    },
    [locale],
  );

  /** Translate a content TranslatedString (from JSON) using the current locale. */
  const ts = useCallback(
    (value: Record<string, string> | undefined, fallback?: string) => {
      if (!value) return fallback ?? '';
      return value[locale] ?? value[DEFAULT_LOCALE] ?? value['en'] ?? fallback ?? Object.values(value)[0] ?? '';
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t, ts }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Locale };

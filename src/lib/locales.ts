/**
 * Supported learner interface languages.
 * English content is always English; these are for UI/translations.
 */
export interface Locale {
  code: string;
  name: string;        // Native name
  englishName: string; // English name
  dir: 'ltr' | 'rtl';
  flag: string;        // Emoji flag
}

export const LOCALES: Locale[] = [
  { code: 'en', name: 'English', englishName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', englishName: 'Arabic', dir: 'rtl', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', englishName: 'French', dir: 'ltr', flag: '🇫🇷' },
  { code: 'hi', name: 'हिन्दी', englishName: 'Hindi', dir: 'ltr', flag: '🇮🇳' },
  { code: 'es', name: 'Español', englishName: 'Spanish', dir: 'ltr', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', englishName: 'German', dir: 'ltr', flag: '🇩🇪' },
];

export const DEFAULT_LOCALE = 'en';

export function getLocale(code: string): Locale | undefined {
  return LOCALES.find((l) => l.code === code);
}

export function isRTL(code: string): boolean {
  return getLocale(code)?.dir === 'rtl';
}

export type { Locale as LocaleType };

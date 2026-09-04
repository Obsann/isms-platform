export { LangProvider, useLang, persistLang } from './LangProvider';
export type { TranslateFn } from './LangProvider';
export {
  LANG_STORAGE_KEY,
  LEGACY_LANG_STORAGE_KEY,
  LANGUAGES,
  isAppLang,
  type AppLang,
} from './dictionary';
export { default as GoogleTranslate } from './GoogleTranslate';

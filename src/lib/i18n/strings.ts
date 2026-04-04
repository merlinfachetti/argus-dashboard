// ─── Argus i18n — JSON-based locale loader ────────────────────────────────────
// Locales live in ./locales/{lang}.json as flat "dot.key": "value" maps.
// Add a new language by creating the JSON file — zero changes needed here.

import en from "./locales/en.json";
import pt from "./locales/pt.json";

export type Lang = "en" | "pt";

const dictionaries: Record<Lang, Record<string, string>> = { en, pt };

/**
 * Translate a dot-notation key for the given locale.
 * Falls back: requested lang → EN → raw key.
 */
export function t(key: string, lang: Lang): string {
  return dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
}

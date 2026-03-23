"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Lang, t as rawT } from "@/lib/i18n/strings";

const LANG_KEY = "argus-lang";
const DEFAULT_LANG: Lang = "en";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // Rehydrate from localStorage on client
  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "pt") {
      startTransition(() => setLangState(stored));
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_KEY, next);
  }, []);

  const translate = useCallback((key: string) => rawT(key, lang), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Convenience: hook that returns just the translate function
export function useT() {
  return useContext(I18nContext).t;
}

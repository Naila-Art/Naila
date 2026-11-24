"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANG_COOKIE, isStorefrontPath, langPath, localeHref, stripLang } from "./locale";
import type { Lang } from "./types";

interface SiteLangContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
}

const SiteLangContext = createContext<SiteLangContextValue>({
  lang: "en",
  setLang: () => {},
  toggleLang: () => {},
});

/** Remembers the choice and moves a storefront page to its URL in that language (/ar/... for Arabic). */
function persistLang(next: Lang) {
  try {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Ignore cookie errors
  }
  document.documentElement.lang = next;
  const { path } = stripLang(window.location.pathname);
  if (isStorefrontPath(path)) {
    // Same page, other language: swap the URL without a reload so in-progress work (the builder) is kept.
    window.history.replaceState(window.history.state, "", langPath(next, path) + window.location.search + window.location.hash);
  }
}

export function SiteLangProvider({
  initialLang = "en",
  children,
}: {
  initialLang?: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // The server picks the language from the URL (/ar/...), so the page always matches its address.
  useEffect(() => {
    setLangState(initialLang);
    document.documentElement.lang = initialLang;
  }, [initialLang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      persistLang(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return (
    <SiteLangContext.Provider value={value}>{children}</SiteLangContext.Provider>
  );
}

export function useSiteLang() {
  return useContext(SiteLangContext);
}

/** Localizes an internal storefront link for the current language: "/create" -> "/ar/create". */
export function useLocaleHref(): (href: string) => string {
  const { lang } = useSiteLang();
  return useCallback((href: string) => localeHref(lang, href), [lang]);
}

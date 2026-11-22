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

const STORAGE_KEY = "naila_lang";

function persistLang(next: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Ignore storage quota / private mode issues
  }
  try {
    document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // Ignore cookie errors
  }
  document.documentElement.lang = next;
}

export function SiteLangProvider({
  initialLang = "en",
  children,
}: {
  initialLang?: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Sync with localStorage if cookie wasn't set yet (first migration)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") {
        if (saved !== initialLang) {
          setLangState(saved);
        }
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = initialLang;
      }
    } catch {
      document.documentElement.lang = initialLang;
    }
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

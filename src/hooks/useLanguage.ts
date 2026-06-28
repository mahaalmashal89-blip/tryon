"use client";

import { useCallback, useEffect, useState } from "react";

export type Language = "en" | "ar";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("tryon_language") as Language | null;
      if (saved === "en" || saved === "ar") setLanguageState(saved);
    } catch {
      // localStorage not available (SSR guard)
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("tryon_language", lang);
    } catch {
      // ignore
    }
  }, []);

  return { language, setLanguage };
}

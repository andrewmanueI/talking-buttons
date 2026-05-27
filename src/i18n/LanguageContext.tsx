import { createContext, useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

const STORAGE_KEY = 'tb_lang';

interface LanguageCtx {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageCtx>({
  language: 'id',
  setLanguage: () => {},
  t: (key) => key,
});

function loadLanguage(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'id' || stored === 'en') return stored;
  } catch {}
  return 'id';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Lang>(loadLanguage);

  const setLanguage = useCallback((lang: Lang) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, []);

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => {
    let text = translations[language][key] as string;
    if (!text) return key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

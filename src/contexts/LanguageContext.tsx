import { createContext, useContext, useState, type ReactNode } from 'react';
import { translate } from '@/data/languages';

interface LangCtx {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string) => string;
}
const Ctx = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') === 'hi' ? 'hi' : 'en');
  const setLangPersist = (l: string) => {
    const supported = l === 'hi' ? 'hi' : 'en';
    setLang(supported);
    localStorage.setItem('lang', supported);
  };
  return (
    <Ctx.Provider value={{ lang, setLang: setLangPersist, t: (k) => translate(lang, k) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLanguage must be used within LanguageProvider');
  return c;
}

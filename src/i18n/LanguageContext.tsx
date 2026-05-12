import React, {createContext, ReactNode, useCallback, useContext, useMemo} from 'react';
import type {AppLanguageCode} from '@/types/account';
import {translateString} from './dictionary';

type LanguageContextValue = {
  language: AppLanguageCode;
  t: (value: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  t: value => value,
});

export function LanguageProvider({language, children}: {language: AppLanguageCode; children: ReactNode}) {
  const t = useCallback((text: string) => translateString(text, language), [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    t,
  }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useLanguage().t;
}

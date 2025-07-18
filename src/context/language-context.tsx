"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import fa from '@/locales/fa.json';
import en from '@/locales/en.json';

type Language = 'fa' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  toggleLanguage: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const translations = { fa, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('fa'); // Default to 'fa' to avoid issues on server
  
  useEffect(() => {
    // This effect runs only on the client
    const storedLang = localStorage.getItem('language') as Language | null;
    if (storedLang && ['fa', 'en'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);
  
  const toggleLanguage = () => {
    setLanguage(prevLang => {
      const newLang = prevLang === 'fa' ? 'en' : 'fa';
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', newLang);
      }
      return newLang;
    });
  };

  const t = (key: string, values?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key; // Return key if not found
      }
    }
    
    if (typeof result === 'string' && values) {
      return Object.entries(values).reduce((acc, [placeholder, value]) => {
        return acc.replace(`{${placeholder}}`, String(value));
      }, result);
    }

    return result || key;
  };
  
  const direction = language === 'fa' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

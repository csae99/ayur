'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import translations
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import zh from '@/messages/zh.json';

type Messages = typeof en;
type Locale = 'en' | 'hi' | 'es' | 'fr' | 'zh';

const validLocales: Locale[] = ['en', 'hi', 'es', 'fr', 'zh'];

interface TranslationContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const translations: Record<Locale, Messages> = { en, hi, es, fr, zh };

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        // Load saved preference
        const saved = localStorage.getItem('locale') as Locale;
        if (saved && validLocales.includes(saved)) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('locale', newLocale);
    };

    // Get nested translation by dot-notation key
    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <TranslationContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}

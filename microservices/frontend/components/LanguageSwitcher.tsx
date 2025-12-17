'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';

type Locale = 'en' | 'hi' | 'es' | 'fr' | 'zh';

const locales = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'hi' as const, name: 'हिंदी', flag: '🇮🇳' },
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
    { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
    { code: 'zh' as const, name: '中文', flag: '🇨🇳' }
];

export default function LanguageSwitcher() {
    const { locale, setLocale } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (localeCode: Locale) => {
        setLocale(localeCode);
        setIsOpen(false);
    };

    const currentLang = locales.find(l => l.code === locale) || locales[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
                aria-label="Select language"
            >
                <span className="text-lg">{currentLang.flag}</span>
                <span className="hidden sm:inline text-gray-700">{currentLang.name}</span>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
                        {locales.map((loc) => (
                            <button
                                key={loc.code}
                                onClick={() => handleChange(loc.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${locale === loc.code ? 'bg-green-50 text-green-700' : 'text-gray-700'
                                    }`}
                            >
                                <span className="text-lg">{loc.flag}</span>
                                <span className="font-medium">{loc.name}</span>
                                {locale === loc.code && (
                                    <svg className="w-4 h-4 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

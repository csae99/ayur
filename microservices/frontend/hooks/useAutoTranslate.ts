'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';

/**
 * Hook to auto-translate text using LibreTranslate API
 * Returns the translated text or original text while loading
 * 
 * @param text - The original text to translate (assumed to be in English)
 * @returns The translated text
 */
export function useAutoTranslate(text: string): string {
    const { locale } = useTranslation();
    const [translatedText, setTranslatedText] = useState(text);

    useEffect(() => {
        // If locale is English or text is empty, no translation needed
        if (locale === 'en' || !text || text.trim() === '') {
            setTranslatedText(text);
            return;
        }

        // Check cache first
        const cacheKey = `translate_${locale}_${text}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setTranslatedText(cached);
            return;
        }

        // Translate via API
        const translateText = async () => {
            try {
                const response = await fetch('/api/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        q: text,
                        source: 'en',
                        target: locale,
                        format: 'text'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const translated = data.translatedText || text;

                    // Cache the translation
                    try {
                        localStorage.setItem(cacheKey, translated);
                    } catch (e) {
                        // localStorage might be full, ignore
                    }

                    setTranslatedText(translated);
                }
            } catch (error) {
                console.error('Translation error:', error);
                // Keep original text on error
            }
        };

        translateText();
    }, [text, locale]);

    return translatedText;
}

/**
 * Hook to translate multiple texts at once
 * More efficient for batch translations
 */
export function useAutoTranslateMany(texts: string[]): string[] {
    const { locale } = useTranslation();
    const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);

    useEffect(() => {
        if (locale === 'en' || texts.length === 0) {
            setTranslatedTexts(texts);
            return;
        }

        const translateAll = async () => {
            const results = await Promise.all(
                texts.map(async (text) => {
                    if (!text || text.trim() === '') return text;

                    const cacheKey = `translate_${locale}_${text}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) return cached;

                    try {
                        const response = await fetch('/api/translate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                q: text,
                                source: 'en',
                                target: locale,
                                format: 'text'
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const translated = data.translatedText || text;
                            try {
                                localStorage.setItem(cacheKey, translated);
                            } catch (e) { }
                            return translated;
                        }
                    } catch (error) {
                        console.error('Translation error:', error);
                    }
                    return text;
                })
            );
            setTranslatedTexts(results);
        };

        translateAll();
    }, [texts.join('|'), locale]);

    return translatedTexts;
}

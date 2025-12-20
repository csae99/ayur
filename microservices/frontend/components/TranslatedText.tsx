'use client';

import { useAutoTranslate } from '@/hooks/useAutoTranslate';

interface TranslatedTextProps {
    text: string;
    className?: string;
    as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
}

/**
 * Component that automatically translates text based on current locale
 * Uses LibreTranslate API with localStorage caching
 */
export default function TranslatedText({
    text,
    className = '',
    as: Component = 'span'
}: TranslatedTextProps) {
    const translatedText = useAutoTranslate(text);

    return <Component className={className}>{translatedText}</Component>;
}

'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TranslationProvider } from '@/context/TranslationContext';

interface Props {
    children: ReactNode;
}

export default function ClientWrapper({ children }: Props) {
    return (
        <ErrorBoundary>
            <TranslationProvider>
                {children}
            </TranslationProvider>
        </ErrorBoundary>
    );
}


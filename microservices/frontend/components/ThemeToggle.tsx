'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
        >
            {isDark ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zm4.22 2.03a1 1 0 011.42 0l1.42 1.42a1 1 0 01-1.42 1.42L14.22 5.45a1 1 0 010-1.42zM18 9a1 1 0 110 2h-2a1 1 0 110-2h2zM14.22 14.55a1 1 0 010 1.42l-1.42 1.42a1 1 0 11-1.42-1.42l1.42-1.42a1 1 0 011.42 0zM10 16a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm-4.22-1.45a1 1 0 00-1.42 0L3.94 15.97a1 1 0 101.42 1.42l1.42-1.42a1 1 0 000-1.42zM4 9a1 1 0 100 2H2a1 1 0 100-2h2zM7.05 5.05a1 1 0 00-1.42 0L4.22 6.47a1 1 0 101.42 1.42L7.05 6.47a1 1 0 000-1.42z" />
                </svg>
            ) : (
                <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 14a6 6 0 110-12 6 6 0 010 12z" />
                </svg>
            )}
            <span className="text-sm font-medium">{isDark ? 'Dark' : 'Light'}</span>
        </button>
    );
};

export default ThemeToggle;

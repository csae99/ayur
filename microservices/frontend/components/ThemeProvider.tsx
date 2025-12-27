'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface ThemeContextProps {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [isDark, setIsDark] = useState<boolean>(false);

    // Initialize from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') {
            setIsDark(true);
        } else if (stored === 'light') {
            setIsDark(false);
        } else {
            // system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(prefersDark);
        }
    }, []);

    // Apply class to html element and persist
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;

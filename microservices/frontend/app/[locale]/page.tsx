'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function HomePage() {
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-green-700">
                        🌿 Ayurveda
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link
                            href="/login"
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            {t('common.login')}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
                    {t('common.welcome')} <span className="text-green-600">Ayurveda</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Discover authentic Ayurvedic medicines and connect with certified practitioners for holistic healing.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        href="/register"
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                    >
                        {t('auth.signUp')}
                    </Link>
                    <Link
                        href="/catalog"
                        className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold text-lg"
                    >
                        {t('navigation.browseMedicines')}
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-pills text-2xl text-green-600"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navigation.browseMedicines')}</h3>
                        <p className="text-gray-600">{t('dashboard.browseMedicinesDesc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-user-md text-2xl text-blue-600"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navigation.findPractitioner')}</h3>
                        <p className="text-gray-600">{t('dashboard.findPractitionerDesc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-robot text-2xl text-purple-600"></i>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('navigation.ayurbot')}</h3>
                        <p className="text-gray-600">{t('dashboard.ayurbotDesc')}</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8 mt-16">
                <div className="container mx-auto px-4 text-center">
                    <p>{t('footer.copyright')}</p>
                </div>
            </footer>
        </div>
    );
}

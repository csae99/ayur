'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authUtils } from '@/utils/auth';
import { useTranslation } from '@/context/TranslationContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('patient');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost/api/identity/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, type, rememberMe }),
            });

            const data = await res.json();

            if (res.ok) {
                // Use auth utility to store tokens
                authUtils.setTokens(data);
                router.push('/dashboard');
            } else {
                setError(data.error || t('auth.loginError'));
            }
        } catch (err) {
            console.error('Login error details:', err);
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                        </Link>
                        <LanguageSwitcher />
                    </div>

                    <h2 className="text-3xl font-bold mb-2">{t('dashboard.welcomeBack')}</h2>
                    <p className="text-secondary mb-8">{t('auth.signIn')}</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">{t('auth.accountType')}</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="input"
                            >
                                <option value="patient">{t('auth.patient')}</option>
                                <option value="practitioner">{t('auth.practitioner')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">{t('auth.username')}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder={t('auth.username')}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">{t('auth.password')}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder={t('auth.password')}
                                required
                            />
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-gray-600">
                                {t('auth.rememberMe')}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? t('common.loading') : t('auth.signIn')}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-secondary">
                        {t('auth.noAccount')}{' '}
                        <Link href="/register" className="text-green-700 font-medium hover:underline">
                            {t('auth.registerNow')}
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-700 via-green-800 to-green-900 items-center justify-center p-12">
                <div className="max-w-md text-white">
                    <h2 className="text-4xl font-bold mb-4">
                        Natural Healing, Modern Convenience
                    </h2>
                    <p className="text-green-100 text-lg">
                        Access authentic Ayurvedic medicines and connect with certified practitioners from the comfort of your home.
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authUtils } from '@/utils/auth';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${window.location.origin}/api/identity/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, type: 'admin', rememberMe: false }),
            });

            const data = await res.json();

            if (res.ok) {
                authUtils.setTokens(data);
                router.push('/dashboard/admin');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🛡️</span>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-gray-800">AyurCare</span>
                                <span className="block text-sm text-indigo-600 font-medium">Admin Portal</span>
                            </div>
                        </Link>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Administrator Access</h2>
                    <p className="text-gray-500 mb-8">Enter your credentials to access the admin dashboard</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="Enter admin username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-700 to-purple-800 text-white font-semibold rounded-lg hover:from-indigo-800 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : (
                                'Sign In to Admin'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            This is a restricted area. Unauthorized access is prohibited.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-800 via-purple-800 to-indigo-900 items-center justify-center p-12">
                <div className="max-w-md text-white text-center">
                    <div className="w-24 h-24 mx-auto mb-8 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                        Admin Control Center
                    </h2>
                    <p className="text-indigo-200 text-lg mb-6">
                        Manage practitioners, medicines, orders, and platform analytics from one central dashboard.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <span className="text-2xl">👥</span>
                            <p className="text-sm mt-2">User Management</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <span className="text-2xl">💊</span>
                            <p className="text-sm mt-2">Medicine Catalog</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <span className="text-2xl">📦</span>
                            <p className="text-sm mt-2">Order Management</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <span className="text-2xl">📊</span>
                            <p className="text-sm mt-2">Analytics</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

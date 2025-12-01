'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [type, setType] = useState('patient');
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
                body: JSON.stringify({ username, password, type }),
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error details:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                    </Link>

                    <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                    <p className="text-secondary mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Account Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="input"
                            >
                                <option value="patient">Patient</option>
                                <option value="practitioner">Practitioner</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-secondary">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-green-700 font-medium hover:underline">
                            Register here
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

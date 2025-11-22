'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check if user is logged in
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    if (!mounted) return null;

    return (
        <main className="min-h-screen">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                            🌿 AyurCare
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/catalog" className="text-green-700 hover:text-green-800 font-medium">
                                Catalog
                            </Link>
                            {isLoggedIn ? (
                                <>
                                    <Link href="/dashboard" className="text-green-700 hover:text-green-800 font-medium">
                                        My Orders
                                    </Link>
                                    <button onClick={handleLogout} className="text-green-700 hover:text-green-800 font-medium">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="text-green-700 hover:text-green-800 font-medium">
                                        Login
                                    </Link>
                                    <Link href="/register" className="btn btn-primary">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white py-32 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
                <div className="container relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                            🌿 Ancient Wisdom, Modern Wellness
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                            Your Journey to
                            <br />
                            <span className="gradient-text">Natural Healing</span>
                        </h1>
                        <p className="text-xl text-green-100 mb-8 leading-relaxed">
                            Discover authentic Ayurvedic medicines and connect with certified practitioners
                            for holistic healing and natural wellness solutions.
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link href="/catalog" className="btn btn-primary text-base px-8 py-3">
                                Browse Medicines
                            </Link>
                            <Link href="/register" className="btn btn-secondary text-base px-8 py-3">
                                Find Practitioners
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Why Choose <span className="gradient-text">Ayurveda</span>
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="card text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Authentic Products</h3>
                            <p className="text-secondary">
                                100% natural and certified Ayurvedic medicines sourced from trusted manufacturers
                            </p>
                        </div>

                        <div className="card text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Expert Practitioners</h3>
                            <p className="text-secondary">
                                Connect with verified Ayurvedic doctors and wellness experts
                            </p>
                        </div>

                        <div className="card text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                            <p className="text-secondary">
                                Quick and secure delivery of medicines right to your doorstep
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-green-700 to-green-900 text-white">
                <div className="container text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Start Your Wellness Journey Today
                    </h2>
                    <p className="text-xl mb-8 text-green-100">
                        Join thousands of people embracing natural healing
                    </p>
                    <Link href="/register" className="btn btn-secondary text-base px-8 py-3">
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold">
                                    A
                                </div>
                                <span className="text-xl font-bold text-white">AyurCare</span>
                            </div>
                            <p className="text-sm">
                                Your trusted platform for authentic Ayurvedic wellness solutions.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-3">Products</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/catalog" className="hover:text-white transition">Medicines</Link></li>
                                <li><Link href="/catalog" className="hover:text-white transition">Supplements</Link></li>
                                <li><Link href="/catalog" className="hover:text-white transition">Herbs</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-3">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-3">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition">Disclaimer</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        <p>&copy; 2025 AyurCare. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}

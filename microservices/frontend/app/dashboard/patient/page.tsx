'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import { useTranslation } from '@/context/TranslationContext';

export default function DashboardPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                if (parsed.role !== 'patient') {
                    router.replace('/dashboard');
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 to-teal-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-2">{t('dashboard.welcomeBack')}, {user?.fname || t('auth.patient')}!</h1>
                    <p className="text-green-100 text-lg">
                        {t('dashboard.manageHealth')}
                    </p>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Find Practitioner */}
                    <Link href="/dashboard/patient/practitioners" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-green-500">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                                <i className="fas fa-user-md text-3xl text-green-600 group-hover:text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.findPractitioner')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.findPractitionerDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* My Appointments */}
                    <Link href="/dashboard/patient/appointments" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-blue-500">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                                <i className="fas fa-calendar-check text-3xl text-blue-600 group-hover:text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.myAppointments')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.myAppointmentsDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* My Prescriptions */}
                    <Link href="/dashboard/patient/prescriptions" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-teal-500">
                            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors">
                                <i className="fas fa-file-prescription text-3xl text-teal-600 group-hover:text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.myPrescriptions')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.myPrescriptionsDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* Browse Medicines */}
                    <Link href="/dashboard/patient/medicines" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-purple-500">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                                <i className="fas fa-pills text-3xl text-purple-600 group-hover:text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.browseMedicines')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.browseMedicinesDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* My Orders */}
                    <Link href="/dashboard/patient/orders" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-orange-500">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors">
                                <i className="fas fa-shopping-bag text-3xl text-orange-600 group-hover:text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.myOrders')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.myOrdersDesc')}
                            </p>
                        </div>
                    </Link>

                    {/* AyurBot - AI Wellness Assistant */}
                    <Link href="/dashboard/patient/ayurbot" className="group">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-green-500">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <i className="fas fa-robot text-3xl text-white"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('navigation.ayurbot')}</h3>
                            <p className="text-gray-600">
                                {t('dashboard.ayurbotDesc')}
                            </p>
                            <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                ✨ {t('dashboard.aiPowered')}
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
}


'use client';

import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/context/TranslationContext';

interface PatientNavProps {
    username?: string;
    onLogout: () => void;
}

export default function PatientNav({ username, onLogout }: PatientNavProps) {
    const { t } = useTranslation();

    return (
        <nav className="bg-white shadow-sm">
            <div className="container py-4">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/patient" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                    </Link>

                    <div className="flex gap-3 items-center">
                        <span className="text-sm text-secondary">
                            {t('common.welcome')}, <span className="font-semibold text-primary">{username}</span>
                        </span>
                        <Link href="/dashboard/patient" className="btn btn-outline">
                            {t('navigation.dashboard')}
                        </Link>
                        <Link href="/dashboard/patient/practitioners" className="btn btn-outline">
                            {t('navigation.findPractitioner')}
                        </Link>
                        <Link href="/dashboard/patient/wishlist" className="btn btn-outline">
                            {t('navigation.myWishlist')}
                        </Link>
                        <Link href="/dashboard/patient/appointments" className="btn btn-outline">
                            {t('navigation.myAppointments')}
                        </Link>
                        <Link href="/dashboard/patient/medicines" className="btn btn-outline">
                            {t('navigation.browseMedicines')}
                        </Link>
                        <Link href="/dashboard/patient/cart" className="btn btn-outline">
                            <i className="fas fa-shopping-cart mr-2"></i> {t('navigation.cart')}
                        </Link>
                        <LanguageSwitcher />
                        <button onClick={onLogout} className="btn btn-secondary">
                            {t('common.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}



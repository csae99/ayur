'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/context/TranslationContext';

export default function PatientSidebar({ isOpen }: { isOpen: boolean }) {
    const pathname = usePathname();
    const { t } = useTranslation();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: '/dashboard/patient', label: t('navigation.dashboard'), icon: 'fas fa-home' },
        { href: '/dashboard/patient/practitioners', label: t('navigation.findPractitioner'), icon: 'fas fa-user-md' },
        { href: '/dashboard/patient/appointments', label: t('navigation.myAppointments'), icon: 'fas fa-calendar-check' },
        { href: '/dashboard/patient/prescriptions', label: t('navigation.myPrescriptions'), icon: 'fas fa-file-prescription' },
        { href: '/dashboard/patient/medicines', label: t('navigation.browseMedicines'), icon: 'fas fa-pills' },
        { href: '/dashboard/patient/wishlist', label: t('navigation.myWishlist'), icon: 'fas fa-heart' },
        { href: '/dashboard/patient/orders', label: t('navigation.myOrders'), icon: 'fas fa-shopping-bag' },
        { href: '/dashboard/patient/cart', label: t('navigation.cart'), icon: 'fas fa-shopping-cart' },
        { href: '/dashboard/patient/ayurbot', label: t('navigation.ayurbot'), icon: 'fas fa-robot' },
    ];

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'} bg-white shadow-md min-h-screen flex flex-col font-sans transition-all duration-300 ease-in-out`}>
            {isOpen && (
                <>
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            A
                        </div>
                        <span className="text-xl font-bold text-gray-800">Ayurveda</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                    ? 'bg-green-50 text-green-700 font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <i className={`${item.icon} w-6 text-center`}></i>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Link
                            href="/dashboard/patient/profile"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard/patient/profile')
                                ? 'bg-green-50 text-green-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <i className="fas fa-user-circle w-6 text-center"></i>
                            <span>Profile</span>
                        </Link>
                    </div>
                </>
            )}
        </aside>
    );
}

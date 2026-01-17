import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/context/TranslationContext';

export default function PatientNav({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    const router = useRouter();
    const { t } = useTranslation();
    const [username, setUsername] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUsername(parsed.username || parsed.fname || 'Patient');
            } catch (e) {
                console.error('Error parsing user data', e);
            }
        }
    }, []);

    const onLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="container-fluid px-6 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={onToggleSidebar}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            aria-label="Toggle Sidebar"
                        >
                            <i className="fas fa-bars text-xl"></i>
                        </button>
                    </div>

                    <div className="flex gap-4 items-center">
                        <span className="text-sm text-secondary hidden md:block">
                            {t('common.welcome')}, <span className="font-semibold text-primary">{username}</span>
                        </span>

                        <LanguageSwitcher />
                        <button onClick={onLogout} className="btn btn-sm btn-secondary bg-gray-100 hover:bg-gray-200 text-gray-700 border-none">
                            <i className="fas fa-sign-out-alt mr-2"></i>
                            {t('common.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}



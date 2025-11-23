'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.replace('/login');
            return;
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);

                // Redirect based on role
                if (parsed.role === 'admin') {
                    router.replace('/dashboard/admin');
                } else if (parsed.role === 'practitioner') {
                    router.replace('/dashboard/practitioner');
                } else if (parsed.role === 'patient') {
                    router.replace('/dashboard/patient');
                } else {
                    // Unknown role, redirect to login
                    router.replace('/login');
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );
}

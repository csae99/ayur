'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    username: string;
    email: string;
    verified: boolean;
    office_name: string;
    professionality: string;
}

interface Medicine {
    id: number;
    item_title: string;
    status: string;
}

export default function PractitionerDashboard() {
    const router = useRouter();
    const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'practitioner') {
            router.push('/dashboard');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch practitioner details
                const practRes = await fetch(`http://localhost/api/identity/auth/practitioner/${user.username}`);
                if (practRes.ok) {
                    const practData = await practRes.json();
                    setPractitioner(practData);
                }

                // Fetch medicines
                const medRes = await fetch(`http://localhost/api/catalog/items/practitioner/${user.username}`);
                if (medRes.ok) {
                    const medData = await medRes.json();
                    setMedicines(medData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Practitioner</span></span>
                        </Link>

                        <div className="flex gap-3 items-center">
                            <span className="text-sm text-secondary">
                                Dr. <span className="font-semibold text-primary">{practitioner?.fname} {practitioner?.lname}</span>
                            </span>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-12">
                <div className="container">
                    <h1 className="text-4xl font-bold mb-2">Practitioner Dashboard</h1>
                    <p className="text-green-100 text-lg">
                        Manage your medicines and view your status
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Verification Status</h2>
                            {practitioner?.verified ? (
                                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified
                                </span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Pending Verification
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 mb-6">
                            {practitioner?.verified
                                ? "You are a verified practitioner. You can add and manage medicines in the catalog."
                                : "Your account is currently pending verification. You cannot add medicines until you are verified."}
                        </p>
                        {!practitioner?.verified && (
                            <button className="btn btn-primary w-full" onClick={() => alert('Verification request sent!')}>
                                Request Verification
                            </button>
                        )}
                    </div>

                    {/* Medicines Card */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Your Medicines</h2>
                            <span className="text-3xl font-bold text-green-700">{medicines.length}</span>
                        </div>
                        <p className="text-gray-600 mb-8">
                            Manage the medicines you have added to the catalog.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="/dashboard/practitioner/add-medicine"
                                className={`btn btn-primary flex-1 text-center ${!practitioner?.verified ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            >
                                Add Medicine
                            </Link>
                            <Link href="/dashboard/practitioner/medicines" className="btn btn-outline flex-1 text-center">
                                View All
                            </Link>
                        </div>
                    </div>

                    {/* Appointments Card */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
                            <Link href="/dashboard/practitioner/appointments" className="text-green-600 hover:text-green-700 font-medium">
                                View All &rarr;
                            </Link>
                        </div>
                        <p className="text-gray-600 mb-6">
                            View and manage your appointment requests from patients.
                        </p>
                        <Link href="/dashboard/practitioner/appointments" className="btn btn-primary w-full text-center">
                            Manage Appointments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

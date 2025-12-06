'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    username: string;
    email: string;
    phone: string;
    professionality: string;
    office_name: string;
    verified: boolean;
    joined_on: string;
}

export default function PractitionersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const statusFilter = searchParams.get('status') || 'all';

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            router.push('/login');
            return;
        }

        const parsed = JSON.parse(userData);
        if (parsed.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        // Fetch practitioners
        const url = `http://localhost/api/identity/admin/practitioners?status=${statusFilter}&search=${searchQuery}`;
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setPractitioners(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching practitioners:', err);
                setLoading(false);
            });
    }, [router, statusFilter, searchQuery]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard/admin" className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    A
                                </div>
                                <span className="text-2xl font-bold text-white">Ayurveda Admin</span>
                            </Link>
                            <div className="hidden md:flex gap-6">
                                <Link href="/dashboard/admin" className="text-white hover:text-indigo-200 transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/admin/practitioners" className="text-white font-semibold border-b-2 border-white">
                                    Practitioners
                                </Link>
                                <Link href="/dashboard/admin/medicines" className="text-white hover:text-indigo-200 transition-colors">
                                    Medicines
                                </Link>
                                <Link href="/dashboard/admin/patients" className="text-white hover:text-indigo-200 transition-colors">
                                    Patients
                                </Link>
                                <Link href="/dashboard/admin/coupons" className="text-white hover:text-indigo-200 transition-colors">
                                    Coupons
                                </Link>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">
                    <i className="fas fa-user-tie"></i> Practitioners Management
                </h1>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Filter Tabs */}
                        <div className="flex gap-2">
                            <Link
                                href="/dashboard/admin/practitioners?status=all"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </Link>
                            <Link
                                href="/dashboard/admin/practitioners?status=pending"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pending
                            </Link>
                            <Link
                                href="/dashboard/admin/practitioners?status=verified"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'verified'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Verified
                            </Link>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <input
                                type="search"
                                placeholder="Search by name, username, profession..."
                                className="input w-full pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                    </div>
                </div>

                {/* Practitioners Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : practitioners.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <i className="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
                        <p className="text-xl text-gray-500">No practitioners found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {practitioners.map(practitioner => (
                            <div key={practitioner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {practitioner.fname} {practitioner.lname}
                                            </h3>
                                            <p className="text-sm text-gray-500">@{practitioner.username}</p>
                                        </div>
                                        {practitioner.verified ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <i className="fas fa-check-circle"></i> Verified
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                <i className="fas fa-clock"></i> Pending
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fas fa-briefcase-medical text-indigo-600"></i>
                                            {practitioner.professionality}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fas fa-envelope text-indigo-600"></i>
                                            {practitioner.email}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fas fa-building text-indigo-600"></i>
                                            {practitioner.office_name}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/dashboard/admin/practitioners/${practitioner.id}`}
                                        className="btn btn-primary w-full text-center"
                                    >
                                        View Details & Verify
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Medicine {
    id: number;
    item_title: string;
    item_brand: string;
    item_cat: string;
    item_price: number;
    item_quantity: number;
    item_image: string;
    status: string;
    added_by: string;
}

export default function MedicinesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
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

        // Fetch medicines
        const url = `http://localhost/api/catalog/admin/items?status=${statusFilter}&search=${searchQuery}`;
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to fetch');
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setMedicines(data);
                } else {
                    console.error('Received invalid data format:', data);
                    setMedicines([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching medicines:', err);
                if (err.message === 'Unauthorized') {
                    // Optional: redirect to login or show specific error
                }
                setMedicines([]);
                setLoading(false);
            });
    }, [router, statusFilter, searchQuery]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Approved</span>;
            case 'Rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Rejected</span>;
            default:
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>;
        }
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
                                <Link href="/dashboard/admin/practitioners" className="text-white hover:text-indigo-200 transition-colors">
                                    Practitioners
                                </Link>
                                <Link href="/dashboard/admin/medicines" className="text-white font-semibold border-b-2 border-white">
                                    Medicines
                                </Link>
                                <Link href="/dashboard/admin/patients" className="text-white hover:text-indigo-200 transition-colors">
                                    Patients
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
                    <i className="fa fa-pills"></i> Medicines Management
                </h1>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            <Link
                                href="/dashboard/admin/medicines?status=all"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All
                            </Link>
                            <Link
                                href="/dashboard/admin/medicines?status=Pending"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Pending
                            </Link>
                            <Link
                                href="/dashboard/admin/medicines?status=Approved"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Approved'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Approved
                            </Link>
                            <Link
                                href="/dashboard/admin/medicines?status=Rejected"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === 'Rejected'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Rejected
                            </Link>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <input
                                type="search"
                                placeholder="Search by name, brand, category..."
                                className="input w-full pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        </div>
                    </div>
                </div>

                {/* Medicines Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <i className="fa fa-capsules text-6xl text-gray-300 mb-4"></i>
                        <p className="text-xl text-gray-500">No medicines found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicines.map(medicine => (
                            <div key={medicine.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="h-48 bg-gray-100 relative">
                                    <img
                                        src={`/Medicine.png`}
                                        alt={medicine.item_title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2">
                                        {getStatusBadge(medicine.status)}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{medicine.item_title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{medicine.item_brand}</p>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fa fa-tag text-purple-600"></i>
                                            {medicine.item_cat}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fa fa-rupee-sign text-purple-600"></i>
                                            ₹{medicine.item_price}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fa fa-boxes text-purple-600"></i>
                                            Stock: {medicine.item_quantity}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <i className="fa fa-user text-purple-600"></i>
                                            Added by: {medicine.added_by || 'Unknown'}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/dashboard/admin/medicines/${medicine.id}`}
                                        className="btn btn-primary w-full text-center"
                                    >
                                        View Details & Review
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

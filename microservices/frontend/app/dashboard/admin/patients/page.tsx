'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
    id: number;
    fname: string;
    lname: string;
    username: string;
    email: string;
    phone: string;
    address: string;
    joined_on: string;
}

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

        // Fetch patients
        const url = `http://localhost/api/identity/admin/patients?search=${searchQuery}`;
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setPatients(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching patients:', err);
                setLoading(false);
            });
    }, [router, searchQuery]);

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
                                <Link href="/dashboard/admin/practitioners" className="text-white hover:text-indigo-200 transition-colors">
                                    Practitioners
                                </Link>
                                <Link href="/dashboard/admin/medicines" className="text-white hover:text-indigo-200 transition-colors">
                                    Medicines
                                </Link>
                                <Link href="/dashboard/admin/patients" className="text-white font-semibold border-b-2 border-white">
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
                    <i className="fas fa-users"></i> Patients
                </h1>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="relative w-full md:w-96">
                        <input
                            type="search"
                            placeholder="Search by name, username, email..."
                            className="input w-full pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                {/* Patients Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <i className="fas fa-users-slash text-6xl text-gray-300 mb-4"></i>
                        <p className="text-xl text-gray-500">No patients found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Address</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {patients.map(patient => (
                                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {patient.fname.charAt(0)}{patient.lname.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{patient.fname} {patient.lname}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">@{patient.username}</td>
                                            <td className="px-6 py-4 text-gray-600">{patient.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{patient.phone}</td>
                                            <td className="px-6 py-4 text-gray-600">{patient.address || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(patient.joined_on).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

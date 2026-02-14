'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    identity: {
        totalPractitioners: number;
        verifiedPractitioners: number;
        pendingPractitioners: number;
        totalPatients: number;
        totalAdmins: number;
    };
    catalog: {
        totalMedicines: number;
        pendingMedicines: number;
        approvedMedicines: number;
        rejectedMedicines: number;
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

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

        setUser(parsed);

        // Fetch statistics from both services
        Promise.all([
            fetch(`${window.location.origin}/api/identity/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()),
            fetch(`${window.location.origin}/api/catalog/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json())
        ])
            .then(([identityStats, catalogStats]) => {
                setStats({
                    identity: identityStats,
                    catalog: catalogStats
                });
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching stats:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    A
                                </div>
                                <span className="text-2xl font-bold text-white">Ayurveda Admin</span>
                            </div>
                            <div className="hidden md:flex gap-6">
                                <Link href="/dashboard/admin" className="text-white hover:text-indigo-200 transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/admin/orders" className="text-white hover:text-indigo-200 transition-colors">
                                    Orders
                                </Link>
                                <Link href="/dashboard/admin/inventory" className="text-white hover:text-indigo-200 transition-colors">
                                    Inventory
                                </Link>
                                <Link href="/dashboard/admin/reports" className="text-white hover:text-indigo-200 transition-colors">
                                    Reports
                                </Link>
                                <Link href="/dashboard/admin/practitioners" className="text-white hover:text-indigo-200 transition-colors">
                                    Practitioners
                                </Link>
                                <Link href="/dashboard/admin/medicines" className="text-white hover:text-indigo-200 transition-colors">
                                    Medicines
                                </Link>
                                <Link href="/dashboard/admin/admins" className="text-white hover:text-indigo-200 transition-colors">
                                    Admins
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/admin/profile" className="text-white hover:text-indigo-200">
                                <i className="fas fa-user-circle mr-1"></i> {user?.username}
                            </Link>
                            <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-gray-800 mb-8">
                    <i className="bi bi-speedometer2"></i> Admin Dashboard
                </h1>

                {/* Statistics Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Total Practitioners */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Practitioners</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.identity.totalPractitioners || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-user-tie text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/practitioners" className="text-sm text-blue-100 hover:text-white flex items-center gap-2">
                            View All <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Verified Practitioners */}
                    <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Verified Practitioners</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.identity.verifiedPractitioners || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-check-circle text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/practitioners?status=verified" className="text-sm text-green-100 hover:text-white flex items-center gap-2">
                            View Details <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Pending Verification */}
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-yellow-100 text-sm font-medium">Pending Verification</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.identity.pendingPractitioners || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-clock text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/practitioners?status=pending" className="text-sm text-yellow-100 hover:text-white flex items-center gap-2">
                            Verify Now <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Total Medicines */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Total Medicines</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.catalog.totalMedicines || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fa fa-pills text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/medicines" className="text-sm text-purple-100 hover:text-white flex items-center gap-2">
                            View All <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Pending Medicines */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Pending Medicines</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.catalog.pendingMedicines || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fa fa-hourglass-half text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/medicines?status=Pending" className="text-sm text-orange-100 hover:text-white flex items-center gap-2">
                            Review Now <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Approved Medicines */}
                    <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-teal-100 text-sm font-medium">Approved Medicines</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.catalog.approvedMedicines || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fa fa-check-double text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/medicines?status=Approved" className="text-sm text-teal-100 hover:text-white flex items-center gap-2">
                            View All <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Total Patients */}
                    <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-300 text-sm font-medium">Total Patients</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.identity.totalPatients || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-users text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/patients" className="text-sm text-gray-300 hover:text-white flex items-center gap-2">
                            View All <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>

                    {/* Rejected Medicines */}
                    <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Rejected Medicines</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.catalog.rejectedMedicines || 0}</h3>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fa fa-times-circle text-2xl"></i>
                            </div>
                        </div>
                        <Link href="/dashboard/admin/medicines?status=Rejected" className="text-sm text-red-100 hover:text-white flex items-center gap-2">
                            View Details <i className="fa fa-arrow-circle-right"></i>
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Link href="/dashboard/admin/practitioners?status=pending" className="btn btn-primary text-center">
                            <i className="fas fa-user-check mr-2"></i> Verify Practitioners
                        </Link>
                        <Link href="/dashboard/admin/medicines?status=Pending" className="btn btn-primary text-center">
                            <i className="fa fa-clipboard-check mr-2"></i> Review Medicines
                        </Link>
                        <Link href="/dashboard/admin/admins" className="btn btn-primary text-center">
                            <i className="fas fa-user-shield mr-2"></i> Manage Admins
                        </Link>
                        <Link href="/dashboard/admin/analytics" className="btn btn-outline text-center border-indigo-600 text-indigo-700 hover:bg-indigo-50">
                            <i className="fas fa-chart-line mr-2"></i> View Analytics
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

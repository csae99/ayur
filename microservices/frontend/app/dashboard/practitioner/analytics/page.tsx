'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PractitionerStats {
    totalAppointments: number;
    pendingAppointments: number;
    totalPrescriptions: number;
    totalPatients: number;
    appointmentsLast7Days: { appointment_date: string; count: string }[];
}

interface SalesStats {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: string;
    ordersByStatus: { order_status: number; count: number }[];
    revenueLast7Days: { date: string; revenue: number }[];
}

export default function PractitionerAnalyticsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<PractitionerStats | null>(null);
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        Promise.allSettled([
            fetch(`${window.location.origin}/api/identity/practitioners/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : null),
            fetch(`${window.location.origin}/api/orders/analytics/practitioner/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : null)
        ]).then(([identityResult, orderResult]) => {
            if (identityResult.status === 'fulfilled') {
                setStats(identityResult.value);
            }
            if (orderResult.status === 'fulfilled') {
                setSalesStats(orderResult.value);
            }
            setLoading(false);
        });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
            </div>
        );
    }

    // Chart scaling
    const maxAppointments = stats?.appointmentsLast7Days?.reduce((acc, curr) => Math.max(acc, parseInt(curr.count)), 0) || 1;
    const maxRevenue = salesStats?.revenueLast7Days?.reduce((acc, curr) => Math.max(acc, curr.revenue), 0) || 1;

    // Helper for Order Status
    const getStatusName = (status: number) => {
        const statuses = ['PendingPayment', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
        return statuses[status] || 'Unknown';
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                            <span className="text-xl font-bold text-gray-800">My Practice Analytics</span>
                        </div>
                        <Link href="/dashboard/practitioner" className="text-gray-600 hover:text-teal-600 font-medium">
                            <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">Practice Overview</h2>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-teal-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Total Patients</h3>
                            <i className="fas fa-users text-teal-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-teal-900">{stats?.totalPatients || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Appointments</h3>
                            <i className="fas fa-calendar-check text-blue-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{stats?.totalAppointments || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Pending Requests</h3>
                            <i className="fas fa-clock text-orange-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-orange-600">{stats?.pendingAppointments || 0}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Prescriptions</h3>
                            <i className="fas fa-file-prescription text-purple-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{stats?.totalPrescriptions || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Weekly Chart */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Appointments (Last 7 Days)</h3>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {stats?.appointmentsLast7Days?.map((stat, idx) => {
                                const count = parseInt(stat.count);
                                const heightPercent = (count / maxAppointments) * 100;
                                return (
                                    <div key={idx} className="flex flex-col items-center w-full group relative">
                                        <div
                                            className="w-full bg-teal-500 rounded-t-md transition-all hover:bg-teal-600 relative"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count} appts
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left translate-y-2">
                                            {new Date(stat.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!stats?.appointmentsLast7Days || stats.appointmentsLast7Days.length === 0) && (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No appointments in last 7 days
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Insight */}
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-8 rounded-xl shadow-md flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-4">Grow Your Practice</h3>
                        <p className="mb-6 text-teal-50 opacity-90">
                            Track your patient engagement and optimize your schedule.
                            Use the Prescriptions tab to manage patient medications efficiently.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/dashboard/practitioner/availability" className="bg-white text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50 transition-colors">
                                Update Availability
                            </Link>
                            <Link href="/dashboard/practitioner/appointments" className="bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-800 transition-colors">
                                View Calendar
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sales & Orders Section */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-indigo-500 pl-4">Sales & Order Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Total Revenue</h3>
                            <i className="fas fa-dollar-sign text-indigo-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-indigo-900">${salesStats?.totalRevenue || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Orders Fulfilled</h3>
                            <i className="fas fa-box text-indigo-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-indigo-900">{salesStats?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 font-medium">Avg Order Value</h3>
                            <i className="fas fa-percent text-indigo-200 text-xl"></i>
                        </div>
                        <p className="text-3xl font-bold text-indigo-900">${salesStats?.avgOrderValue || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Trend Chart */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Revenue Trend (Last 7 Days)</h3>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {salesStats?.revenueLast7Days?.map((stat, idx) => {
                                const heightPercent = (stat.revenue / maxRevenue) * 100;
                                return (
                                    <div key={idx} className="flex flex-col items-center w-full group relative">
                                        <div
                                            className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600 relative"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                ${stat.revenue}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left translate-y-2">
                                            {new Date(stat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!salesStats?.revenueLast7Days || salesStats.revenueLast7Days.length === 0) && (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No sales activity in last 7 days
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Status Distribution */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Order Status Breakdown</h3>
                        <div className="space-y-4">
                            {salesStats?.ordersByStatus?.map((stat) => (
                                <div key={stat.order_status} className="flex items-center justify-between">
                                    <span className="font-medium text-gray-600 w-32">{getStatusName(stat.order_status)}</span>
                                    <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-indigo-500 h-3 rounded-full"
                                            style={{ width: `${(stat.count / (salesStats?.totalOrders || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-bold text-gray-800">{stat.count}</span>
                                </div>
                            ))}
                            {(!salesStats?.ordersByStatus || salesStats.ordersByStatus.length === 0) && (
                                <div className="text-center text-gray-500 py-8">No orders yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

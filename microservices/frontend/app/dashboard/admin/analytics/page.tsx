'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderStats {
    totalOrders: number;
    ordersByStatus: { order_status: number; count: number }[];
    recentOrders: any[];
    ordersLast7Days: { date: string; count: number }[];
}

interface UserStats {
    totalPractitioners: number;
    verifiedPractitioners: number;
    pendingPractitioners: number;
    totalPatients: number;
    totalAdmins: number;
}

export default function AdminAnalyticsPage() {
    const router = useRouter();
    const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
        }

        Promise.allSettled([
            fetch(`${window.location.origin}/api/orders/analytics/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : null),
            fetch(`${window.location.origin}/api/identity/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : null)
        ])
            .then(([orderResult, userResult]) => {
                if (orderResult.status === 'fulfilled') {
                    setOrderStats(orderResult.value);
                }
                if (userResult.status === 'fulfilled') {
                    setUserStats(userResult.value);
                }
                setLoading(false);
            });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            </div>
        );
    }

    // Helper for Status Names
    const getStatusName = (status: number) => {
        const statuses = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
        return statuses[status] || 'Unknown';
    };

    // Calculate max value for chart scaling
    const maxOrders = orderStats?.ordersLast7Days?.reduce((acc, curr) => Math.max(acc, parseInt(curr.count as any)), 0) || 1;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">A</div>
                            <span className="text-2xl font-bold text-white">Ayurveda Admin</span>
                        </div>
                        <Link href="/dashboard/admin" className="text-white hover:text-indigo-200">
                            <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Platform Analytics</h1>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
                        <h3 className="text-gray-500 font-medium mb-2">Total Orders</h3>
                        <p className="text-3xl font-bold text-indigo-900">{orderStats?.totalOrders}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                        <h3 className="text-gray-500 font-medium mb-2">Total Patients</h3>
                        <p className="text-3xl font-bold text-green-900">{userStats?.totalPatients}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                        <h3 className="text-gray-500 font-medium mb-2">Practitioners</h3>
                        <p className="text-3xl font-bold text-blue-900">{userStats?.totalPractitioners}</p>
                        <span className="text-xs text-green-600 font-semibold">{userStats?.verifiedPractitioners} verified</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                        <h3 className="text-gray-500 font-medium mb-2">Pending Verifications</h3>
                        <p className="text-3xl font-bold text-orange-600">{userStats?.pendingPractitioners}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Orders Last 7 Days Chart */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Orders (Last 7 Days)</h3>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {orderStats?.ordersLast7Days?.map((stat, idx) => {
                                const heightPercent = (stat.count / maxOrders) * 100;
                                return (
                                    <div key={idx} className="flex flex-col items-center w-full group relative">
                                        <div
                                            className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600 relative"
                                            style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {stat.count} orders
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left translate-y-2">
                                            {new Date(stat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                            {orderStats?.ordersLast7Days?.length === 0 && (
                                <p className="text-gray-500 text-center w-full">No data available</p>
                            )}
                        </div>
                    </div>

                    {/* Order Status Distribution */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Order Status Distribution</h3>
                        <div className="space-y-4">
                            {orderStats?.ordersByStatus?.map((stat) => (
                                <div key={stat.order_status} className="flex items-center justify-between">
                                    <span className="font-medium text-gray-600 w-32">{getStatusName(stat.order_status)}</span>
                                    <div className="flex-1 mx-4 bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-indigo-500 h-3 rounded-full"
                                            style={{ width: `${(stat.count / (orderStats?.totalOrders || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="font-bold text-gray-800">{stat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-8 py-4 font-semibold">ID</th>
                                    <th className="px-8 py-4 font-semibold">Date</th>
                                    <th className="px-8 py-4 font-semibold">Status</th>
                                    <th className="px-8 py-4 font-semibold">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orderStats?.recentOrders?.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-8 py-4 font-medium text-indigo-600">#{order.id}</td>
                                        <td className="px-8 py-4 text-gray-600">
                                            {new Date(order.order_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                ${order.order_status === 5 ? 'bg-green-100 text-green-700' :
                                                    order.order_status === 6 ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'}`}>
                                                {getStatusName(order.order_status)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-gray-800">{order.order_quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

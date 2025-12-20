'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderStats {
    today: { orders: number; revenue: number };
    thisMonth: { orders: number; revenue: number };
    total: { orders: number; revenue: number };
    pendingShipments: number;
    byStatus: Array<{ status: number; status_name: string; count: number; revenue: number }>;
}

interface DailyData {
    date: string;
    orders: number;
    revenue: number;
}

interface TopItem {
    item_id: number;
    item_title: string;
    item_image?: string;
    order_count: number;
    total_quantity: number;
    total_revenue: number;
}

export default function AdminReportsPage() {
    const router = useRouter();
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [dailyData, setDailyData] = useState<DailyData[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

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

        fetchData(token);
    }, [router, days]);

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            // Fetch stats
            const statsRes = await fetch('/api/orders/admin/orders/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch reports
            const reportsRes = await fetch(`/api/orders/admin/orders/reports?days=${days}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (reportsRes.ok) {
                const reportsData = await reportsRes.json();
                setDailyData(reportsData.dailyBreakdown || []);
                setTopItems(reportsData.topSellingItems || []);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    // Calculate max revenue for bar chart scaling
    const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/admin" className="text-2xl font-bold text-white">
                            🌿 AyurCare Admin
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard/admin" className="text-white hover:text-indigo-200">Dashboard</Link>
                            <Link href="/dashboard/admin/orders" className="text-white hover:text-indigo-200">Orders</Link>
                            <Link href="/dashboard/admin/inventory" className="text-white hover:text-indigo-200">Inventory</Link>
                            <Link href="/dashboard/admin/reports" className="text-white font-semibold">Reports</Link>
                            <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Sales Reports</h1>
                    <select
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : (
                    <>
                        {/* Revenue Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                    <p className="text-blue-100 text-sm mb-1">Today&apos;s Revenue</p>
                                    <p className="text-3xl font-bold">₹{stats.today.revenue.toLocaleString()}</p>
                                    <p className="text-blue-200 text-sm mt-2">{stats.today.orders} orders</p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                                    <p className="text-green-100 text-sm mb-1">This Month</p>
                                    <p className="text-3xl font-bold">₹{stats.thisMonth.revenue.toLocaleString()}</p>
                                    <p className="text-green-200 text-sm mt-2">{stats.thisMonth.orders} orders</p>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                                    <p className="text-purple-100 text-sm mb-1">Total Revenue</p>
                                    <p className="text-3xl font-bold">₹{stats.total.revenue.toLocaleString()}</p>
                                    <p className="text-purple-200 text-sm mt-2">{stats.total.orders} total orders</p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                                    <p className="text-orange-100 text-sm mb-1">Pending Shipments</p>
                                    <p className="text-3xl font-bold">{stats.pendingShipments}</p>
                                    <p className="text-orange-200 text-sm mt-2">awaiting shipping</p>
                                </div>
                            </div>
                        )}

                        {/* Order Status Breakdown */}
                        {stats && (
                            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Status</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {stats.byStatus.map((item) => (
                                        <div key={item.status} className="bg-gray-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                                            <p className="text-sm text-gray-500">{item.status_name}</p>
                                            <p className="text-xs text-green-600 mt-1">₹{item.revenue.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Daily Revenue Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Revenue (Last {days} Days)</h2>
                            {dailyData.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No data available</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="flex items-end gap-1 h-64 min-w-[600px]">
                                        {dailyData.map((day, index) => (
                                            <div key={index} className="flex-1 flex flex-col items-center group">
                                                <div className="relative w-full">
                                                    <div
                                                        className="bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t mx-1 transition-all hover:from-indigo-600 hover:to-indigo-500"
                                                        style={{
                                                            height: `${Math.max((day.revenue / maxRevenue) * 200, 4)}px`
                                                        }}
                                                    ></div>
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                                        ₹{day.revenue.toLocaleString()} ({day.orders} orders)
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 rotate-45 origin-left">
                                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Top Selling Products */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h2>
                            {topItems.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No data available</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Product</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Orders</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Units Sold</th>
                                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {topItems.map((item, index) => (
                                                <tr key={item.item_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-gray-50 text-gray-500'
                                                            }`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {item.item_image && (
                                                                <img
                                                                    src={`/medicines/${item.item_image}`}
                                                                    alt=""
                                                                    className="w-10 h-10 rounded object-cover"
                                                                />
                                                            )}
                                                            <span className="font-medium text-gray-800">{item.item_title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{item.order_count}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{item.total_quantity}</td>
                                                    <td className="px-6 py-4 font-bold text-green-600">₹{item.total_revenue.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

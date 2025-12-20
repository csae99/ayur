'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
    id: number;
    item_id: number;
    user_id: number;
    order_quantity: number;
    order_date: string;
    order_status: number;
    status_name: string;
    tracking_number?: string;
    final_amount: number;
    payment_method?: string;
    item?: {
        item_title: string;
        item_image: string;
        item_price: number;
    };
}

const STATUS_OPTIONS = [
    { value: 0, label: 'Pending Payment', color: 'bg-gray-100 text-gray-700' },
    { value: 1, label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
    { value: 2, label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
    { value: 3, label: 'Packed', color: 'bg-purple-100 text-purple-700' },
    { value: 4, label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
    { value: 5, label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
    { value: 6, label: 'Delivered', color: 'bg-green-100 text-green-700' },
    { value: 7, label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [updating, setUpdating] = useState(false);

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

        fetchOrders(token, filter);
    }, [router, filter]);

    const fetchOrders = async (token: string, status: string) => {
        setLoading(true);
        try {
            const url = status === 'all'
                ? '/api/orders/admin/orders'
                : `/api/orders/admin/orders?status=${status}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: number, newStatus: number) => {
        const token = localStorage.getItem('token');
        setUpdating(true);

        // If shipping, require tracking number
        if (newStatus === 4 && !trackingNumber) {
            setMessage({ type: 'error', text: 'Tracking number is required for shipping' });
            setUpdating(false);
            return;
        }

        try {
            const res = await fetch(`/api/orders/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    tracking_number: newStatus === 4 ? trackingNumber : undefined
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Order status updated!' });
                setSelectedOrder(null);
                setTrackingNumber('');
                fetchOrders(token!, filter);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const getStatusBadge = (status: number) => {
        const opt = STATUS_OPTIONS.find(s => s.value === status);
        return opt ? (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${opt.color}`}>
                {opt.label}
            </span>
        ) : null;
    };

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
                            <Link href="/dashboard/admin/orders" className="text-white font-semibold">Orders</Link>
                            <Link href="/dashboard/admin/inventory" className="text-white hover:text-indigo-200">Inventory</Link>
                            <Link href="/dashboard/admin/reports" className="text-white hover:text-indigo-200">Reports</Link>
                            <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
                    <Link href="/dashboard/admin/reports" className="btn btn-primary">
                        <i className="fas fa-chart-bar mr-2"></i> View Reports
                    </Link>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        All Orders
                    </button>
                    {STATUS_OPTIONS.slice(0, 7).map(s => (
                        <button
                            key={s.value}
                            onClick={() => setFilter(s.value.toString())}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === s.value.toString() ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <p className="text-gray-500">No orders found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Qty</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-800">#{order.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {order.item?.item_image && (
                                                    <img
                                                        src={`/medicines/${order.item.item_image}`}
                                                        alt=""
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                )}
                                                <span className="text-gray-700">{order.item?.item_title || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{order.order_quantity}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">₹{order.final_amount?.toFixed(2) || 'N/A'}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{order.order_date}</td>
                                        <td className="px-6 py-4">{getStatusBadge(order.order_status)}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                            >
                                                Update Status
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Update Status Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Update Order #{selectedOrder.id}
                            </h3>
                            <p className="text-gray-600 mb-6">{selectedOrder.item?.item_title}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                                    {getStatusBadge(selectedOrder.order_status)}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATUS_OPTIONS.filter(s => s.value > selectedOrder.order_status && s.value !== 7).map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => {
                                                    if (s.value === 4 && !trackingNumber) {
                                                        // Show tracking input
                                                    } else {
                                                        handleStatusUpdate(selectedOrder.id, s.value);
                                                    }
                                                }}
                                                disabled={updating}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border ${s.color} hover:opacity-80`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tracking Number Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tracking Number (for Shipped)
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Enter tracking number"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <button
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 4)}
                                        disabled={!trackingNumber || updating}
                                        className="mt-2 w-full btn btn-primary disabled:opacity-50"
                                    >
                                        {updating ? 'Updating...' : 'Mark as Shipped'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedOrder(null);
                                    setTrackingNumber('');
                                }}
                                className="mt-6 w-full btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import OrderCard, { OrderItem } from '@/components/dashboard/patient/OrderCard';

export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [displayCount, setDisplayCount] = useState(5);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        let parsed = null;
        if (userData) {
            try {
                parsed = JSON.parse(userData);
                setUser(parsed);
                if (parsed.role !== 'patient') {
                    router.replace('/dashboard');
                    return;
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }

        const userId = parsed?.id || 1; // Fallback to 1 if no ID found

        fetch(`/api/orders/orders/user/${userId}/detailed`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                    return Promise.reject('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch orders:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/orders/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                // Update local state to show cancelled status instead of removing
                setOrders(orders.map(order =>
                    order.id === orderId ? { ...order, order_status: 7 } : order
                ));
            } else {
                alert('Failed to cancel order');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Error cancelling order');
        }
    };

    const handleCompletePayment = async (orderId: number) => {
        const token = localStorage.getItem('token');
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        try {
            // Get Razorpay config
            const configRes = await fetch('/api/orders/payments/config');
            const config = await configRes.json();

            // Calculate amount (item price * quantity)
            const amount = order.item ? order.item.item_price * order.order_quantity : 0;

            // Create Razorpay order
            const rzpOrderRes = await fetch('/api/orders/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'INR',
                    receipt: `retry_order_${orderId}`
                })
            });

            const rzpOrder = await rzpOrderRes.json();

            const options = {
                key: config.key_id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: 'AyurCare',
                description: `Payment for Order #${orderId}`,
                image: '/images/Medicine.png',
                order_id: rzpOrder.id,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/orders/payments/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                order_ids: [orderId]
                            })
                        });

                        if (verifyRes.ok) {
                            alert('Payment successful!');
                            // Update local state to confirmed
                            setOrders(orders.map(o =>
                                o.id === orderId ? { ...o, order_status: 1 } : o
                            ));
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (e) {
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: user?.full_name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                theme: {
                    color: '#15803d'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(response.error.description);
            });
            rzp.open();
        } catch (error) {
            console.error('Error initiating payment:', error);
            alert('Failed to initiate payment');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-xl text-gray-500 mb-4">You haven't placed any orders yet.</p>
                        <Link href="/dashboard/patient/medicines" className="btn btn-primary">Browse Medicines</Link>
                    </div>
                ) : (
                    <>
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button
                                onClick={() => { setStatusFilter('all'); setDisplayCount(5); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                All Orders ({orders.length})
                            </button>
                            <button
                                onClick={() => { setStatusFilter('pending'); setDisplayCount(5); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Pending Payment ({orders.filter(o => o.order_status === 0).length})
                            </button>
                            <button
                                onClick={() => { setStatusFilter('confirmed'); setDisplayCount(5); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'confirmed'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Confirmed ({orders.filter(o => o.order_status >= 1 && o.order_status <= 6).length})
                            </button>
                            <button
                                onClick={() => { setStatusFilter('cancelled'); setDisplayCount(5); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'cancelled'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Cancelled ({orders.filter(o => o.order_status === 7).length})
                            </button>
                        </div>

                        {/* Filtered Orders */}
                        <div className="space-y-4">
                            {orders
                                .filter(order => {
                                    if (statusFilter === 'pending') return order.order_status === 0;
                                    if (statusFilter === 'confirmed') return order.order_status >= 1 && order.order_status <= 6;
                                    if (statusFilter === 'cancelled') return order.order_status === 7;
                                    return true; // 'all'
                                })
                                .slice(0, displayCount)
                                .map((order) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onCancel={handleCancelOrder}
                                        onCompletePayment={handleCompletePayment}
                                    />
                                ))
                            }
                            {(() => {
                                const filteredOrders = orders.filter(order => {
                                    if (statusFilter === 'pending') return order.order_status === 0;
                                    if (statusFilter === 'confirmed') return order.order_status >= 1 && order.order_status <= 6;
                                    if (statusFilter === 'cancelled') return order.order_status === 7;
                                    return true;
                                });
                                if (filteredOrders.length === 0) {
                                    return (
                                        <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                                            <p className="text-gray-500">No orders found in this category.</p>
                                        </div>
                                    );
                                }
                                if (displayCount < filteredOrders.length) {
                                    return (
                                        <div className="flex justify-center mt-4">
                                            <button
                                                onClick={() => setDisplayCount(prev => prev + 5)}
                                                className="btn btn-primary"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

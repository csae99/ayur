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

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

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
                    <div className="space-y-4">
                        {orders.slice(0, displayCount).map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onCancel={handleCancelOrder}
                            />
                        ))}
                        {displayCount < orders.length && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => setDisplayCount(prev => prev + 5)}
                                    className="btn btn-primary"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OrderItem {
    id: number;
    item_id: number;
    user_id: number;
    order_quantity: number;
    order_date: string;
    order_status: number;
    item?: {
        id: number;
        item_title: string;
        item_brand: string;
        item_price: number;
        item_image: string;
        item_details: string;
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [displayCount, setDisplayCount] = useState(5); // Show 5 orders initially

    useEffect(() => {
        // Retrieve token and user data from localStorage
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUser(parsed);

                // If not patient, redirect to appropriate dashboard
                if (parsed.role !== 'patient') {
                    router.replace('/dashboard');
                    return;
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }

        // Fetch orders for the logged‑in patient
        fetch('http://localhost/api/orders/orders/user/1/detailed', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(res => {
                if (res.status === 401) {
                    // Token invalid – clear and redirect
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

    const getStatusBadge = (status: number) => {
        if (status === 0) {
            return <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>;
        }
        return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Completed</span>;
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost/api/orders/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setOrders(orders.filter(order => order.id !== orderId));
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
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                        </Link>

                        <div className="flex gap-3 items-center">
                            <span className="text-sm text-secondary">
                                Welcome, <span className="font-semibold text-primary">{user?.username}</span>
                            </span>
                            <Link href="/dashboard/patient/practitioners" className="btn btn-outline">
                                Find Practitioners
                            </Link>
                            <Link href="/dashboard/patient/appointments" className="btn btn-outline">
                                My Appointments
                            </Link>
                            <Link href="/catalog" className="btn btn-outline">
                                Browse Medicines
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-12">
                <div className="container">
                    <h1 className="text-4xl font-bold mb-2">My Orders</h1>
                    <p className="text-green-100 text-lg">
                        View and track your Ayurvedic medicine orders
                    </p>
                </div>
            </div>

            {/* Orders */}
            <div className="container py-12">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : orders.length === 0 ? (
                    'use client';

                import {useState, useEffect} from 'react';
                import Link from 'next/link';
                import {useRouter} from 'next/navigation';

                interface OrderItem {
                    id: number;
                item_id: number;
                user_id: number;
                order_quantity: number;
                order_date: string;
                order_status: number;
                item?: {
                    id: number;
                item_title: string;
                item_brand: string;
                item_price: number;
                item_image: string;
                item_details: string;
    };
}

                export default function DashboardPage() {
    const router = useRouter();
                const [orders, setOrders] = useState<OrderItem[]>([]);
                const [loading, setLoading] = useState(true);
                const [user, setUser] = useState<any>(null);
                    const [displayCount, setDisplayCount] = useState(5); // Show 5 orders initially

    useEffect(() => {
        // Retrieve token and user data from localStorage
        const token = localStorage.getItem('token');
                    const userData = localStorage.getItem('user');

                    if (!token) {
                        router.push('/login');
                    return;
        }

                    if (userData) {
            try {
                const parsed = JSON.parse(userData);
                    setUser(parsed);

                    // If not patient, redirect to appropriate dashboard
                    if (parsed.role !== 'patient') {
                        router.replace('/dashboard');
                    return;
                }
            } catch (e) {
                        console.error('Failed to parse user data:', e);
            }
        }

                    // Fetch orders for the logged‑in patient
                    fetch('http://localhost/api/orders/orders/user/1/detailed', {
                        headers: {
                        'Authorization': `Bearer ${token}`,
            },
        })
            .then(res => {
                if (res.status === 401) {
                        // Token invalid – clear and redirect
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

    const getStatusBadge = (status: number) => {
        if (status === 0) {
            return <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>;
        }
                    return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Completed</span>;
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

                    const token = localStorage.getItem('token');
                    try {
            const response = await fetch(`http://localhost/api/orders/orders/${orderId}`, {
                        method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                },
            });

                    if (response.ok) {
                        setOrders(orders.filter(order => order.id !== orderId));
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
                        {/* Navigation */}
                        <nav className="bg-white shadow-sm">
                            <div className="container py-4">
                                <div className="flex items-center justify-between">
                                    <Link href="/" className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                            A
                                        </div>
                                        <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                                    </Link>

                                    <div className="flex gap-3 items-center">
                                        <span className="text-sm text-secondary">
                                            Welcome, <span className="font-semibold text-primary">{user?.username}</span>
                                        </span>
                                        <Link href="/dashboard/patient/practitioners" className="btn btn-outline">
                                            Find Practitioners
                                        </Link>
                                        <Link href="/dashboard/patient/appointments" className="btn btn-outline">
                                            My Appointments
                                        </Link>
                                        <Link href="/catalog" className="btn btn-outline">
                                            Browse Medicines
                                        </Link>
                                        <button onClick={handleLogout} className="btn btn-secondary">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </nav>

                        {/* Header */}
                        <div className="bg-gradient-to-br from-green-700 to-green-900 text-white py-12">
                            <div className="container">
                                <h1 className="text-4xl font-bold mb-2">My Orders</h1>
                                <p className="text-green-100 text-lg">
                                    View and track your Ayurvedic medicine orders
                                </p>
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="container py-12">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-20">
                                    <p className="text-xl text-secondary mb-4">You haven't placed any orders yet.</p>
                                    <Link href="/catalog" className="btn btn-primary">Browse Medicines</Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.slice(0, displayCount).map((order) => (
                                        <div key={order.id} className="card">
                                            <div className="flex gap-6">
                                                {/* Item Image */}
                                                <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-amber-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {order.item ? (
                                                        <img
                                                            src={`/images/${order.item.item_image}`}
                                                            alt={order.item.item_title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/Medicine.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="text-3xl">🌿</div>
                                                    )}
                                                </div>

                                                {/* Order Details */}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-primary">
                                                                {order.item?.item_title || `Item #${order.item_id}`}
                                                            </h3>
                                                            <p className="text-sm text-secondary">
                                                                Order #{order.id} • {new Date(order.order_date).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(order.order_status)}
                                                    </div>

                                                    {order.item && (
                                                        <p className="text-sm text-secondary mb-3 line-clamp-2">
                                                            {order.item.item_details}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm text-tertiary">
                                                                Quantity: <span className="font-semibold text-primary">{order.order_quantity}</span>
                                                            </span>
                                                            {order.item && (
                                                                <span className="text-lg font-bold text-green-700">
                                                                    ₹{order.item.item_price * order.order_quantity}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            {order.order_status === 0 && (
                                                                <button
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                    className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-100 text-sm"
                                                                >
                                                                    Cancel Order
                                                                </button>
                                                            )}
                                                            <Link href={`/dashboard/orders/${order.id}`} className="btn btn-outline text-sm">
                                                                View Details
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Load More button */}
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

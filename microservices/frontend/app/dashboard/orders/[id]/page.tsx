'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderDetail {
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
        item_cat: string;
    };
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch order details
        fetch(`${window.location.origin}/api/orders/orders/${params.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(async (res) => {
                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.removeItem('token');
                        router.push('/login');
                        throw new Error('Unauthorized');
                    }
                    throw new Error('Failed to fetch order');
                }
                return res.json();
            })
            .then(async (orderData) => {
                // Fetch item details for this order
                try {
                    const itemRes = await fetch(`${window.location.origin}/api/catalog/items/${orderData.item_id}`);
                    if (itemRes.ok) {
                        const itemData = await itemRes.json();
                        setOrder({ ...orderData, item: itemData });
                    } else {
                        setOrder(orderData);
                    }
                } catch (err) {
                    console.error('Error fetching item details:', err);
                    setOrder(orderData);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [params.id, router]);

    const getStatusBadge = (status: number) => {
        if (status === 0) {
            return <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">Pending</span>;
        }
        return <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">Completed</span>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
                    <p className="text-gray-600 mb-4">{error || "The requested order could not be found."}</p>
                    <Link href="/dashboard" className="btn btn-primary">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container max-w-3xl mx-auto px-4">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-green-700 hover:text-green-800 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Orders
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-700 to-green-600 px-8 py-6 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
                            <p className="text-green-100 opacity-90">
                                Placed on {new Date(order.order_date).toLocaleDateString()}
                            </p>
                        </div>
                        {getStatusBadge(order.order_status)}
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Item Image */}
                            <div className="w-full md:w-1/3">
                                <div className="aspect-square bg-gradient-to-br from-green-50 to-amber-50 rounded-lg flex items-center justify-center overflow-hidden">
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
                                        <div className="text-4xl">🌿</div>
                                    )}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        {order.item?.item_title || `Item #${order.item_id}`}
                                    </h2>
                                    {order.item && (
                                        <div className="flex gap-2 mb-4">
                                            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                {order.item.item_cat}
                                            </span>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                                {order.item.item_brand}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-gray-600 leading-relaxed">
                                        {order.item?.item_details || 'No details available.'}
                                    </p>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Quantity</p>
                                            <p className="text-lg font-semibold text-gray-800">{order.order_quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Total Price</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                ₹{(order.item?.item_price || 0) * order.order_quantity}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

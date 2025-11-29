'use client';

import { useEffect, useState } from 'react';
import OrderManagementCard, { OrderItem } from '@/components/dashboard/practitioner/OrderManagementCard';

export default function PractitionerOrdersPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState<number | 'all'>('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (filterStatus === 'all') {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.order_status === filterStatus));
        }
    }, [filterStatus, orders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Fetch all orders (practitioners see all orders in simplified model)
            const response = await fetch('http://localhost/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();

            // Fetch item details for each order
            const ordersWithDetails = await Promise.all(
                data.map(async (order: OrderItem) => {
                    try {
                        const itemResponse = await fetch(`http://localhost/api/catalog/items/${order.item_id}`);
                        if (itemResponse.ok) {
                            const item = await itemResponse.json();
                            return { ...order, item };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch item ${order.item_id}:`, error);
                    }
                    return order;
                })
            );

            setOrders(ordersWithDetails);
            setFilteredOrders(ordersWithDetails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: number, newStatus: number, trackingNumber?: string) => {
        try {
            const token = localStorage.getItem('token');

            const body: { order_status: number; tracking_number?: string } = {
                order_status: newStatus
            };

            if (trackingNumber) {
                body.tracking_number = trackingNumber;
            }

            const response = await fetch(`http://localhost/api/orders/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update status');
            }

            const updatedOrder = await response.json();

            // Update local state
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, ...updatedOrder } : order
                )
            );

            alert('Order status updated successfully!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update order status');
        }
    };

    const getOrderCount = (status: number) => {
        return orders.filter(order => order.order_status === status).length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-secondary">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-circle text-red-500 text-xl"></i>
                    <div>
                        <h3 className="font-semibold text-red-700">Error Loading Orders</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary mb-2">
                    <i className="fas fa-box-open mr-3"></i>
                    Order Management
                </h1>
                <p className="text-secondary">
                    Manage and update order statuses for your patients
                </p>
            </div>

            {/* Filters and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`card hover:shadow-md transition-all ${filterStatus === 'all' ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                >
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{orders.length}</div>
                        <div className="text-sm text-secondary">All Orders</div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus(1)}
                    className={`card hover:shadow-md transition-all ${filterStatus === 1 ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                >
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{getOrderCount(1)}</div>
                        <div className="text-sm text-secondary">Confirmed</div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus(2)}
                    className={`card hover:shadow-md transition-all ${filterStatus === 2 ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
                        }`}
                >
                    <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{getOrderCount(2)}</div>
                        <div className="text-sm text-secondary">Processing</div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus(3)}
                    className={`card hover:shadow-md transition-all ${filterStatus === 3 ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                        }`}
                >
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{getOrderCount(3)}</div>
                        <div className="text-sm text-secondary">Packed</div>
                    </div>
                </button>

                <button
                    onClick={() => setFilterStatus(4)}
                    className={`card hover:shadow-md transition-all ${filterStatus === 4 ? 'ring-2 ring-cyan-500 bg-cyan-50' : ''
                        }`}
                >
                    <div className="text-center">
                        <div className="text-2xl font-bold text-cyan-600">{getOrderCount(4)}</div>
                        <div className="text-sm text-secondary">Shipped</div>
                    </div>
                </button>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="card text-center py-12">
                    <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-secondary mb-2">
                        {filterStatus === 'all' ? 'No Orders Yet' : 'No Orders in This Status'}
                    </h3>
                    <p className="text-tertiary">
                        {filterStatus === 'all'
                            ? 'Orders will appear here once patients place them.'
                            : 'Try selecting a different status filter.'}
                    </p>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-primary">
                            {filterStatus === 'all'
                                ? `All Orders (${filteredOrders.length})`
                                : `Showing ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
                        </h2>
                    </div>

                    {filteredOrders.map((order) => (
                        <OrderManagementCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import Link from 'next/link';
import OrderStatusTimeline from './OrderStatusTimeline';

export interface OrderItem {
    id: number;
    item_id: number;
    user_id: number;
    order_quantity: number;
    order_date: string;
    order_status: number;
    tracking_number?: string;
    shipped_date?: string;
    delivered_date?: string;
    estimated_delivery?: string;
    item?: {
        id: number;
        item_title: string;
        item_brand: string;
        item_price: number;
        item_image: string;
        item_details: string;
    };
}

interface OrderCardProps {
    order: OrderItem;
    onCancel: (orderId: number) => void;
}

export default function OrderCard({ order, onCancel }: OrderCardProps) {
    const [showTimeline, setShowTimeline] = useState(false);

    const getStatusBadge = (status: number) => {
        const statusConfig: Record<number, { label: string; color: string }> = {
            0: { label: 'Pending Payment', color: 'yellow' },
            1: { label: 'Confirmed', color: 'blue' },
            2: { label: 'Processing', color: 'indigo' },
            3: { label: 'Packed', color: 'purple' },
            4: { label: 'Shipped', color: 'cyan' },
            5: { label: 'Out for Delivery', color: 'orange' },
            6: { label: 'Delivered', color: 'green' },
            7: { label: 'Cancelled', color: 'red' },
            8: { label: 'Returned', color: 'gray' },
            9: { label: 'Refunded', color: 'pink' },
        };

        const config = statusConfig[status] || { label: 'Unknown', color: 'gray' };

        return (
            <span className={`text-xs font-medium px-3 py-1 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                {config.label}
            </span>
        );
    };

    const canCancel = () => {
        // Can cancel only if status <= 3 (Packed)
        return order.order_status > 0 && order.order_status <= 3;
    };

    return (
        <div className="card">
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
                            {canCancel() && (
                                <button
                                    onClick={() => onCancel(order.id)}
                                    className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-100 text-sm"
                                >
                                    Cancel Order
                                </button>
                            )}
                            <button
                                onClick={() => setShowTimeline(!showTimeline)}
                                className="btn btn-outline text-sm"
                            >
                                <i className={`fas fa-${showTimeline ? 'chevron-up' : 'route'} mr-2`}></i>
                                {showTimeline ? 'Hide' : 'Track Order'}
                            </button>
                        </div>
                    </div>

                    {/* Expandable Timeline */}
                    {showTimeline && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <OrderStatusTimeline
                                currentStatus={order.order_status}
                                estimatedDelivery={order.estimated_delivery}
                                trackingNumber={order.tracking_number}
                                shippedDate={order.shipped_date}
                                deliveredDate={order.delivered_date}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

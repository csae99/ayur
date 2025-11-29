import { useState } from 'react';

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

interface OrderManagementCardProps {
    order: OrderItem;
    onStatusUpdate: (orderId: number, newStatus: number, trackingNumber?: string) => void;
}

export default function OrderManagementCard({ order, onStatusUpdate }: OrderManagementCardProps) {
    const [selectedStatus, setSelectedStatus] = useState(order.order_status);
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
    const [isUpdating, setIsUpdating] = useState(false);

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

    const getAvailableStatuses = (currentStatus: number) => {
        // Practitioners can update: 1→2→3→4 (and back to 7 for cancellation)
        const transitions: Record<number, Array<{ value: number; label: string }>> = {
            1: [
                { value: 1, label: 'Confirmed' },
                { value: 2, label: 'Processing' },
                { value: 7, label: 'Cancelled' }
            ],
            2: [
                { value: 2, label: 'Processing' },
                { value: 3, label: 'Packed' },
                { value: 7, label: 'Cancelled' }
            ],
            3: [
                { value: 3, label: 'Packed' },
                { value: 4, label: 'Shipped' },
                { value: 7, label: 'Cancelled' }
            ],
            4: [
                { value: 4, label: 'Shipped' }
            ],
            5: [
                { value: 5, label: 'Out for Delivery' }
            ],
            6: [
                { value: 6, label: 'Delivered' }
            ],
            7: [
                { value: 7, label: 'Cancelled' }
            ],
        };

        return transitions[currentStatus] || [{ value: currentStatus, label: 'Current' }];
    };

    const handleUpdate = async () => {
        if (selectedStatus === order.order_status) {
            return; // No change
        }

        if (selectedStatus === 4 && !trackingNumber.trim()) {
            alert('Please enter a tracking number for shipped orders');
            return;
        }

        setIsUpdating(true);
        try {
            await onStatusUpdate(order.id, selectedStatus, trackingNumber);
        } finally {
            setIsUpdating(false);
        }
    };

    const requiresTracking = selectedStatus === 4 && order.order_status !== 4;

    return (
        <div className="card mb-4">
            <div className="flex gap-6">
                {/* Item Image */}
                <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-amber-50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
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
                        <div className="text-2xl">🌿</div>
                    )}
                </div>

                {/* Order Details */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="text-lg font-semibold text-primary">
                                {order.item?.item_title || `Item #${order.item_id}`}
                            </h3>
                            <p className="text-sm text-secondary">
                                Order #{order.id} • {new Date(order.order_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                        {getStatusBadge(order.order_status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        <div>
                            <span className="text-tertiary">Quantity:</span>{' '}
                            <span className="font-semibold text-primary">{order.order_quantity}</span>
                        </div>
                        {order.item && (
                            <div>
                                <span className="text-tertiary">Amount:</span>{' '}
                                <span className="font-bold text-green-700">
                                    ₹{order.item.item_price * order.order_quantity}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Status Update Controls */}
                    {order.order_status <= 4 && order.order_status !== 7 && (
                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-semibold text-primary mb-3">Update Order Status</h4>

                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium text-secondary mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(Number(e.target.value))}
                                        className="input"
                                        disabled={isUpdating}
                                    >
                                        {getAvailableStatuses(order.order_status).map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {requiresTracking && (
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-secondary mb-1">
                                            Tracking Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            className="input"
                                            placeholder="e.g., ABC123456"
                                            disabled={isUpdating}
                                            maxLength={30}
                                        />
                                    </div>
                                )}

                                {order.tracking_number && !requiresTracking && (
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-medium text-secondary mb-1">
                                            Tracking Number
                                        </label>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                                            <i className="fas fa-truck text-green-600"></i>
                                            <span className="font-mono text-sm text-primary">{order.tracking_number}</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating || selectedStatus === order.order_status}
                                    className="btn btn-primary"
                                >
                                    {isUpdating ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check mr-2"></i>
                                            Update Status
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

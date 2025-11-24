import Link from 'next/link';

export interface OrderItem {
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

interface OrderCardProps {
    order: OrderItem;
    onCancel: (orderId: number) => void;
}

export default function OrderCard({ order, onCancel }: OrderCardProps) {
    const getStatusBadge = (status: number) => {
        if (status === 0) {
            return <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>;
        }
        return <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">Completed</span>;
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
                            {order.order_status === 0 && (
                                <button
                                    onClick={() => onCancel(order.id)}
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
    );
}

import React from 'react';

interface OrderStatusTimelineProps {
    currentStatus: number;
    estimatedDelivery?: string;
    trackingNumber?: string;
    shippedDate?: string;
    deliveredDate?: string;
}

const ORDER_STATUSES = [
    { id: 1, label: 'Confirmed', icon: 'fa-check-circle' },
    { id: 2, label: 'Processing', icon: 'fa-cog' },
    { id: 3, label: 'Packed', icon: 'fa-box' },
    { id: 4, label: 'Shipped', icon: 'fa-shipping-fast' },
    { id: 5, label: 'Out for Delivery', icon: 'fa-truck' },
    { id: 6, label: 'Delivered', icon: 'fa-home' },
];

const CANCELLED_STATUS = { id: 7, label: 'Cancelled', icon: 'fa-times-circle' };

export default function OrderStatusTimeline({
    currentStatus,
    estimatedDelivery,
    trackingNumber,
    shippedDate,
    deliveredDate
}: OrderStatusTimelineProps) {
    // Handle cancelled status separately
    if (currentStatus === 7) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 text-red-700">
                    <i className={`fas ${CANCELLED_STATUS.icon} text-3xl`}></i>
                    <div>
                        <h3 className="text-lg font-semibold">Order Cancelled</h3>
                        <p className="text-sm text-red-600">This order has been cancelled</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Status</h3>

            {/* Timeline */}
            <div className="relative">
                {ORDER_STATUSES.map((status, index) => {
                    const isCompleted = currentStatus > status.id;
                    const isCurrent = currentStatus === status.id;
                    const isPending = currentStatus < status.id;

                    return (
                        <div key={status.id} className="mb-8 last:mb-0">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="relative flex-shrink-0">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                                        ${isCompleted ? 'bg-green-600 text-white' : ''}
                                        ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                                        ${isPending ? 'bg-gray-200 text-gray-400' : ''}
                                    `}>
                                        <i className={`fas ${status.icon}`}></i>
                                    </div>

                                    {/* Connecting Line */}
                                    {index < ORDER_STATUSES.length - 1 && (
                                        <div className={`
                                            absolute left-6 top-12 w-0.5 h-8
                                            ${currentStatus > status.id ? 'bg-green-600' : 'bg-gray-300'}
                                        `}></div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-2">
                                    <h4 className={`
                                        font-semibold text-base mb-1
                                        ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'}
                                    `}>
                                        {status.label}
                                    </h4>

                                    {isCurrent && (
                                        <p className="text-sm text-blue-600 font-medium">
                                            <i className="fas fa-circle text-xs mr-1 animate-pulse"></i>
                                            Current Status
                                        </p>
                                    )}

                                    {isCompleted && (
                                        <p className="text-sm text-green-600">
                                            <i className="fas fa-check text-xs mr-1"></i>
                                            Completed
                                        </p>
                                    )}

                                    {/* Additional Info */}
                                    {status.id === 4 && trackingNumber && currentStatus >= 4 && (
                                        <div className="mt-2 text-sm">
                                            <span className="text-gray-600">Tracking: </span>
                                            <span className="font-mono font-semibold text-gray-800">{trackingNumber}</span>
                                        </div>
                                    )}

                                    {status.id === 4 && shippedDate && currentStatus >= 4 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Shipped on {new Date(shippedDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )}

                                    {status.id === 6 && deliveredDate && currentStatus === 6 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Delivered on {new Date(deliveredDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Estimated Delivery */}
            {estimatedDelivery && currentStatus < 6 && currentStatus !== 7 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                        <i className="fas fa-calendar-alt text-green-600"></i>
                        <span className="text-sm">Estimated Delivery:</span>
                        <span className="font-semibold text-gray-800">
                            {new Date(estimatedDelivery).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

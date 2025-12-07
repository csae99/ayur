import React from 'react';

interface TimelineEvent {
    status: number;
    status_name: string;
    notes: string;
    created_at: string;
}

interface OrderTimelineProps {
    status: number;
    history: TimelineEvent[];
}

export default function OrderTimeline({ status, history }: OrderTimelineProps) {
    // Define all possible steps
    const steps = [
        { status: 1, label: 'Confirmed' },
        { status: 2, label: 'Processing' },
        { status: 3, label: 'Packed' },
        { status: 4, label: 'Shipped' },
        { status: 6, label: 'Delivered' }
    ];

    // If cancelled, show special state
    if (status === 7) {
        return (
            <div className="w-full py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-red-700 font-medium">This order has been cancelled.</p>
                </div>
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(step => step.status === status);

    // Find history for each step to show timestamp
    const getStepDate = (stepStatus: number) => {
        const event = history?.find(h => h.status === stepStatus);
        if (!event) return null;
        return new Date(event.created_at).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="w-full py-6">
            <div className="relative flex items-center justify-between w-full">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2" />

                {/* Active Progress Bar */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-green-600 -z-10 transform -translate-y-1/2 transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const date = getStepDate(step.status);

                    return (
                        <div key={step.status} className="flex flex-col items-center group">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300
                                ${isCompleted ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-gray-400'}
                                ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span className="text-xs">{index + 1}</span>
                                )}
                            </div>
                            <div className="mt-2 text-center">
                                <p className={`text-xs font-medium ${isCompleted ? 'text-green-800' : 'text-gray-500'}`}>
                                    {step.label}
                                </p>
                                {date && (
                                    <p className="text-[10px] text-gray-500 mt-1">{date}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed History Log (Expandable?) - For now just concise info */}
        </div>
    );
}

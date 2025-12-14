import React, { useState, useEffect } from 'react';

interface TimeSlot {
    start_time: string;
    end_time: string;
    is_available: boolean;
}

interface BookingCalendarProps {
    practitionerId: number;
    onSelectSlot: (date: string, time: string) => void;
}

export default function BookingCalendar({ practitionerId, onSelectSlot }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Generate next 7 days
    const [nextDays, setNextDays] = useState<Date[]>([]);

    // Mock availability logic for now (Frontend integration phase)
    // Real implementation would fetch from /api/identity/availability/:id 
    // and filter slots based on bookings.

    useEffect(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return d;
        });
        setNextDays(days);
        setSelectedDate(days[0].toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        const fetchSlots = async (date: string) => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost/api/identity/availability/${practitionerId}/slots?date=${date}`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableSlots(data); // Expecting text array ["09:00", "10:00"]
                } else {
                    console.error('Failed to fetch slots');
                    setAvailableSlots([]);
                }
            } catch (error) {
                console.error('Error fetching slots:', error);
                setAvailableSlots([]);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDate) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate, practitionerId]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Appointment Time</h3>

            {/* Date Selection - Horizontal Scroll */}
            <div className="flex overflow-x-auto pb-4 mb-4 gap-3 no-scrollbar">
                {nextDays.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    const isSelected = selectedDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`flex flex-col items-center min-w-[4rem] p-3 rounded-lg border transition-all ${isSelected
                                ? 'bg-green-600 border-green-600 text-white shadow-md transform scale-105'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                                }`}
                        >
                            <span className="text-xs font-medium uppercase">{dayName}</span>
                            <span className="text-xl font-bold">{dayNum}</span>
                        </button>
                    );
                })}
            </div>

            {/* Time Slots grid */}
            <div className="min-h-[200px]">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-500 mb-3">Available slots for {new Date(selectedDate).toLocaleDateString()}:</p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {availableSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => onSelectSlot(selectedDate, time)}
                                    className="py-2 px-3 text-sm rounded-md border border-green-200 text-green-700 hover:bg-green-600 hover:text-white transition-colors focus:ring-2 focus:ring-green-400 focus:outline-none"
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

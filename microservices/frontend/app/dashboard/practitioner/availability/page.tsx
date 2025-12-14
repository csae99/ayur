'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AvailabilitySlot {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
    const router = useRouter();
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Initial load: fetch existing availability
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'practitioner') {
            router.push('/dashboard');
            return;
        }

        // We need practitioner ID. Assuming user object has id or we decode token? 
        // Or we use a route like /availability/me? 
        // My backend route is GET /:practitionerId.
        // But frontend usually only has user.id if logged in. 
        // Let's assume user.id matches practitioner.id for now (identity service usually returns id).

        fetch(`http://localhost/api/identity/availability/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    // Map or use as is
                    const formatted = data.map((item: any) => ({
                        day_of_week: item.day_of_week,
                        start_time: item.start_time.substring(0, 5), // HH:mm:ss -> HH:mm
                        end_time: item.end_time.substring(0, 5)
                    }));
                    setSlots(formatted);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const addSlot = (day: string) => {
        // Default 9-5
        setSlots([...slots, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
    };

    const removeSlot = (index: number) => {
        const newSlots = [...slots];
        newSlots.splice(index, 1);
        setSlots(newSlots);
    };

    const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setSlots(newSlots);
    };

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost/api/identity/availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ slots })
            });

            if (res.ok) {
                setNotification({ type: 'success', message: 'Availability updated successfully!' });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Save failed:', res.status, errData);
                throw new Error(errData.error || `Failed to save: ${res.status}`);
            }
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message || 'Error saving availability.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/practitioner" className="flex items-center gap-2">
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Practitioner</span></span>
                        </Link>
                        <Link href="/dashboard/practitioner" className="text-gray-600 hover:text-green-700 font-medium">Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="container py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Availability</h1>

                {notification && (
                    <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {notification.message}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Day Selection */}
                        <div>
                            <h3 className="font-semibold mb-4 text-gray-700">Add Availability</h3>
                            <div className="space-y-2">
                                {DAYS_OF_WEEK.map(day => (
                                    <button
                                        key={day}
                                        onClick={() => addSlot(day)}
                                        className="btn btn-outline w-full justify-start"
                                    >
                                        <i className="fas fa-plus mr-2"></i> {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Configured Slots */}
                        <div>
                            <h3 className="font-semibold mb-4 text-gray-700">Current Schedule</h3>
                            {slots.length === 0 ? (
                                <p className="text-gray-500 italic">No slots configured.</p>
                            ) : (
                                <div className="space-y-3">
                                    {slots.map((slot, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                                            <span className="font-bold w-24">{slot.day_of_week}</span>
                                            <input
                                                type="time"
                                                value={slot.start_time}
                                                onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={slot.end_time}
                                                onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                            <button onClick={() => removeSlot(idx)} className="text-red-500 hover:text-red-700 ml-auto">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary px-8"
                        >
                            {saving ? 'Saving...' : 'Save Availability'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

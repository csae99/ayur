'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone: string;
    office_name: string;
    address: string;
    profile: string;
    professionality: string;
    bio: string;
}

export default function FindPractitionersPage() {
    const router = useRouter();
    const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingNotes, setBookingNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        // Verify user is patient
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (parsedUser.role !== 'patient') {
                router.push('/dashboard');
                return;
            }
        } catch (e) {
            console.error('Error parsing user data', e);
        }

        fetch('http://localhost/api/identity/practitioners/public')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPractitioners(data);
                } else {
                    setPractitioners([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching practitioners:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleWhatsApp = (phone: string) => {
        // Remove non-numeric characters
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPractitioner) return;

        setBookingLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost/api/orders/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    practitioner_id: selectedPractitioner.id,
                    date: bookingDate,
                    time: bookingTime,
                    notes: bookingNotes
                })
            });

            if (res.ok) {
                alert('Appointment request sent successfully!');
                setSelectedPractitioner(null);
                setBookingDate('');
                setBookingTime('');
                setBookingNotes('');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to book appointment');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            alert('An error occurred');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Find Practitioners</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : practitioners.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No practitioners found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {practitioners.map(practitioner => (
                            <div key={practitioner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                                            {practitioner.fname[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                Dr. {practitioner.fname} {practitioner.lname}
                                            </h3>
                                            <p className="text-green-600 font-medium">{practitioner.professionality}</p>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {practitioner.bio || 'No bio available.'}
                                    </p>

                                    <div className="text-sm text-gray-500 mb-6 space-y-1">
                                        <p><i className="fas fa-building mr-2"></i> {practitioner.office_name}</p>
                                        <p><i className="fas fa-map-marker-alt mr-2"></i> {practitioner.address}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleWhatsApp(practitioner.phone)}
                                            className="btn bg-green-500 hover:bg-green-600 text-white border-none flex items-center justify-center gap-2"
                                        >
                                            <i className="fab fa-whatsapp"></i> Chat
                                        </button>
                                        <a
                                            href={`mailto:${practitioner.email}`}
                                            className="btn bg-blue-500 hover:bg-blue-600 text-white border-none flex items-center justify-center gap-2"
                                        >
                                            <i className="fas fa-envelope"></i> Email
                                        </a>
                                        <button
                                            onClick={() => setSelectedPractitioner(practitioner)}
                                            className="btn btn-primary col-span-2"
                                        >
                                            Book Appointment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {selectedPractitioner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                Book with Dr. {selectedPractitioner.fname}
                            </h3>
                            <button
                                onClick={() => setSelectedPractitioner(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleBookAppointment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="input w-full"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input w-full"
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    className="textarea w-full"
                                    rows={3}
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes(e.target.value)}
                                    placeholder="Reason for visit..."
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPractitioner(null)}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary flex-1 ${bookingLoading ? 'loading' : ''}`}
                                    disabled={bookingLoading}
                                >
                                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

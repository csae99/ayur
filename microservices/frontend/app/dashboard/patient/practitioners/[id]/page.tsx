'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import BookingCalendar from '@/components/appointments/BookingCalendar';

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

export default function PractitionerProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error(e);
            }
        }

        fetch(`${window.location.origin}/api/identity/practitioners/public/${params.id}`)
            .then(res => {
                if (!res.ok) throw new Error('Practitioner not found');
                return res.json();
            })
            .then(data => {
                setPractitioner(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching practitioner:', err);
                setLoading(false);
            });
    }, [params.id, router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleBookSlot = async (date: string, time: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${window.location.origin}/api/identity/appointments/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    practitioner_id: params.id,
                    appointment_date: date,
                    appointment_time: time,
                    notes: 'Initial consultation via Ayur Website'
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Appointment booked successfully!' });

                // Redirect to appointments page after a delay
                setTimeout(() => {
                    router.push('/dashboard/patient/appointments');
                }, 2000);
            } else {
                const err = await response.json();
                setNotification({ type: 'error', message: err.error || 'Booking failed' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Network error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!practitioner) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-xl text-gray-500">Practitioner not found.</p>
                </div>
            </div >
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    <div className="flex items-center gap-3">
                        {notification.type === 'success' ? (
                            <i className="fas fa-check-circle"></i>
                        ) : (
                            <i className="fas fa-exclamation-circle"></i>
                        )}
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                    {/* Left: Profile Info */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center sticky top-24">
                            <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
                                {practitioner.profile ? (
                                    <img
                                        src={`/uploads/${practitioner.profile}`}
                                        alt={practitioner.fname}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                                        <i className="fas fa-user-md text-5xl"></i>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Dr. {practitioner.fname} {practitioner.lname}
                            </h1>
                            <p className="text-green-700 font-medium mb-4">{practitioner.professionality}</p>

                            <div className="text-left space-y-4 text-sm text-gray-600">
                                {practitioner.office_name && (
                                    <div className="flex items-start gap-3">
                                        <i className="fas fa-clinic-medical mt-1 w-5 text-center text-green-600"></i>
                                        <span>{practitioner.office_name}</span>
                                    </div>
                                )}
                                {practitioner.address && (
                                    <div className="flex items-start gap-3">
                                        <i className="fas fa-map-marker-alt mt-1 w-5 text-center text-red-500"></i>
                                        <span>{practitioner.address}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 my-4"></div>
                                <p className="italic text-gray-500">"{practitioner.bio || 'No bio available'}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Booking Calendar */}
                    <div className="lg:w-2/3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Book an Appointment</h2>
                            <BookingCalendar
                                practitionerId={practitioner.id}
                                onSelectSlot={handleBookSlot}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Appointment {
    id: number;
    patient_id: number;
    date: string;
    time: string;
    status: string;
    notes: string;
}

export default function PractitionerAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'practitioner') {
            router.push('/dashboard');
            return;
        }

        fetch('http://localhost/api/orders/appointments/practitioner', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAppointments(data);
                } else {
                    setAppointments([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching appointments:', err);
                setLoading(false);
            });
    }, [router]);

    const handleStatusUpdate = (id: number, newStatus: string) => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost/api/orders/appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        })
            .then(res => res.json())
            .then(updatedAppt => {
                setAppointments(prev => prev.map(a =>
                    a.id === id ? { ...a, status: newStatus } : a
                ));
            })
            .catch(err => console.error('Error updating status:', err));
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Confirmed': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Completed': 'bg-blue-100 text-blue-700'
        };
        const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>{status}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/practitioner" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Practitioner</span></span>
                        </Link>
                        <Link href="/dashboard/practitioner" className="text-gray-600 hover:text-green-700 font-medium">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Appointment Requests</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-500">No appointment requests found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map(appt => (
                            <div key={appt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-lg text-gray-800">
                                            {appt.date} at {appt.time}
                                        </span>
                                        {getStatusBadge(appt.status)}
                                    </div>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Patient ID:</span> {appt.patient_id}
                                    </p>
                                    {appt.notes && (
                                        <p className="text-gray-500 text-sm mt-2 bg-gray-50 p-2 rounded">
                                            "{appt.notes}"
                                        </p>
                                    )}
                                </div>

                                {appt.status === 'Pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleStatusUpdate(appt.id, 'Confirmed')}
                                            className="btn bg-green-600 hover:bg-green-700 text-white border-none"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(appt.id, 'Rejected')}
                                            className="btn bg-red-500 hover:bg-red-600 text-white border-none"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {appt.status === 'Confirmed' && (
                                    <button
                                        onClick={() => handleStatusUpdate(appt.id, 'Completed')}
                                        className="btn bg-blue-500 hover:bg-blue-600 text-white border-none"
                                    >
                                        Mark Completed
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

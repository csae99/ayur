'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Appointment {
    id: number;
    practitioner_id: number;
    date: string;
    time: string;
    status: string;
    notes: string;
}

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    office_name: string;
}

export default function MyAppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [practitioners, setPractitioners] = useState<Record<number, Practitioner>>({});
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [rescheduleModal, setRescheduleModal] = useState<{ show: boolean, appointment: Appointment | null }>({ show: false, appointment: null });
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            router.push('/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            console.error('Error parsing user data', e);
        }

        const fetchAppointments = fetch('http://localhost/api/orders/appointments/patient', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json());

        const fetchPractitioners = fetch('http://localhost/api/identity/practitioners/public')
            .then(res => res.json());

        Promise.all([fetchAppointments, fetchPractitioners])
            .then(([apptData, practData]) => {
                if (Array.isArray(apptData)) {
                    setAppointments(apptData);
                }

                if (Array.isArray(practData)) {
                    const practMap: Record<number, Practitioner> = {};
                    practData.forEach((p: any) => {
                        practMap[p.id] = p;
                    });
                    setPractitioners(practMap);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleCancelAppointment = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost/api/orders/appointments/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Cancelled' })
            });

            if (res.ok) {
                setAppointments(prev => prev.map(a =>
                    a.id === id ? { ...a, status: 'Cancelled' } : a
                ));
                alert('Appointment cancelled successfully');
            } else {
                alert('Failed to cancel appointment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
    };

    const handleReschedule = (appointment: Appointment) => {
        setRescheduleModal({ show: true, appointment });
        setNewDate(appointment.date);
        setNewTime(appointment.time);
    };

    const submitReschedule = async () => {
        if (!rescheduleModal.appointment) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost/api/orders/appointments/${rescheduleModal.appointment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: newDate,
                    time: newTime,
                    status: 'Pending'
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setAppointments(prev => prev.map(a =>
                    a.id === rescheduleModal.appointment!.id
                        ? { ...a, date: newDate, time: newTime, status: 'Pending' }
                        : a
                ));
                setRescheduleModal({ show: false, appointment: null });
                alert('Appointment rescheduled successfully. Waiting for practitioner confirmation.');
            } else {
                alert('Failed to reschedule appointment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Confirmed': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Rejected': 'bg-red-100 text-red-700',
            'Cancelled': 'bg-gray-100 text-gray-700',
            'Completed': 'bg-blue-100 text-blue-700'
        };
        const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>{status}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Appointments</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500 text-xl mb-4">No appointments found.</p>
                        <Link href="/dashboard/patient/practitioners" className="btn btn-primary">
                            Book an Appointment
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600">Practitioner</th>
                                        <th className="p-4 font-semibold text-gray-600">Date & Time</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        <th className="p-4 font-semibold text-gray-600">Notes</th>
                                        <th className="p-4 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {appointments.map(appt => {
                                        const pract = practitioners[appt.practitioner_id];
                                        const canModify = appt.status === 'Pending' || appt.status === 'Confirmed';

                                        return (
                                            <tr key={appt.id} className="hover:bg-gray-50">
                                                <td className="p-4">
                                                    {pract ? (
                                                        <div>
                                                            <div className="font-semibold text-gray-800">Dr. {pract.fname} {pract.lname}</div>
                                                            <div className="text-xs text-gray-500">{pract.office_name}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Unknown Practitioner</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-800">{appt.date}</div>
                                                    <div className="text-sm text-gray-500">{appt.time}</div>
                                                </td>
                                                <td className="p-4">
                                                    {getStatusBadge(appt.status)}
                                                </td>
                                                <td className="p-4 text-gray-600 max-w-xs truncate">
                                                    {appt.notes || '-'}
                                                </td>
                                                <td className="p-4">
                                                    {canModify && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleReschedule(appt)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                            >
                                                                Reschedule
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelAppointment(appt.id)}
                                                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {rescheduleModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">
                                Reschedule Appointment
                            </h3>
                            <button
                                onClick={() => setRescheduleModal({ show: false, appointment: null })}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitReschedule(); }}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                                <input
                                    type="date"
                                    required
                                    className="input w-full"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Time</label>
                                <input
                                    type="time"
                                    required
                                    className="input w-full"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setRescheduleModal({ show: false, appointment: null })}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                >
                                    Confirm Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

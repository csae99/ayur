'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Medicine {
    name: string;
    dosage: string;
    instructions: string;
    item_id?: number;
}

interface Prescription {
    id: number;
    practitioner_id: number;
    created_at: string;
    Practitioner: {
        fname: string;
        lname: string;
        office_name: string;
    };
    medicines: Medicine[];
    notes: string;
}

export default function PatientPrescriptionsPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null); // item_id
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

        fetch(`${window.location.origin}/api/identity/prescriptions/patient`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setPrescriptions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [router]);

    const handleAddToCart = async (medicine: Medicine) => {
        if (!medicine.item_id) {
            alert('This medicine is not linked to a catalog item.');
            return;
        }

        const token = localStorage.getItem('token');
        setAddingToCart(medicine.item_id);

        try {
            const response = await fetch(`${window.location.origin}/api/orders/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: medicine.item_id,
                    order_quantity: 1
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: `${medicine.name} added to cart!` });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const err = await response.json();
                setNotification({ type: 'error', message: err.message || 'Failed to add to cart' });
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Network error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Prescriptions</h1>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div></div>
                ) : prescriptions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-500">No prescriptions found.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {prescriptions.map(p => (
                            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-green-800 text-lg">Dr. {p.Practitioner.fname} {p.Practitioner.lname}</h3>
                                        <p className="text-sm text-green-600">{p.Practitioner.office_name}</p>
                                    </div>
                                    <span className="text-gray-500 text-sm font-medium">
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Medicines</h4>
                                            <div className="space-y-4">
                                                {p.medicines.map((m, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <p className="font-bold text-gray-800">{m.name}</p>
                                                            <p className="text-sm text-gray-600">{m.dosage} - {m.instructions}</p>
                                                        </div>
                                                        {m.item_id ? (
                                                            <button
                                                                onClick={() => handleAddToCart(m)}
                                                                disabled={addingToCart === m.item_id}
                                                                className="btn btn-sm btn-primary flex items-center gap-2"
                                                            >
                                                                {addingToCart === m.item_id ? (
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                ) : (
                                                                    <i className="fas fa-cart-plus"></i>
                                                                )}
                                                                Add
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Not in catalog</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Doctor's Notes</h4>
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-gray-700 italic">
                                                "{p.notes || 'No notes provided.'}"
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

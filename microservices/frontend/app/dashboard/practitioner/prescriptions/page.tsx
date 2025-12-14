'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Prescription {
    id: number;
    patient_id: number;
    created_at: string;
    Patient: {
        fname: string;
        lname: string;
        email: string;
    };
    medicines: { name: string; dosage: string }[];
}

export default function PractitionerPrescriptionsPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost/api/identity/prescriptions/practitioner', {
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

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/practitioner" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                P
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Practitioner</span></span>
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/dashboard/practitioner" className="text-gray-600 hover:text-green-700 font-medium">Dashboard</Link>
                            <Link href="/dashboard/practitioner/prescriptions/create" className="btn btn-primary">
                                <i className="fas fa-plus mr-2"></i>New Prescription
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Prescriptions</h1>

                {loading ? (
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div></div>
                ) : prescriptions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-500">No prescriptions written yet.</p>
                        <Link href="/dashboard/practitioner/prescriptions/create" className="text-green-600 font-medium hover:underline mt-4 inline-block">
                            Write your first prescription
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prescriptions.map(p => (
                            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{p.Patient.fname} {p.Patient.lname}</h3>
                                        <p className="text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                        {p.medicines.length} Medicines
                                    </span>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {p.medicines.slice(0, 3).map((m, idx) => (
                                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                                            <span>{m.name}</span>
                                            <span className="text-gray-400">{m.dosage}</span>
                                        </div>
                                    ))}
                                    {p.medicines.length > 3 && (
                                        <p className="text-xs text-green-600 font-medium">+{p.medicines.length - 3} more</p>
                                    )}
                                </div>
                                <button className="btn btn-outline w-full text-sm">View Details</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

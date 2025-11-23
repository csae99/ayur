'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Medicine {
    id: number;
    item_title: string;
    item_brand: string;
    item_cat: string;
    item_price: number;
    item_quantity: number;
    status: string;
    item_image: string;
}

export default function MyMedicinesPage() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'practitioner') {
            router.push('/dashboard');
            return;
        }

        fetch(`http://localhost/api/catalog/items/practitioner/${user.username}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('API Response:', data);
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setMedicines(data);
                } else {
                    console.error('API did not return an array:', data);
                    setMedicines([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching medicines:', err);
                setMedicines([]);
                setLoading(false);
            });
    }, [router]);

    const getStatusBadge = (status: string) => {
        const styles = {
            'Allowed': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Rejected': 'bg-red-100 text-red-700'
        };
        const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>{status}</span>;
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) return;

        const token = localStorage.getItem('token');
        fetch(`http://localhost/api/catalog/items/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.ok) {
                    setMedicines(prev => prev.filter(m => m.id !== id));
                } else {
                    res.json().then(data => alert(data.error || 'Failed to delete'));
                }
            })
            .catch(err => console.error('Error deleting medicine:', err));
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
                        <Link href="/dashboard/practitioner/add-medicine" className="btn btn-primary">
                            Add New Medicine
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Medicines</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xl text-gray-500 mb-4">You haven't added any medicines yet.</p>
                        <Link href="/dashboard/practitioner/add-medicine" className="btn btn-primary">
                            Add Your First Medicine
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicines.map((med) => (
                            <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-100 relative">
                                    <img
                                        src={`/images/${med.item_image}`}
                                        alt={med.item_title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/Medicine.png';
                                        }}
                                    />
                                    <div className="absolute top-4 right-4">
                                        {getStatusBadge(med.status || 'Pending')}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{med.item_title}</h3>
                                            <p className="text-sm text-gray-500">{med.item_brand}</p>
                                        </div>
                                        <span className="font-bold text-green-700">₹{med.item_price}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                                        <span>Stock: {med.item_quantity}</span>
                                        <span>{med.item_cat}</span>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => handleDelete(med.id)}
                                            className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <i className="fas fa-trash-alt"></i> Delete
                                        </button>
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

function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost/api/catalog/items/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            if (res.ok) {
                window.location.reload(); // Simple reload to refresh list
            } else {
                res.json().then(data => alert(data.error || 'Failed to delete'));
            }
        })
        .catch(err => console.error('Error deleting medicine:', err));
}

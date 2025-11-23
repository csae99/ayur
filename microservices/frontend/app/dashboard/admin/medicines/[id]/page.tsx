'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Medicine {
    id: number;
    item_title: string;
    item_brand: string;
    item_cat: string;
    item_details: string;
    item_tags: string;
    item_price: number;
    item_quantity: number;
    item_image: string;
    status: string;
    added_by: string;
}

export default function MedicineDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userData || !token) {
            router.push('/login');
            return;
        }

        const parsed = JSON.parse(userData);
        if (parsed.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        // Fetch medicine details
        fetch(`http://localhost/api/catalog/admin/items/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setMedicine(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching medicine:', err);
                setLoading(false);
            });
    }, [router, params.id]);

    const handleStatusUpdate = async (newStatus: string) => {
        const token = localStorage.getItem('token');
        setProcessing(true);

        try {
            const res = await fetch(`http://localhost/api/catalog/admin/items/${params.id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                const updated = await res.json();
                setMedicine(updated);
                alert(`Medicine ${newStatus.toLowerCase()} successfully!`);
            } else {
                alert('Failed to update medicine status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('An error occurred');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            </div>
        );
    }

    if (!medicine) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <i className="fa fa-capsules text-6xl text-gray-300 mb-4"></i>
                    <p className="text-xl text-gray-500">Medicine not found</p>
                    <Link href="/dashboard/admin/medicines" className="btn btn-primary mt-4">
                        Back to Medicines
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/admin" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold text-white">Ayurveda Admin</span>
                        </Link>
                        <Link href="/dashboard/admin/medicines" className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                            <i className="fas fa-arrow-left mr-2"></i> Back to Medicines
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Medicine Details Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
                        <div className="h-64 bg-gray-100 relative">
                            <img
                                src={`/Medicine.png`}
                                alt={medicine.item_title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4">
                                {medicine.status === 'Approved' && (
                                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Approved</span>
                                )}
                                {medicine.status === 'Rejected' && (
                                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Rejected</span>
                                )}
                                {medicine.status === 'Pending' && (
                                    <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Pending Review</span>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">{medicine.item_title}</h1>
                                <p className="text-lg text-gray-500">{medicine.item_brand}</p>
                            </div>

                            {/* Medicine Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Category</label>
                                    <p className="text-gray-800">{medicine.item_cat}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Price</label>
                                    <p className="text-gray-800 text-xl font-bold text-green-600">₹{medicine.item_price}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Stock Quantity</label>
                                    <p className="text-gray-800">{medicine.item_quantity} units</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Added By</label>
                                    <p className="text-gray-800">{medicine.added_by || 'Unknown'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">Tags</label>
                                    <p className="text-gray-800">{medicine.item_tags}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">Description</label>
                                    <p className="text-gray-800">{medicine.item_details}</p>
                                </div>
                            </div>

                            {/* Status Actions */}
                            <div className="border-t border-gray-200 pt-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Review Actions</h2>

                                {medicine.status === 'Pending' && (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={() => handleStatusUpdate('Approved')}
                                            disabled={processing}
                                            className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-check-circle mr-2"></i>
                                                    Approve Medicine
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('Rejected')}
                                            disabled={processing}
                                            className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-times-circle mr-2"></i>
                                                    Reject Medicine
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {medicine.status === 'Approved' && (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={() => handleStatusUpdate('Rejected')}
                                            disabled={processing}
                                            className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-times-circle mr-2"></i>
                                                    Reject Medicine
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('Pending')}
                                            disabled={processing}
                                            className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-redo mr-2"></i>
                                                    Re-review
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {medicine.status === 'Rejected' && (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            onClick={() => handleStatusUpdate('Approved')}
                                            disabled={processing}
                                            className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-check-circle mr-2"></i>
                                                    Approve Medicine
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('Pending')}
                                            disabled={processing}
                                            className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                                        >
                                            {processing ? 'Processing...' : (
                                                <>
                                                    <i className="fas fa-redo mr-2"></i>
                                                    Re-review
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <p className="text-sm text-gray-500 mt-4">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Current Status: <strong>{medicine.status}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

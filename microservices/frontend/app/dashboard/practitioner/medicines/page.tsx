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
    item_desc?: string;
    item_tags?: string;
    status: string;
    item_image: string;
    has_pending_edits?: boolean;
    pending_edits?: any;
}

interface Practitioner {
    verified: boolean;
}

export default function MyMedicinesPage() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [editForm, setEditForm] = useState({
        item_title: '',
        item_brand: '',
        item_cat: '',
        item_price: 0,
        item_quantity: 0,
        item_desc: '',
        item_tags: ''
    });
    const [saving, setSaving] = useState(false);

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

        const fetchData = async () => {
            // Fetch practitioner details for verification status
            try {
                const practRes = await fetch(`http://localhost/api/identity/auth/practitioner/${user.username}`);
                if (practRes.ok) {
                    const practData = await practRes.json();
                    setPractitioner(practData);
                }
            } catch (err) {
                console.error('Error fetching practitioner details:', err);
            }

            // Fetch medicines
            try {
                const res = await fetch(`http://localhost/api/catalog/items/practitioner/${user.username}`);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();

                if (Array.isArray(data)) {
                    setMedicines(data);
                } else {
                    setMedicines([]);
                }
            } catch (err) {
                console.error('Error fetching medicines:', err);
                setMedicines([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const getStatusBadge = (status: string, hasPendingEdits?: boolean) => {
        const styles: { [key: string]: string } = {
            'Approved': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Rejected': 'bg-red-100 text-red-700'
        };
        const style = styles[status] || 'bg-gray-100 text-gray-700';
        return (
            <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>{status}</span>
                {hasPendingEdits && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <i className="fas fa-clock mr-1"></i>Edits Pending
                    </span>
                )}
            </div>
        );
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

    const openEditModal = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setEditForm({
            item_title: medicine.item_title || '',
            item_brand: medicine.item_brand || '',
            item_cat: medicine.item_cat || '',
            item_price: medicine.item_price || 0,
            item_quantity: medicine.item_quantity || 0,
            item_desc: medicine.item_desc || '',
            item_tags: medicine.item_tags || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMedicine) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost/api/catalog/items/${editingMedicine.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const result = await response.json();

                // Check if edits are pending admin approval
                if (result.pending) {
                    // Update local state to show pending badge
                    setMedicines(prev => prev.map(m =>
                        m.id === editingMedicine.id ? { ...m, has_pending_edits: true } : m
                    ));
                    setShowEditModal(false);
                    setEditingMedicine(null);
                    alert('✅ Changes submitted for admin approval. Your current listing remains unchanged until approved.');
                } else {
                    // Direct update (for non-approved items or admin)
                    setMedicines(prev => prev.map(m =>
                        m.id === editingMedicine.id ? { ...m, ...result } : m
                    ));
                    setShowEditModal(false);
                    setEditingMedicine(null);
                }
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update medicine');
            }
        } catch (err) {
            console.error('Error updating medicine:', err);
            alert('Failed to update medicine. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const categories = [
        'Herbs for Health',
        'Skin Care',
        'Digestive Health',
        'Immunity Boosters',
        'Mental Wellness',
        'Women\'s Health',
        'Men\'s Health',
        'Joint & Bone Health',
        'Respiratory Health',
        'Hair Care'
    ];

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
                        <div className="flex gap-4">
                            <Link href="/dashboard/practitioner" className="btn btn-outline">
                                Back to Dashboard
                            </Link>
                            <Link
                                href="/dashboard/practitioner/add-medicine"
                                className={`btn btn-primary ${!practitioner?.verified ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            >
                                Add New Medicine
                            </Link>
                        </div>
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
                        <Link
                            href="/dashboard/practitioner/add-medicine"
                            className={`btn btn-primary ${!practitioner?.verified ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                        >
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
                                        {getStatusBadge(med.status || 'Pending', med.has_pending_edits)}
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
                                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-4">
                                        <button
                                            onClick={() => openEditModal(med)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <i className="fas fa-edit"></i> Edit
                                        </button>
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

            {/* Edit Modal */}
            {showEditModal && editingMedicine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">
                                    <i className="fas fa-edit text-blue-500 mr-2"></i>
                                    Edit Medicine
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                                <input
                                    type="text"
                                    value={editForm.item_title}
                                    onChange={(e) => setEditForm({ ...editForm, item_title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={editForm.item_brand}
                                    onChange={(e) => setEditForm({ ...editForm, item_brand: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={editForm.item_cat}
                                    onChange={(e) => setEditForm({ ...editForm, item_cat: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={editForm.item_price}
                                        onChange={(e) => setEditForm({ ...editForm, item_price: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        value={editForm.item_quantity}
                                        onChange={(e) => setEditForm({ ...editForm, item_quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={editForm.item_tags}
                                    onChange={(e) => setEditForm({ ...editForm, item_tags: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="e.g., digestion, stress, immunity"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editForm.item_desc}
                                    onChange={(e) => setEditForm({ ...editForm, item_desc: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Brief description of the medicine..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check mr-2"></i>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

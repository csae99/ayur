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
    item_details: string;
    item_tags: string;
    status: string;
    item_image: string;
    added_by: string;
    pending_edits: {
        item_title?: string;
        item_brand?: string;
        item_cat?: string;
        item_price?: number;
        item_quantity?: number;
        item_details?: string;
        item_tags?: string;
        submitted_at?: string;
    };
    has_pending_edits: boolean;
}

export default function PendingEditsPage() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

    useEffect(() => {
        // Check admin auth
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userData);
        if (user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchPendingEdits();
    }, [router]);

    const fetchPendingEdits = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.location.origin}/api/catalog/admin/pending-edits`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMedicines(data);
            }
        } catch (error) {
            console.error('Error fetching pending edits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('Approve these changes? The medicine listing will be updated.')) return;

        setProcessing(id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.location.origin}/api/catalog/admin/pending-edits/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMedicines(prev => prev.filter(m => m.id !== id));
                setSelectedMedicine(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to approve');
            }
        } catch (error) {
            console.error('Error approving:', error);
            alert('Failed to approve changes');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Reject these changes? The edits will be discarded.')) return;

        setProcessing(id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${window.location.origin}/api/catalog/admin/pending-edits/${id}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMedicines(prev => prev.filter(m => m.id !== id));
                setSelectedMedicine(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to reject');
            }
        } catch (error) {
            console.error('Error rejecting:', error);
            alert('Failed to reject changes');
        } finally {
            setProcessing(null);
        }
    };

    const renderDiff = (label: string, current: any, proposed: any) => {
        if (proposed === undefined || proposed === null || proposed === current) return null;
        return (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                        <span className="text-red-600 font-medium">Current: </span>
                        <span className="text-gray-700">{String(current) || '(empty)'}</span>
                    </div>
                    <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                        <span className="text-green-600 font-medium">Proposed: </span>
                        <span className="text-gray-700">{String(proposed) || '(empty)'}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/admin" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Admin</span></span>
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/dashboard/admin" className="btn btn-outline">
                                Back to Dashboard
                            </Link>
                            <Link href="/dashboard/admin/medicines" className="btn btn-outline">
                                All Medicines
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Pending Edits Review</h1>
                        <p className="text-gray-500 mt-1">Review and approve changes submitted by practitioners</p>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-medium">
                        <i className="fas fa-clock mr-2"></i>
                        {medicines.length} pending
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <i className="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                        <p className="text-xl text-gray-500">No pending edits to review!</p>
                        <p className="text-gray-400 mt-2">All practitioner edit requests have been processed.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* List */}
                        <div className="space-y-4">
                            {medicines.map((med) => (
                                <div
                                    key={med.id}
                                    onClick={() => setSelectedMedicine(med)}
                                    className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${selectedMedicine?.id === med.id
                                            ? 'border-orange-400 ring-2 ring-orange-100'
                                            : 'border-gray-100 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={`/images/${med.item_image}`}
                                                alt={med.item_title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/images/Medicine.png';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800 truncate">{med.item_title}</h3>
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                    Edits Pending
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{med.item_brand} • ₹{med.item_price}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                By: {med.added_by} • {med.pending_edits?.submitted_at && new Date(med.pending_edits.submitted_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detail Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4 h-fit">
                            {selectedMedicine ? (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-800">
                                            <i className="fas fa-edit text-orange-500 mr-2"></i>
                                            Edit Details
                                        </h2>
                                        <button
                                            onClick={() => setSelectedMedicine(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {renderDiff('Title', selectedMedicine.item_title, selectedMedicine.pending_edits?.item_title)}
                                        {renderDiff('Brand', selectedMedicine.item_brand, selectedMedicine.pending_edits?.item_brand)}
                                        {renderDiff('Category', selectedMedicine.item_cat, selectedMedicine.pending_edits?.item_cat)}
                                        {renderDiff('Price (₹)', selectedMedicine.item_price, selectedMedicine.pending_edits?.item_price)}
                                        {renderDiff('Stock', selectedMedicine.item_quantity, selectedMedicine.pending_edits?.item_quantity)}
                                        {renderDiff('Tags', selectedMedicine.item_tags, selectedMedicine.pending_edits?.item_tags)}
                                        {renderDiff('Description',
                                            selectedMedicine.item_details?.substring(0, 100) + '...',
                                            selectedMedicine.pending_edits?.item_details?.substring(0, 100) + '...'
                                        )}
                                    </div>

                                    <div className="flex gap-3 mt-6 pt-4 border-t">
                                        <button
                                            onClick={() => handleReject(selectedMedicine.id)}
                                            disabled={processing === selectedMedicine.id}
                                            className="flex-1 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            {processing === selectedMedicine.id ? (
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                            ) : (
                                                <i className="fas fa-times mr-2"></i>
                                            )}
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedMedicine.id)}
                                            disabled={processing === selectedMedicine.id}
                                            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {processing === selectedMedicine.id ? (
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                            ) : (
                                                <i className="fas fa-check mr-2"></i>
                                            )}
                                            Approve
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="fas fa-hand-pointer text-4xl mb-3"></i>
                                    <p>Select an item to view proposed changes</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

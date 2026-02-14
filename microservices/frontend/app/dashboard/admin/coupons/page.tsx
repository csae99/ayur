'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Coupon {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_value: number;
    max_discount: number | null;
    expiry_date: string | null;
    usage_limit: number | null;
    used_count: number;
    is_active: boolean;
    created_at: string;
}

export default function CouponsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: '',
        min_order_value: '0',
        max_discount: '',
        expiry_date: '',
        usage_limit: ''
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

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

        fetchCoupons();
    }, [router]);

    const fetchCoupons = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${window.location.origin}/api/orders/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${window.location.origin}/api/orders/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: formData.code.toUpperCase(),
                    discount_type: formData.discount_type,
                    discount_value: parseFloat(formData.discount_value),
                    min_order_value: parseFloat(formData.min_order_value) || 0,
                    max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                    expiry_date: formData.expiry_date || null,
                    usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create coupon');

            setShowModal(false);
            setFormData({
                code: '', discount_type: 'percentage', discount_value: '',
                min_order_value: '0', max_discount: '', expiry_date: '', usage_limit: ''
            });
            fetchCoupons();
        } catch (error: any) {
            setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleActive = async (id: number, currentState: boolean) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${window.location.origin}/api/orders/coupons/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !currentState })
            });
            fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`${window.location.origin}/api/orders/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const isExpired = (date: string | null) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const filteredCoupons = coupons.filter(coupon => {
        if (filter === 'all') return true;
        if (filter === 'active') return coupon.is_active && !isExpired(coupon.expiry_date);
        if (filter === 'inactive') return !coupon.is_active;
        if (filter === 'expired') return isExpired(coupon.expiry_date);
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard/admin" className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xl">A</div>
                                <span className="text-2xl font-bold text-white">Ayurveda Admin</span>
                            </Link>
                            <div className="hidden md:flex gap-6">
                                <Link href="/dashboard/admin" className="text-white hover:text-indigo-200 transition-colors">Dashboard</Link>
                                <Link href="/dashboard/admin/practitioners" className="text-white hover:text-indigo-200 transition-colors">Practitioners</Link>
                                <Link href="/dashboard/admin/medicines" className="text-white hover:text-indigo-200 transition-colors">Medicines</Link>
                                <Link href="/dashboard/admin/patients" className="text-white hover:text-indigo-200 transition-colors">Patients</Link>
                                <Link href="/dashboard/admin/coupons" className="text-white font-semibold border-b-2 border-white">Coupons</Link>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">Logout</button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">🎟️ Coupon Management</h1>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Create Coupon</button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex gap-2">
                        {(['all', 'active', 'inactive', 'expired'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coupons Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : filteredCoupons.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <p className="text-xl text-gray-500">No coupons found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Discount</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Min Order</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Usage</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Expiry</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCoupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-indigo-600">{coupon.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : `₹${coupon.discount_value}`}
                                            {coupon.max_discount && <span className="text-gray-500 text-sm"> (max ₹{coupon.max_discount})</span>}
                                        </td>
                                        <td className="px-6 py-4">₹{coupon.min_order_value}</td>
                                        <td className="px-6 py-4">
                                            {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                                        </td>
                                        <td className="px-6 py-4">
                                            {coupon.expiry_date
                                                ? new Date(coupon.expiry_date).toLocaleDateString()
                                                : 'No expiry'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isExpired(coupon.expiry_date) ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Expired</span>
                                            ) : coupon.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                                                    className={`px-3 py-1 rounded text-sm ${coupon.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}
                                                >
                                                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="px-3 py-1 rounded text-sm bg-red-100 text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Create New Coupon</h2>
                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    placeholder="e.g., SUMMER20"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="input w-full"
                                        value={formData.discount_type}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="input w-full"
                                        placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                                        value={formData.discount_value}
                                        onChange={e => setFormData({ ...formData, discount_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input w-full"
                                        placeholder="0"
                                        value={formData.min_order_value}
                                        onChange={e => setFormData({ ...formData, min_order_value: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input w-full"
                                        placeholder="Optional"
                                        value={formData.max_discount}
                                        onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input w-full"
                                        placeholder="Unlimited"
                                        value={formData.usage_limit}
                                        onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                    />
                                </div>
                            </div>
                            {formError && <p className="text-red-500 text-sm">{formError}</p>}
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                                    {submitting ? 'Creating...' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

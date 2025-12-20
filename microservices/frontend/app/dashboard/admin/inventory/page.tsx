'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InventoryItem {
    id: number;
    item_title: string;
    item_brand: string;
    item_cat: string;
    item_image: string;
    item_quantity: number;
    item_price: number;
    status: string;
}

interface InventoryStats {
    totalItems: number;
    lowStockItems: number;
    outOfStock: number;
    totalValue: number;
}

export default function AdminInventoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLowStock, setShowLowStock] = useState(false);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newQuantity, setNewQuantity] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
        }

        fetchInventory(token);
        fetchStats(token);
    }, [router]);

    const fetchInventory = async (token: string, lowStock = false, searchTerm = '') => {
        setLoading(true);
        try {
            let url = '/api/catalog/admin/inventory';
            const params = new URLSearchParams();
            if (lowStock) params.append('low_stock', 'true');
            if (searchTerm) params.append('search', searchTerm);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (token: string) => {
        try {
            const res = await fetch('/api/catalog/admin/inventory/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleSearch = () => {
        const token = localStorage.getItem('token');
        fetchInventory(token!, showLowStock, search);
    };

    const handleToggleLowStock = () => {
        const newValue = !showLowStock;
        setShowLowStock(newValue);
        const token = localStorage.getItem('token');
        fetchInventory(token!, newValue, search);
    };

    const handleUpdateStock = async (itemId: number) => {
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/catalog/admin/items/${itemId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: parseInt(newQuantity) })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                setEditingId(null);
                setNewQuantity('');
                fetchInventory(token!, showLowStock, search);
                fetchStats(token!);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
        if (quantity <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-indigo-700 to-purple-900 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/admin" className="text-2xl font-bold text-white">
                            🌿 AyurCare Admin
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link href="/dashboard/admin" className="text-white hover:text-indigo-200">Dashboard</Link>
                            <Link href="/dashboard/admin/orders" className="text-white hover:text-indigo-200">Orders</Link>
                            <Link href="/dashboard/admin/inventory" className="text-white font-semibold">Inventory</Link>
                            <Link href="/dashboard/admin/reports" className="text-white hover:text-indigo-200">Reports</Link>
                            <button onClick={handleLogout} className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Inventory Management</h1>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <p className="text-gray-500 text-sm">Total Products</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalItems}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                            <p className="text-gray-500 text-sm">Low Stock Items</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                            <p className="text-gray-500 text-sm">Out of Stock</p>
                            <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                            <p className="text-gray-500 text-sm">Total Inventory Value</p>
                            <p className="text-3xl font-bold text-green-600">₹{stats.totalValue?.toLocaleString()}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button onClick={handleSearch} className="btn btn-primary">
                            <i className="fas fa-search mr-2"></i> Search
                        </button>
                        <button
                            onClick={handleToggleLowStock}
                            className={`px-4 py-2 rounded-lg font-medium transition ${showLowStock ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {showLowStock ? 'Showing Low Stock' : 'Show Low Stock Only'}
                        </button>
                    </div>
                </div>

                {/* Inventory Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center">
                        <p className="text-gray-500">No products found</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Brand</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => {
                                    const stockStatus = getStockStatus(item.item_quantity);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={`/medicines/${item.item_image}`}
                                                        alt={item.item_title}
                                                        className="w-12 h-12 rounded object-cover"
                                                    />
                                                    <span className="font-medium text-gray-800">{item.item_title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{item.item_brand}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.item_cat}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">₹{item.item_price}</td>
                                            <td className="px-6 py-4">
                                                {editingId === item.id ? (
                                                    <input
                                                        type="number"
                                                        value={newQuantity}
                                                        onChange={(e) => setNewQuantity(e.target.value)}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                        min="0"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="font-bold text-lg">{item.item_quantity}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                                    {stockStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingId === item.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStock(item.id)}
                                                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setNewQuantity('');
                                                            }}
                                                            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(item.id);
                                                            setNewQuantity(item.item_quantity.toString());
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                                    >
                                                        Edit Stock
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

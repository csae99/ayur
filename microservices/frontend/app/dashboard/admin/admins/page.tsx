'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Admin {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    status: string;
    joined_on: string;
}

export default function AdminManagementPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '', firstname: '', lastname: '' });

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

        fetchAdmins(token);
    }, [router]);

    const fetchAdmins = async (token: string) => {
        try {
            const res = await fetch('/api/identity/admin/admins', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAdmins(data);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.username || !newAdmin.password || !newAdmin.firstname || !newAdmin.lastname) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        const token = localStorage.getItem('token');
        setCreating(true);

        try {
            const res = await fetch('/api/identity/admin/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Admin created successfully!' });
                setShowCreateForm(false);
                setNewAdmin({ username: '', password: '', firstname: '', lastname: '' });
                fetchAdmins(token!);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to create admin' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (admin: Admin) => {
        const token = localStorage.getItem('token');
        const newStatus = admin.status === 'active' ? 'inactive' : 'active';

        try {
            const res = await fetch(`/api/identity/admin/admins/${admin.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: data.message });
                fetchAdmins(token!);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update status' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard/admin" className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                        🌿 AyurCare Admin
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/admin" className="text-gray-600 hover:text-green-700">Dashboard</Link>
                        <Link href="/dashboard/admin/profile" className="text-gray-600 hover:text-green-700">My Profile</Link>
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Admin Management</h1>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-plus mr-2"></i> Add New Admin
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Create Admin Form */}
                {showCreateForm && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">Create New Admin</h2>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={newAdmin.firstname}
                                onChange={(e) => setNewAdmin({ ...newAdmin, firstname: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                value={newAdmin.lastname}
                                onChange={(e) => setNewAdmin({ ...newAdmin, lastname: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Username"
                                value={newAdmin.username}
                                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleCreateAdmin}
                                disabled={creating}
                                className="btn btn-primary"
                            >
                                {creating ? 'Creating...' : 'Create Admin'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewAdmin({ username: '', password: '', firstname: '', lastname: '' });
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Admins List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Username</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Joined</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                                                    {admin.firstname?.[0]}{admin.lastname?.[0]}
                                                </div>
                                                <span className="font-medium text-gray-800">
                                                    {admin.firstname} {admin.lastname}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">@{admin.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${admin.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {admin.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(admin.joined_on).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(admin)}
                                                className={`text-sm font-medium ${admin.status === 'active'
                                                    ? 'text-red-600 hover:text-red-700'
                                                    : 'text-green-600 hover:text-green-700'
                                                    }`}
                                            >
                                                {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

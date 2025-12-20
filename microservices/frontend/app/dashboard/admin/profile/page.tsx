'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
    id: number;
    firstname: string;
    lastname: string;
    username: string;
    status: string;
    joined_on: string;
}

export default function AdminProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    const [formData, setFormData] = useState({ firstname: '', lastname: '' });

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

        fetchProfile(token);
    }, [router]);

    const fetchProfile = async (token: string) => {
        try {
            const res = await fetch('/api/identity/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData({ firstname: data.firstname || '', lastname: data.lastname || '' });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/identity/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setProfile(data.user);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        const token = localStorage.getItem('token');
        setSaving(true);

        try {
            const res = await fetch('/api/identity/auth/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setShowPasswordForm(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setPasswordError(data.error || 'Failed to change password');
            }
        } catch (error) {
            setPasswordError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

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
                        <Link href="/dashboard/admin/admins" className="text-gray-600 hover:text-green-700">Manage Admins</Link>
                        <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-12 max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-3xl font-bold">
                            {profile?.firstname?.[0]}{profile?.lastname?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{profile?.firstname} {profile?.lastname}</h2>
                            <p className="text-gray-500">@{profile?.username}</p>
                            <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Administrator
                            </span>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstname}
                                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastname}
                                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={profile?.username || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                            />
                            <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            {isEditing ? (
                                <>
                                    <button onClick={handleSave} disabled={saving} className="btn btn-primary px-6">
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({ firstname: profile?.firstname || '', lastname: profile?.lastname || '' });
                                        }}
                                        className="btn btn-secondary px-6"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary px-6">
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>

                        {!showPasswordForm ? (
                            <button onClick={() => setShowPasswordForm(true)} className="text-green-700 font-medium hover:text-green-800">
                                Click here to change your password
                            </button>
                        ) : (
                            <div className="space-y-4 max-w-md">
                                {passwordError && (
                                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{passwordError}</div>
                                )}
                                <input
                                    type="password"
                                    placeholder="Current Password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                />
                                <input
                                    type="password"
                                    placeholder="Confirm New Password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                                />
                                <div className="flex gap-4">
                                    <button onClick={handlePasswordChange} disabled={saving} className="btn btn-primary px-6">
                                        {saving ? 'Changing...' : 'Change Password'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            setPasswordError('');
                                        }}
                                        className="btn btn-secondary px-6"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

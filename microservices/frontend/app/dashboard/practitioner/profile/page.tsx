'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
    id: number;
    fname: string;
    lname: string;
    username: string;
    email: string;
    phone: string;
    office_name: string;
    address: string;
    bio: string;
    facebook: string;
    twitter: string;
    profile: string;
    professionality: string;
    verified: boolean;
    joined_on: string;
    nida?: string;
    license?: string;
}

export default function PractitionerProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        phone: '',
        office_name: '',
        address: '',
        bio: '',
        facebook: '',
        twitter: '',
        nida: ''
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.role !== 'practitioner') {
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
                setFormData({
                    fname: data.fname || '',
                    lname: data.lname || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    office_name: data.office_name || '',
                    address: data.address || '',
                    bio: data.bio || '',
                    facebook: data.facebook || '',
                    twitter: data.twitter || '',
                    nida: data.nida || ''
                });
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
            // Upload file first if selected
            let documentUrl = profile?.license || '';

            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('document', selectedFile);

                const uploadRes = await fetch('/api/identity/auth/upload-document', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadData
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    documentUrl = uploadResult.url;
                } else {
                    throw new Error('Failed to upload document');
                }
            }

            const res = await fetch('/api/identity/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, license: documentUrl })
            });

            const data = await res.json();

            if (res.ok) {
                setProfile(data.user);
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);

                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...formData }));
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-gradient-to-r from-teal-700 to-teal-900 text-white shadow-lg">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/dashboard/practitioner" className="text-2xl font-bold">
                        🌿 AyurCare Practitioner
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard/practitioner" className="hover:text-teal-200">Dashboard</Link>
                        <Link href="/dashboard/practitioner/appointments" className="hover:text-teal-200">Appointments</Link>
                        <Link href="/dashboard/practitioner/medicines" className="hover:text-teal-200">Medicines</Link>
                        <button onClick={handleLogout} className="bg-white text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-50">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-3xl font-bold">
                            {profile?.fname?.[0]}{profile?.lname?.[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{profile?.fname} {profile?.lname}</h2>
                            <p className="text-gray-500">@{profile?.username}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                    {profile?.professionality || 'Practitioner'}
                                </span>
                                {profile?.verified && (
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="space-y-6">
                        {/* Personal Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={formData.fname}
                                    onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lname}
                                    onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
                        </div>

                        {/* Practice Info */}
                        <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t">Practice Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Office/Clinic Name</label>
                            <input
                                type="text"
                                value={formData.office_name}
                                onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!isEditing}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bio / About</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                disabled={!isEditing}
                                rows={4}
                                placeholder="Tell patients about your experience, specialty, and approach to Ayurvedic medicine..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                            />
                        </div>

                        {/* Verification Info */}
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4">Verification Details</h3>
                            <p className="text-sm text-blue-600 mb-4">
                                Provide these details to get verified and unlock listing features.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">NIDA Number</label>
                                    <input
                                        type="text"
                                        value={formData.nida}
                                        onChange={(e) => setFormData({ ...formData, nida: e.target.value })}
                                        disabled={!isEditing}
                                        placeholder="Enter your NIDA ID"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Document</label>
                                    {isEditing ? (
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white"
                                            accept="image/*,.pdf"
                                        />
                                    ) : (
                                        <div className="py-3 px-4 bg-gray-50 border border-gray-300 rounded-lg text-gray-500">
                                            {profile?.license ? (
                                                <a href={`/api/identity${profile.license}`} target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:underline">
                                                    View Uploaded Document
                                                </a>
                                            ) : (
                                                'No document uploaded'
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t">Social Links</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fab fa-facebook text-blue-600 mr-2"></i>Facebook
                                </label>
                                <input
                                    type="url"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="https://facebook.com/yourpage"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fab fa-twitter text-blue-400 mr-2"></i>Twitter
                                </label>
                                <input
                                    type="url"
                                    value={formData.twitter}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    disabled={!isEditing}
                                    placeholder="https://twitter.com/yourhandle"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                                />
                            </div>
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
                                            if (profile) {
                                                setFormData({
                                                    fname: profile.fname || '',
                                                    lname: profile.lname || '',
                                                    email: profile.email || '',
                                                    phone: profile.phone || '',
                                                    office_name: profile.office_name || '',
                                                    address: profile.address || '',
                                                    bio: profile.bio || '',
                                                    facebook: profile.facebook || '',
                                                    twitter: profile.twitter || '',
                                                    nida: profile.nida || ''
                                                });
                                            }
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
                            <button onClick={() => setShowPasswordForm(true)} className="text-teal-700 font-medium hover:text-teal-800">
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

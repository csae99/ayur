'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    username: string;
    email: string;
    phone: string;
    professionality: string;
    office_name: string;
    address: string;
    bio: string;
    nida: string;
    verified: boolean;
    joined_on: string;
    license: string;
}

export default function PractitionerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
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

        // Fetch practitioner details
        fetch(`http://localhost/api/identity/admin/practitioners/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setPractitioner(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching practitioner:', err);
                setLoading(false);
            });
    }, [router, params.id]);

    const handleVerify = async (verified: boolean) => {
        const token = localStorage.getItem('token');
        setProcessing(true);

        try {
            const res = await fetch(`http://localhost/api/identity/admin/practitioners/${params.id}/verify`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ verified })
            });

            if (res.ok) {
                const updated = await res.json();
                setPractitioner(updated);
                alert(verified ? 'Practitioner verified successfully!' : 'Verification revoked successfully!');
            } else {
                alert('Failed to update verification status');
            }
        } catch (err) {
            console.error('Error updating verification:', err);
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

    if (!practitioner) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
                    <p className="text-xl text-gray-500">Practitioner not found</p>
                    <Link href="/dashboard/admin/practitioners" className="btn btn-primary mt-4">
                        Back to Practitioners
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
                        <Link href="/dashboard/admin/practitioners" className="btn btn-outline text-white border-white hover:bg-white hover:text-indigo-700">
                            <i className="fas fa-arrow-left mr-2"></i> Back to Practitioners
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    {practitioner.fname} {practitioner.lname}
                                </h1>
                                <p className="text-gray-500">@{practitioner.username}</p>
                            </div>
                            {practitioner.verified ? (
                                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2">
                                    <i className="fas fa-check-circle"></i> Verified
                                </span>
                            ) : (
                                <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center gap-2">
                                    <i className="fas fa-clock"></i> Pending Verification
                                </span>
                            )}
                        </div>

                        {/* Profile Information */}
                        <div className="border-t border-gray-200 pt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Full Name</label>
                                    <p className="text-gray-800">{practitioner.fname} {practitioner.lname}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Phone</label>
                                    <p className="text-gray-800">{practitioner.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Email</label>
                                    <p className="text-gray-800">{practitioner.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Username</label>
                                    <p className="text-gray-800">@{practitioner.username}</p>
                                </div>
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Professional Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Office Name</label>
                                    <p className="text-gray-800">{practitioner.office_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Specialization</label>
                                    <p className="text-gray-800">{practitioner.professionality}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">Address</label>
                                    <p className="text-gray-800">{practitioner.address || 'N/A'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-600">Biography</label>
                                    <p className="text-gray-800">{practitioner.bio || 'No biography provided'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">NIDA Number</label>
                                    <p className="text-gray-800 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                                        {practitioner.nida || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Verification Document</label>
                                    {practitioner.license ? (
                                        <a
                                            href={`http://localhost/api/identity${practitioner.license}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-indigo-600 hover:underline mt-1"
                                        >
                                            <i className="fas fa-file-alt mr-2"></i> View Document
                                        </a>
                                    ) : (
                                        <p className="text-gray-500 italic">No document uploaded</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Member Since</label>
                                    <p className="text-gray-800">{new Date(practitioner.joined_on).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Verification Actions</h2>
                            {practitioner.verified ? (
                                <div className="flex flex-col md:flex-row gap-4">
                                    <button
                                        onClick={() => handleVerify(false)}
                                        disabled={processing}
                                        className="btn bg-red-600 hover:bg-red-700 text-white flex-1"
                                    >
                                        {processing ? 'Processing...' : (
                                            <>
                                                <i className="fas fa-times-circle mr-2"></i>
                                                Revoke Verification
                                            </>
                                        )}
                                    </button>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        This practitioner is currently verified and can add medicines
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-4">
                                    <button
                                        onClick={() => handleVerify(true)}
                                        disabled={processing}
                                        className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                                    >
                                        {processing ? 'Processing...' : (
                                            <>
                                                <i className="fas fa-check-circle mr-2"></i>
                                                Verify Practitioner
                                            </>
                                        )}
                                    </button>
                                    <p className="text-sm text-gray-500 flex items-center">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Verifying will allow them to add medicines to the catalog
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

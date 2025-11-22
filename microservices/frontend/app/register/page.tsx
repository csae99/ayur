'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('patient');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        fname: '',
        lname: '',
        phone: '',
        address: '',
        office_name: '',
        professionality: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const endpoint = activeTab === 'patient'
            ? 'http://localhost/api/identity/auth/register/patient'
            : 'http://localhost/api/identity/auth/register/practitioner';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                    </Link>

                    <h2 className="text-3xl font-bold mb-2">Create an account</h2>
                    <p className="text-secondary mb-6">Join us to start your wellness journey</p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                        <button
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${activeTab === 'patient'
                                    ? 'bg-white shadow-sm text-green-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setActiveTab('patient')}
                        >
                            Patient
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition ${activeTab === 'practitioner'
                                    ? 'bg-white shadow-sm text-green-700'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            onClick={() => setActiveTab('practitioner')}
                        >
                            Practitioner
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">First Name</label>
                                <input name="fname" onChange={handleChange} className="input" placeholder="John" required />
                            </div>
                            <div>
                                <label className="label">Last Name</label>
                                <input name="lname" onChange={handleChange} className="input" placeholder="Doe" required />
                            </div>
                        </div>

                        <div>
                            <label className="label">Username</label>
                            <input name="username" onChange={handleChange} className="input" placeholder="johndoe" required />
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input name="email" type="email" onChange={handleChange} className="input" placeholder="john@example.com" required />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input name="password" type="password" onChange={handleChange} className="input" placeholder="••••••••" required />
                        </div>

                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" onChange={handleChange} className="input" placeholder="+91 98765 43210" />
                        </div>

                        <div>
                            <label className="label">Address</label>
                            <input name="address" onChange={handleChange} className="input" placeholder="123 Main St, City" />
                        </div>

                        {activeTab === 'practitioner' && (
                            <>
                                <div>
                                    <label className="label">Office Name</label>
                                    <input name="office_name" onChange={handleChange} className="input" placeholder="Wellness Clinic" required />
                                </div>
                                <div>
                                    <label className="label">Specialization</label>
                                    <input name="professionality" onChange={handleChange} className="input" placeholder="Ayurveda, Panchakarma" required />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full mt-6"
                        >
                            {loading ? 'Creating account...' : `Register as ${activeTab === 'patient' ? 'Patient' : 'Practitioner'}`}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-secondary">
                        Already have an account?{' '}
                        <Link href="/login" className="text-green-700 font-medium hover:underline">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 items-center justify-center p-12">
                <div className="max-w-md text-white">
                    <h2 className="text-4xl font-bold mb-4">
                        Join Our Community
                    </h2>
                    <p className="text-amber-100 text-lg mb-6">
                        Whether you're seeking natural remedies or offering healing services, we're here to support your journey.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-amber-50">Access to authentic Ayurvedic medicines</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-amber-50">Connect with verified practitioners</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-amber-50">Secure and convenient ordering</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

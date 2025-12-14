'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import PractitionerCard from '@/components/appointments/PractitionerCard';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone: string;
    office_name: string;
    address: string;
    profile: string;
    professionality: string;
    bio: string;
}

export default function FindPractitionersPage() {
    const router = useRouter();
    const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error(e);
            }
        }

        fetch('http://localhost/api/identity/practitioners/public')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPractitioners(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching practitioners:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Find Practitioners</h1>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : practitioners.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <i className="fas fa-user-md text-6xl text-gray-200 mb-4"></i>
                        <p className="text-xl text-gray-500">No verified practitioners found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {practitioners.map(p => (
                            <PractitionerCard
                                key={p.id}
                                practitioner={{
                                    id: p.id,
                                    fname: p.fname,
                                    lname: p.lname,
                                    specialization: p.professionality,
                                    professionality: p.professionality, // Map fields
                                    location: p.office_name || p.address || 'Online',
                                    image: p.profile ? `/uploads/${p.profile}` : undefined
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

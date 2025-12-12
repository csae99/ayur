import Link from 'next/link';

interface PatientNavProps {
    username?: string;
    onLogout: () => void;
}

export default function PatientNav({ username, onLogout }: PatientNavProps) {
    return (
        <nav className="bg-white shadow-sm">
            <div className="container py-4">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/patient" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            A
                        </div>
                        <span className="text-2xl font-bold gradient-text">Ayurveda</span>
                    </Link>

                    <div className="flex gap-3 items-center">
                        <span className="text-sm text-secondary">
                            Welcome, <span className="font-semibold text-primary">{username}</span>
                        </span>
                        <Link href="/dashboard/patient" className="btn btn-outline">
                            Dashboard
                        </Link>
                        <Link href="/dashboard/patient/practitioners" className="btn btn-outline">
                            Find Practitioners
                        </Link>
                        <Link href="/dashboard/patient/wishlist" className="btn btn-outline">
                            My Wishlist
                        </Link>
                        <Link href="/dashboard/patient/appointments" className="btn btn-outline">
                            My Appointments
                        </Link>
                        <Link href="/dashboard/patient/medicines" className="btn btn-outline">
                            Browse Medicines
                        </Link>
                        <Link href="/dashboard/patient/cart" className="btn btn-outline">
                            <i className="fas fa-shopping-cart mr-2"></i> Cart
                        </Link>
                        <button onClick={onLogout} className="btn btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

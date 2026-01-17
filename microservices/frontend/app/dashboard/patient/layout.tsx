'use client';

import { useState, ReactNode } from 'react';
import PatientSidebar from '@/components/dashboard/patient/PatientSidebar';
import PatientNav from '@/components/dashboard/patient/PatientNav';

export default function PatientDashboardLayout({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <PatientSidebar isOpen={isSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
                <PatientNav onToggleSidebar={toggleSidebar} />

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

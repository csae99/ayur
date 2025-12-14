import Link from 'next/link';
import React from 'react';

interface Practitioner {
    id: number;
    fname: string;
    lname: string;
    specialization: string;
    professionality: string;
    location: string; // derived from address or office_name
    image?: string;
    rating?: number;
}

interface PractitionerCardProps {
    practitioner: Practitioner;
}

export default function PractitionerCard({ practitioner }: PractitionerCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden relative">
                {practitioner.image ? (
                    <img
                        src={practitioner.image}
                        alt={`${practitioner.fname} ${practitioner.lname}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                        <i className="fas fa-user-md text-4xl"></i>
                    </div>
                )}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-1">
                Dr. {practitioner.fname} {practitioner.lname}
            </h3>

            <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium mb-3">
                {practitioner.professionality || 'General Practitioner'}
            </span>

            <div className="flex items-center text-gray-500 text-sm mb-4">
                <i className="fas fa-map-marker-alt mr-2 text-red-400"></i>
                {practitioner.location || 'Online'}
            </div>

            <Link
                href={`/dashboard/patient/practitioners/${practitioner.id}`}
                className="btn btn-outline w-full"
            >
                View Profile
            </Link>
        </div>
    );
}

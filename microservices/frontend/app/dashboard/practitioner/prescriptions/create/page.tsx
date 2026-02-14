'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Patient {
    id: number;
    fname: string;
    lname: string;
}

interface Medicine {
    name: string;
    dosage: string;
    instructions: string;
    item_id?: number;
}

interface CatalogItem {
    id: number;
    item_title: string;
}

export default function CreatePrescriptionPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>('');
    const [medicines, setMedicines] = useState<Medicine[]>([{ name: '', dosage: '', instructions: '', item_id: undefined }]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Fetch Patients
        fetch(`${window.location.origin}/api/identity/appointments/practitioner`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const uniquePatients = new Map();
                    data.forEach((appt: any) => {
                        if (appt.Patient) {
                            uniquePatients.set(appt.patient_id, { id: appt.patient_id, fname: appt.Patient.fname, lname: appt.Patient.lname });
                        }
                    });
                    setPatients(Array.from(uniquePatients.values()));
                }
            })
            .catch(err => console.error(err));

        // Fetch Catalog Items
        fetch(`${window.location.origin}/api/catalog/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCatalogItems(data);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleAddMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', instructions: '' }]);
    };

    const handleMedicineChange = (index: number, field: keyof Medicine, value: any) => {
        const newMedicines = [...medicines];
        if (field === 'name') {
            // Find item to set ID
            const selectedItem = catalogItems.find(i => i.item_title === value);
            if (selectedItem) {
                newMedicines[index].item_id = selectedItem.id;
            }
            newMedicines[index].name = value;
        } else {
            (newMedicines[index] as any)[field] = value;
        }
        setMedicines(newMedicines);
    };

    const handleRemoveMedicine = (index: number) => {
        const newMedicines = medicines.filter((_, i) => i !== index);
        setMedicines(newMedicines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${window.location.origin}/api/identity/prescriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patient_id: parseInt(selectedPatient),
                    medicines,
                    notes
                })
            });

            if (res.ok) {
                alert('Prescription created successfully!');
                router.push('/dashboard/practitioner/prescriptions');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to submit prescription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="container py-4 flex items-center justify-between">
                    <Link href="/dashboard/practitioner" className="font-bold text-xl text-green-800">Ayurveda Practitioner</Link>
                    <Link href="/dashboard/practitioner/prescriptions" className="text-gray-600 hover:text-green-700">Back to List</Link>
                </div>
            </nav>

            <div className="container py-12 max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-green-700 p-6 text-white">
                        <h1 className="text-2xl font-bold">Write New Prescription</h1>
                        <p className="opacity-90">Select a patient and prescribe medicines.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="mb-6">
                            <label className="block text-gray-700 font-bold mb-2">Select Patient</label>
                            <select
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                required
                            >
                                <option value="">-- Choose a patient --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.fname} {p.lname} (ID: {p.id})</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Populated from your appointment history.</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-bold mb-2">Medicines</label>
                            <div className="space-y-4">
                                {medicines.map((med, index) => (
                                    <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex-1 space-y-3">
                                            <select
                                                className="w-full p-2 border rounded bg-white"
                                                value={med.name}
                                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Select Medicine --</option>
                                                {catalogItems.map(item => (
                                                    <option key={item.id} value={item.item_title}>{item.item_title}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Dosage (e.g. 500mg)"
                                                    className="w-1/2 p-2 border rounded"
                                                    value={med.dosage}
                                                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Instructions (e.g. Twice daily)"
                                                    className="w-1/2 p-2 border rounded"
                                                    value={med.instructions}
                                                    onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        {medicines.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMedicine(index)}
                                                className="text-red-500 hover:text-red-700 mt-2"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMedicine}
                                className="mt-3 text-green-700 font-medium hover:underline flex items-center gap-1"
                            >
                                <i className="fas fa-plus-circle"></i> Add Another Medicine
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 font-bold mb-2">Additional Notes</label>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32"
                                placeholder="Dietary advice, lifestyle changes, etc..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Link href="/dashboard/practitioner/prescriptions" className="btn btn-outline">Cancel</Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Saving...' : 'Create Prescription'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

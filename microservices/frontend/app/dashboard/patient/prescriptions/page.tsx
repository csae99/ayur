'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Medicine {
    name: string;
    dosage: string;
    instructions: string;
    item_id?: number;
}

interface Prescription {
    id: number;
    practitioner_id: number;
    created_at: string;
    Practitioner: {
        fname: string;
        lname: string;
        office_name: string;
    };
    medicines: Medicine[];
    notes: string;
}

export default function PatientPrescriptionsPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [addingToCart, setAddingToCart] = useState<number[]>([]); // array of item_ids
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCards, setExpandedCards] = useState<number[]>([]);
    const [printingId, setPrintingId] = useState<number | null>(null);
    const ITEMS_PER_PAGE = 5;

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

        fetch(`${window.location.origin}/api/identity/prescriptions/patient`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch');
                return res.json();
            })
            .then(data => {
                setPrescriptions(data);
                if (data.length > 0) {
                    setExpandedCards([data[0].id]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        const afterPrint = () => setPrintingId(null);
        window.addEventListener('afterprint', afterPrint);
        return () => window.removeEventListener('afterprint', afterPrint);
    }, [router]);

    const handleAddToCart = async (medicine: Medicine) => {
        if (!medicine.item_id) {
            alert('This medicine is not linked to a catalog item.');
            return;
        }

        const token = localStorage.getItem('token');
        setAddingToCart(prev => [...prev, medicine.item_id as number]);

        try {
            const response = await fetch(`${window.location.origin}/api/orders/cart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: medicine.item_id,
                    quantity: 1
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: `${medicine.name} added to cart!` });
            } else {
                const err = await response.json();
                setNotification({ type: 'error', message: err.message || 'Failed to add to cart' });
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Network error' });
        } finally {
            setTimeout(() => setNotification(null), 3000);
            setAddingToCart(prev => prev.filter(id => id !== medicine.item_id));
        }
    };

    const handleAddAllToCart = async (prescription: Prescription) => {
        const token = localStorage.getItem('token');
        const validMedicines = prescription.medicines.filter(m => m.item_id);
        
        if (validMedicines.length === 0) {
            setNotification({ type: 'error', message: 'No catalog-linked medicines found to add.' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        const ids = validMedicines.map(m => m.item_id as number);
        setAddingToCart(prev => [...prev, ...ids]);

        try {
            const promises = validMedicines.map(m =>
                fetch(`${window.location.origin}/api/orders/cart/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ item_id: m.item_id, quantity: 1 })
                })
            );

            await Promise.all(promises);
            setNotification({ type: 'success', message: `Added ${validMedicines.length} items to cart!` });
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Failed to add some items.' });
        } finally {
            setTimeout(() => setNotification(null), 3000);
            setAddingToCart(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const toggleCard = (id: number) => {
        setExpandedCards(prev => 
            prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
        );
    };

    const handlePrintSingle = (id: number) => {
        setPrintingId(id);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Rendering Skeleton Loader
    const SkeletonLoader = () => (
        <div className="space-y-6">
            {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center h-20">
                        <div className="space-y-3 w-1/3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                            {[1, 2].map(j => (
                                <div key={j} className="h-16 bg-gray-50 rounded-lg w-full"></div>
                            ))}
                        </div>
                        <div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                            <div className="h-24 bg-yellow-50 rounded-lg w-full"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const totalPages = Math.ceil(prescriptions.length / ITEMS_PER_PAGE);
    const displayedPrescriptions = prescriptions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-50 relative print:bg-white">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in print:hidden ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="container mx-auto px-4 py-8 print:py-0 print:px-0">
                <div className={`flex justify-between items-center mb-8 print:mb-4 ${printingId !== null ? 'print:hidden' : ''}`}>
                    <h1 className="text-3xl font-bold text-gray-800 print:text-black">My Prescriptions</h1>
                </div>

                {loading ? (
                    <SkeletonLoader />
                ) : prescriptions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 print:hidden flex flex-col items-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-green-50 flex items-center justify-center">
                           <i className="fas fa-file-medical text-4xl text-green-300"></i>
                        </div>
                        <p className="text-xl text-gray-800 font-bold mb-2">No prescriptions yet</p>
                        <p className="text-gray-500 mb-6 max-w-sm">When your practitioner writes a prescription during a consultation, it will securely appear here.</p>
                        <Link href="/dashboard/patient/practitioners">
                            <button className="btn btn-outline border-green-600 text-green-600 hover:bg-green-50">
                                <i className="fas fa-search mr-2"></i> Find a Practitioner
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {displayedPrescriptions.map((p, pIndex) => (
                            <div key={p.id} className={`bg-white rounded-xl shadow-md border-l-4 border-green-600 overflow-hidden relative print:shadow-none print:border-l-0 print:border print:border-gray-300 print:break-inside-avoid print:mb-8 ${(printingId !== null && printingId !== p.id) ? 'print:hidden' : ''}`}>
                                
                                {/* Watermark for print */}
                                <div className="hidden print:block absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                                    <i className="fas fa-leaf text-[20rem]"></i>
                                </div>

                                <div 
                                    className="bg-gradient-to-r from-green-50 to-white px-6 py-5 border-b border-green-100 flex justify-between items-center cursor-pointer hover:bg-green-50/50 transition-colors print:bg-white print:border-b-2 print:border-gray-800"
                                    onClick={() => toggleCard(p.id)}
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl print:hidden shadow-sm transition-transform duration-200">
                                            <i className="fas fa-user-md"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-green-800 text-xl print:text-black hover:text-green-900 transition-colors">Dr. {p.Practitioner.fname} {p.Practitioner.lname}</h3>
                                            <p className="text-sm text-green-600 bg-green-100/50 inline-block px-2 rounded font-medium print:bg-transparent print:px-0 print:text-gray-700">
                                                <i className="fas fa-clinic-medical mr-1 text-xs"></i> {p.Practitioner.office_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePrintSingle(p.id); }}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 text-green-600 hover:bg-green-50 print:hidden transition-colors"
                                            title="Print this prescription"
                                        >
                                            <i className="fas fa-print"></i>
                                        </button>
                                        <span className="bg-white px-3 py-1 rounded-full text-gray-500 text-sm font-semibold border border-gray-100 shadow-sm print:shadow-none print:border-none print:bg-transparent">
                                            <i className="far fa-calendar-alt mr-1"></i> {new Date(p.created_at).toLocaleDateString()}
                                        </span>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100 text-gray-400 print:hidden transition-transform duration-200">
                                            <i className={`fas fa-chevron-${expandedCards.includes(p.id) ? 'up' : 'down'}`}></i>
                                        </div>
                                    </div>
                                </div>
                                <div className={`p-6 print:p-4 z-10 relative print:block ${expandedCards.includes(p.id) ? 'block' : 'hidden'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex justify-between items-end mb-4 border-b pb-2">
                                                <h4 className="font-bold text-gray-700 text-lg">Prescribed Medicines</h4>
                                                
                                                {/* Add All To Cart Button */}
                                                <button 
                                                    onClick={() => handleAddAllToCart(p)}
                                                    className="text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full transition-colors print:hidden flex items-center gap-1"
                                                >
                                                    <i className="fas fa-cart-arrow-down"></i> Add All to Cart
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {p.medicines.map((m, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50/80 border border-gray-100 rounded-lg hover:shadow-sm transition-all print:border-b print:bg-transparent print:border-gray-200 print:rounded-none print:p-2">
                                                        <div className="flex-1">
                                                            <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                                <i className="fas fa-pills text-green-500 text-sm print:text-black"></i> {m.name}
                                                            </p>
                                                            <div className="pl-6 mt-1 space-y-1">
                                                                <p className="text-sm text-gray-600 font-medium whitespace-nowrap">
                                                                    <i className="fas fa-vial text-gray-400 w-4 text-center mr-1"></i> Dose: {m.dosage}
                                                                </p>
                                                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                                                    <i className="fas fa-info-circle text-gray-400 w-4 text-center mr-1"></i> {m.instructions}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto flex justify-end print:hidden">
                                                            {m.item_id ? (
                                                                <button
                                                                    onClick={() => handleAddToCart(m)}
                                                                    disabled={addingToCart.includes(m.item_id)}
                                                                    className={`btn btn-sm flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm ${addingToCart.includes(m.item_id) ? 'bg-green-700 text-white cursor-not-allowed' : 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white transition-colors'}`}
                                                                >
                                                                    {addingToCart.includes(m.item_id) ? (
                                                                        <>
                                                                           <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                           Adding
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                           <i className="fas fa-cart-plus"></i> Add
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Unavailable</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 text-lg mb-4 border-b pb-2 flex items-center gap-2">
                                                <i className="fas fa-user-edit text-gray-400"></i> Doctor's Notes
                                            </h4>
                                            <div className="bg-amber-50/80 p-5 rounded-lg border border-amber-200 text-gray-800 shadow-inner relative print:bg-transparent print:border-gray-300">
                                                <i className="fas fa-quote-left text-amber-200 absolute top-2 left-2 text-3xl opacity-50 print:hidden"></i>
                                                <div className="relative z-10 pl-4 font-medium leading-relaxed italic text-gray-700">
                                                    {p.notes || <span className="text-gray-400">No additional notes provided.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {totalPages > 1 && (
                            <div className={`flex justify-center items-center gap-4 mt-8 print:hidden ${printingId !== null ? 'print:hidden' : ''}`}>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    <i className="fas fa-chevron-left mr-2"></i> Previous
                                </button>
                                <span className="text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                >
                                    Next <i className="fas fa-chevron-right ml-2"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

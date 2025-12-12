'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Medicine {
    id: number;
    item_title: string;
    item_description: string;
    item_price: number;
    item_image: string;
    added_by: string;
    item_quantity: number;
    item_cat: string;
}

export default function BrowseMedicinesPage() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                if (parsed.role !== 'patient') {
                    router.replace('/dashboard');
                    return;
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }

        fetch('http://localhost/api/catalog/items', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMedicines(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch medicines:', err);
                setLoading(false);
            });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const handleAddToCart = async (medicine: Medicine) => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setAddingToCart(medicine.id);

        try {
            const response = await fetch('http://localhost/api/orders/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: medicine.id,
                    quantity: 1
                })
            });

            if (response.ok) {
                setNotification({
                    type: 'success',
                    message: `${medicine.item_title} added to cart!`
                });
                setTimeout(() => setNotification(null), 3000);
            } else {
                const error = await response.json();
                setNotification({
                    type: 'error',
                    message: error.message || 'Failed to add item to cart'
                });
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            setNotification({
                type: 'error',
                message: 'Network error. Please try again.'
            });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    <div className="flex items-center gap-3">
                        {notification.type === 'success' ? (
                            <i className="fas fa-check-circle"></i>
                        ) : (
                            <i className="fas fa-exclamation-circle"></i>
                        )}
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Browse Medicines</h1>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : medicines.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-500">No medicines available in the catalog.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {medicines.map((medicine) => (
                            <Link href={`/catalog/${medicine.id}`} key={medicine.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col group text-left">
                                <div className="h-48 bg-gray-200 relative overflow-hidden">
                                    {medicine.item_image ? (
                                        <img
                                            src={`/images/${medicine.item_image}`}
                                            alt={medicine.item_title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/images/Medicine.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <i className="fas fa-pills text-4xl"></i>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className="bg-white/90 backdrop-blur text-green-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                            ₹{medicine.item_price}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition">{medicine.item_title}</h3>
                                    </div>
                                    <div className="mb-3">
                                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                            {medicine.item_cat}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                                        {medicine.item_description}
                                    </p>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs text-gray-500">
                                                By: {medicine.added_by}
                                            </span>
                                            {medicine.item_quantity > 0 ? (
                                                <span className="text-green-600 text-xs font-medium">In Stock</span>
                                            ) : (
                                                <span className="text-red-600 text-xs font-medium">Out of Stock</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleAddToCart(medicine);
                                            }}
                                            disabled={addingToCart === medicine.id || medicine.item_quantity === 0}
                                            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 z-10 relative"
                                        >
                                            {addingToCart === medicine.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Adding...
                                                </>
                                            ) : (
                                                medicine.item_quantity === 0 ? 'Out of Stock' : 'Add to Cart'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface Item {
    id: number;
    item_title: string;
    item_price: number;
    item_image: string;
    item_cat: string;
    item_quantity: number;
}

export default function WishlistPage() {
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState<Item[]>([]);
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
            setUser(JSON.parse(userData));
        }

        fetchWishlist(token);
    }, [router]);

    const fetchWishlist = async (token: string) => {
        try {
            // 1. Get Wishlist IDs
            const resIds = await fetch(`${window.location.origin}/api/orders/wishlist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!resIds.ok) throw new Error('Failed to fetch wishlist');
            const itemIds: number[] = await resIds.json();

            if (itemIds.length === 0) {
                setWishlistItems([]);
                setLoading(false);
                return;
            }

            // 2. Fetch Details for each item
            // Optimization: Could add batch endpoint to Catalog, but Promise.all is ok for now
            const items = await Promise.all(
                itemIds.map(async (id) => {
                    try {
                        const res = await fetch(`${window.location.origin}/api/catalog/items/${id}`);
                        if (res.ok) return await res.json();
                        return null;
                    } catch (e) {
                        return null;
                    }
                })
            );

            setWishlistItems(items.filter(i => i !== null) as Item[]);
        } catch (error) {
            console.error('Error loading wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (itemId: number) => {
        setWishlistItems(prev => prev.filter(i => i.id !== itemId));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Wishlist</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
                        <i className="far fa-heart text-5xl text-gray-300 mb-4"></i>
                        <p className="text-xl text-gray-500 mb-6">Your wishlist is empty</p>
                        <Link href="/dashboard/patient/medicines" className="btn btn-primary">
                            Browse Medicines
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlistItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
                                <button
                                    onClick={() => { /* Navigation handled by Link below, but this is top-right action */ }}
                                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-sm"
                                >
                                    <WishlistButton
                                        itemId={item.id}
                                        initialInWishlist={true}
                                        onToggle={(val) => !val && handleRemove(item.id)}
                                    />
                                </button>

                                <Link href={`/catalog/${item.id}`} className="block">
                                    <div className="h-48 bg-gray-200">
                                        {item.item_image ? (
                                            <img src={`/images/${item.item_image}`} alt={item.item_title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <i className="fas fa-pills text-4xl"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-gray-800 mb-1">{item.item_title}</h3>
                                            <span className="font-bold text-green-700">₹{item.item_price}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">{item.item_cat}</p>
                                        <button className="btn btn-outline w-full text-sm">
                                            View Details
                                        </button>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

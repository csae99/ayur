'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Item {
    id: number;
    item_title: string;
    item_details: string;
    item_price: number;
    item_quantity: number;
    item_cat: string;
    item_image: string;
}

export default function CatalogPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item =>
        item.item_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        // Check login status
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        // Fetch items
        fetch('http://localhost/api/catalog/items')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching items:', err);
                setLoading(false);
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const handleAddToCart = async (itemId: number, itemTitle: string) => {
        // Check if user is logged in
        if (!isLoggedIn) {
            setNotification({ type: 'error', message: 'Please login to add items to cart' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!user.id) {
            setNotification({ type: 'error', message: 'User information not found. Please login again.' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setAddingToCart(itemId);

        try {
            const response = await fetch('http://localhost/api/orders/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: itemId,
                    order_quantity: 1
                })
            });

            if (response.ok) {
                setNotification({
                    type: 'success',
                    message: `${itemTitle} added to cart! View in My Orders.`
                });
                setTimeout(() => setNotification(null), 4000);
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-50">
            {/* Notification Banner */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg animate-slide-in ${notification.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    <div className="flex items-center gap-3">
                        {notification.type === 'success' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <p className="font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                            🌿 AyurCare
                        </Link>
                        <div className="flex gap-4">
                            <Link href="/catalog" className="text-green-700 hover:text-green-800 font-medium">
                                Catalog
                            </Link>
                            {isLoggedIn ? (
                                <>
                                    <Link href="/dashboard" className="text-green-700 hover:text-green-800 font-medium">
                                        My Orders
                                    </Link>
                                    <button onClick={handleLogout} className="text-green-700 hover:text-green-800 font-medium">
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="text-green-700 hover:text-green-800 font-medium">
                                        Login
                                    </Link>
                                    <Link href="/register" className="btn btn-primary">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-16">
                <div className="container">
                    <h1 className="text-4xl font-bold mb-2">Ayurvedic Medicines</h1>
                    <p className="text-green-100 text-lg">
                        Discover our collection of authentic, natural remedies
                    </p>
                </div>
            </div>

            {/* Catalog */}
            <div className="container py-12">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-md mx-auto">
                        <input
                            type="text"
                            placeholder="Search medicines..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                        />
                        <svg className="w-6 h-6 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="card group cursor-pointer">
                                <div className="aspect-square bg-gradient-to-br from-green-50 to-amber-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={`/images/${item.item_image}`}
                                        alt={item.item_title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/Medicine.png';
                                        }}
                                    />
                                </div>

                                <div className="mb-2">
                                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                        {item.item_cat}
                                    </span>
                                </div>

                                <h3 className="text-xl font-semibold mb-2 group-hover:text-green-700 transition">
                                    {item.item_title}
                                </h3>

                                <p className="text-sm text-secondary mb-3 line-clamp-2">
                                    {item.item_details}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div>
                                        <span className="text-2xl font-bold text-green-700">
                                            ₹{item.item_price}
                                        </span>
                                    </div>
                                    <div className="text-sm text-tertiary">
                                        {item.item_quantity > 0 ? (
                                            <span className="text-green-600 font-medium">In Stock</span>
                                        ) : (
                                            <span className="text-red-600 font-medium">Out of Stock</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAddToCart(item.id, item.item_title)}
                                    disabled={addingToCart === item.id || item.item_quantity === 0}
                                    className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingToCart === item.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Adding...
                                        </span>
                                    ) : (
                                        item.item_quantity === 0 ? 'Out of Stock' : 'Add to Cart'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && filteredItems.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-xl text-secondary">No medicines found matching "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </div>
    );
}

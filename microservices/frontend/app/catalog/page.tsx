'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WishlistButton from '@/components/wishlist/WishlistButton';
import FilterSidebar from '@/components/catalog/FilterSidebar';

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
    const [filters, setFilters] = useState({ category: 'All', minPrice: 0, maxPrice: 2000 });

    useEffect(() => {
        // Check login status
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        fetchItems();
    }, [filters]); // Re-fetch on filter change

    const fetchItems = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('q', searchTerm);
            if (filters.category !== 'All') queryParams.append('category', filters.category);
            queryParams.append('min_price', filters.minPrice.toString());
            queryParams.append('max_price', filters.maxPrice.toString());

            const res = await fetch(`http://localhost/api/catalog/items?${queryParams.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error('Error fetching items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchItems();
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
    };

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
                <div className="container px-6">
                    <h1 className="text-4xl font-bold mb-2">Ayurvedic Medicines</h1>
                    <p className="text-green-100 text-lg">
                        Discover our collection of authentic, natural remedies
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <FilterSidebar onFilterChange={handleFilterChange} />
                    </aside>

                    {/* Product List */}
                    <div className="flex-1">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mb-8">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition"
                                />
                                <button type="submit" className="absolute right-2 top-2 btn btn-primary py-1 px-4 text-sm">
                                    Search
                                </button>
                                <svg className="w-6 h-6 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </form>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                                <p className="text-xl text-secondary">No medicines found matching your criteria.</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setFilters({ category: 'All', minPrice: 0, maxPrice: 2000 }); }}
                                    className="mt-4 text-green-700 font-medium hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map((item) => (
                                    <Link href={`/catalog/${item.id}`} key={item.id} className="card group cursor-pointer block hover:shadow-lg transition-all duration-300 relative bg-white rounded-xl overflow-hidden border border-gray-100">
                                        <div className="aspect-square bg-gradient-to-br from-green-50 to-amber-50 relative">
                                            <img
                                                src={`/images/${item.item_image}`}
                                                alt={item.item_title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/images/Medicine.png';
                                                }}
                                            />
                                            {/* Wishlist Button */}
                                            <div className="absolute top-2 right-2 z-20">
                                                <WishlistButton
                                                    itemId={item.id}
                                                    className="bg-white/90 backdrop-blur p-2 rounded-full shadow-sm hover:scale-110 transition-transform"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="mb-2">
                                                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                    {item.item_cat}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-green-700 transition line-clamp-1">
                                                {item.item_title}
                                            </h3>

                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[40px]">
                                                {item.item_details}
                                            </p>

                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <span className="text-xl font-bold text-green-700">
                                                    ₹{item.item_price}
                                                </span>
                                                <div className="text-sm">
                                                    {item.item_quantity > 0 ? (
                                                        <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">In Stock</span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAddToCart(item.id, item.item_title);
                                                }}
                                                disabled={addingToCart === item.id || item.item_quantity === 0}
                                                className="btn btn-primary w-full mt-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed z-10 relative"
                                            >
                                                {addingToCart === item.id ? 'Adding...' : item.item_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import StarRating from '@/components/reviews/StarRating';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import WishlistButton from '@/components/wishlist/WishlistButton';
import TranslatedText from '@/components/TranslatedText';

interface Item {
    id: number;
    item_title: string;
    item_details: string;
    item_price: number;
    item_quantity: number;
    item_cat: string;
    item_image: string;
}

interface Review {
    id: number;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
    const [item, setItem] = useState<Item | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const checkLoginStatus = () => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    };

    const fetchProductData = async () => {
        try {
            setLoading(true);

            // Fetch item details
            const itemRes = await fetch(`http://localhost/api/catalog/items/${params.id}`);
            if (!itemRes.ok) {
                if (itemRes.status === 404) return notFound();
                throw new Error('Failed to fetch item');
            }
            const itemData = await itemRes.json();
            setItem(itemData);

            // Fetch reviews
            fetchReviews();
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const reviewRes = await fetch(`http://localhost/api/catalog/items/${params.id}/reviews`);
            if (reviewRes.ok) {
                const reviewData = await reviewRes.json();
                setReviews(reviewData.reviews);
                setAverageRating(parseFloat(reviewData.average));
                setReviewCount(reviewData.count);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    useEffect(() => {
        checkLoginStatus();
        fetchProductData();

        // Listen for login/logout events if implemented
        window.addEventListener('storage', checkLoginStatus);
        return () => window.removeEventListener('storage', checkLoginStatus);
    }, [params.id]);

    const handleAddToCart = async () => {
        if (!isLoggedIn) {
            setNotification({ type: 'error', message: 'Please login to add to cart' });
            return;
        }

        if (!item) return;

        setAddingToCart(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost/api/orders/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    item_id: item.id,
                    quantity: 1
                })
            });

            if (response.ok) {
                setNotification({ type: 'success', message: 'Added to cart successfully!' });
            } else {
                setNotification({ type: 'error', message: 'Failed to add to cart' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'Network error' });
        } finally {
            setAddingToCart(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
            </div>
        );
    }

    if (!item) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification Banner */}
            {notification && (
                <div className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    } text-white animate-slide-in`}>
                    {notification.message}
                </div>
            )}

            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                        🌿 AyurCare
                    </Link>
                    <div className="flex items-center gap-6">
                        {isLoggedIn ? (
                            <>
                                <Link href="/dashboard/patient" className="text-gray-600 hover:text-green-700 font-medium">
                                    Dashboard
                                </Link>
                                <Link href="/dashboard/patient/medicines" className="text-gray-600 hover:text-green-700 font-medium">
                                    Browse Medicines
                                </Link>
                                <Link href="/dashboard/patient/cart" className="text-gray-600 hover:text-green-700 font-medium flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Cart
                                </Link>
                            </>
                        ) : (
                            <Link href="/catalog" className="text-gray-600 hover:text-green-700 flex items-center gap-2">
                                ← Back to Catalog
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-10">
                <div className="grid md:grid-cols-2 gap-10">
                    {/* Left: Image */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm h-fit">
                        <div className="aspect-square bg-gradient-to-br from-green-50 to-amber-50 rounded-xl overflow-hidden flex items-center justify-center">
                            <img
                                src={`/images/${item.item_image}`}
                                alt={item.item_title}
                                className="w-full h-full object-cover hover:scale-105 transition duration-500"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/Medicine.png';
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <TranslatedText text={item.item_cat} />
                            </span>
                            {item.item_quantity > 0 ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                    In Stock
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                    Out of Stock
                                </span>
                            )}
                        </div>
                        <div className="absolute top-4 right-4 z-10">
                            <WishlistButton itemId={item.id} className="bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            <TranslatedText text={item.item_title} />
                        </h1>

                        {/* Rating Summary */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100">
                                <span className="font-bold text-yellow-700 mr-1">{averageRating}</span>
                                <StarRating rating={Math.round(averageRating)} size="sm" />
                            </div>
                            <span className="text-gray-500 text-sm">({reviewCount} reviews)</span>
                        </div>

                        <div className="text-3xl font-bold text-green-700 mb-6">₹{item.item_price}</div>

                        <div className="prose prose-green max-w-none text-gray-600 mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p><TranslatedText text={item.item_details} /></p>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={addingToCart || item.item_quantity === 0}
                            className="btn btn-primary w-full md:w-auto px-8 py-3 text-lg mb-10 disabled:opacity-50"
                        >
                            {addingToCart ? 'Adding...' : item.item_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>

                        <hr className="border-gray-200 mb-10" />

                        {/* Reviews Section */}
                        <div id="reviews">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                                {isLoggedIn && (
                                    <button
                                        onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-green-700 hover:text-green-800 font-medium"
                                    >
                                        Write a Review
                                    </button>
                                )}
                            </div>

                            <div className="mb-10">
                                <ReviewList reviews={reviews} />
                            </div>

                            {isLoggedIn ? (
                                <div id="review-form">
                                    <ReviewForm itemId={item.id} onReviewSubmitted={fetchReviews} />
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-xl text-center">
                                    <p className="text-gray-600 mb-4">Please login to write a review.</p>
                                    <Link href="/login" className="btn btn-outline">
                                        Login to Review
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface Product {
    id: number;
    item_title: string;
    item_description: string;
    item_price: number;
    item_image: string;
    item_quantity: number;
    item_cat: string;
}

interface CartItem {
    id: number;
    cart_id: number;
    item_id: number;
    quantity: number;
    added_at: string;
    product: Product | null;
}

interface Cart {
    id: number;
    user_id: number;
    CartItems: CartItem[];
}

interface PriceBreakdown {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
}

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<Cart | null>(null);
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

        fetchCart();
    }, [router]);

    const fetchCart = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost/api/orders/cart', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setCart(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch cart:', err);
                setLoading(false);
            });
    };

    const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
        const token = localStorage.getItem('token');
        try {
            await fetch('http://localhost/api/orders/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ item_id: itemId, quantity: newQuantity })
            });
            fetchCart();
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const handleRemoveItem = async (itemId: number) => {
        const token = localStorage.getItem('token');
        try {
            await fetch('http://localhost/api/orders/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ item_id: itemId })
            });
            fetchCart();
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    const calculatePricing = (): PriceBreakdown => {
        if (!cart || !cart.CartItems) {
            return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
        }

        const subtotal = cart.CartItems.reduce((sum, item) => {
            const price = item.product?.item_price || 0;
            return sum + (price * item.quantity);
        }, 0);

        const shipping = subtotal >= 500 ? 0 : 50;
        const tax = subtotal * 0.05; // 5% GST
        const total = subtotal + shipping + tax;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            total: Math.round(total * 100) / 100
        };
    };

    const pricing = calculatePricing();

    return (
        <div className="min-h-screen bg-gray-50">
            <PatientNav username={user?.username} onLogout={handleLogout} />

            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                    </div>
                ) : !cart || cart.CartItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <div className="text-6xl mb-4 text-gray-300">
                            <i className="fas fa-shopping-cart"></i>
                        </div>
                        <p className="text-xl text-gray-500 mb-4">Your cart is empty.</p>
                        <Link href="/dashboard/patient/medicines" className="btn btn-primary">Browse Medicines</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Cart Items ({cart.CartItems.length})
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {cart.CartItems.map((item) => (
                                        <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex gap-4">
                                                {/* Product Image */}
                                                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.product?.item_image ? (
                                                        <img
                                                            src={`/images/${item.product.item_image}`}
                                                            alt={item.product.item_title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/Medicine.png';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <i className="fas fa-pills text-3xl"></i>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg text-gray-800 mb-1">
                                                        {item.product?.item_title || `Item #${item.item_id}`}
                                                    </h3>
                                                    {item.product?.item_cat && (
                                                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mb-2">
                                                            {item.product.item_cat}
                                                        </span>
                                                    )}
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                        {item.product?.item_description || 'No description available'}
                                                    </p>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xl font-bold text-green-700">
                                                            ₹{item.product?.item_price || 0}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            per item
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Quantity & Actions */}
                                                <div className="flex flex-col items-end gap-3">
                                                    <div className="flex items-center border border-gray-300 rounded-lg">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.item_id, item.quantity - 1)}
                                                            className="px-3 py-2 hover:bg-gray-100 text-gray-700 font-semibold"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            −
                                                        </button>
                                                        <span className="px-4 py-2 font-medium text-gray-800 min-w-[3rem] text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.item_id, item.quantity + 1)}
                                                            className="px-3 py-2 hover:bg-gray-100 text-gray-700 font-semibold"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 mb-1">Subtotal</p>
                                                        <p className="text-lg font-bold text-gray-800">
                                                            ₹{((item.product?.item_price || 0) * item.quantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.item_id)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                                    >
                                                        <i className="fas fa-trash"></i> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Price Summary
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Subtotal ({cart.CartItems.length} items)</span>
                                        <span className="font-semibold">₹{pricing.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span className="flex items-center gap-2">
                                            Shipping
                                            {pricing.shipping === 0 && (
                                                <span className="text-xs text-green-600 font-medium">FREE</span>
                                            )}
                                        </span>
                                        <span className="font-semibold">
                                            {pricing.shipping === 0 ? '₹0.00' : `₹${pricing.shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    {pricing.subtotal < 500 && (
                                        <p className="text-xs text-gray-500 -mt-2">
                                            Add ₹{(500 - pricing.subtotal).toFixed(2)} more for FREE shipping
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span>Tax (GST 5%)</span>
                                        <span className="font-semibold">₹{pricing.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-4 flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-800">Total</span>
                                        <span className="text-2xl font-bold text-green-700">
                                            ₹{pricing.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-6 pb-6">
                                    <Link
                                        href="/dashboard/patient/checkout"
                                        className="btn btn-primary w-full text-center py-3 text-lg font-semibold"
                                    >
                                        Proceed to Checkout
                                        <i className="fas fa-arrow-right ml-2"></i>
                                    </Link>
                                    <Link
                                        href="/dashboard/patient/medicines"
                                        className="block text-center mt-3 text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        <i className="fas fa-arrow-left mr-2"></i> Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';

interface CartItem {
    id: number;
    cart_id: number;
    item_id: number;
    quantity: number;
    added_at: string;
}

interface Cart {
    id: number;
    user_id: number;
    CartItems: CartItem[];
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
                        <p className="text-xl text-gray-500 mb-4">Your cart is empty.</p>
                        <Link href="/dashboard/patient/medicines" className="btn btn-primary">Browse Medicines</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 space-y-6">
                            {cart.CartItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            <i className="fas fa-pills text-2xl"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">Item ID: {item.item_id}</h3>
                                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center border border-gray-200 rounded-lg">
                                            <button
                                                onClick={() => handleUpdateQuantity(item.item_id, item.quantity - 1)}
                                                className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                                            >-</button>
                                            <span className="px-3 py-1 font-medium text-gray-800">{item.quantity}</span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.item_id, item.quantity + 1)}
                                                className="px-3 py-1 hover:bg-gray-50 text-gray-600"
                                            >+</button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.item_id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-gray-50 p-6 flex justify-between items-center">
                            <Link href="/dashboard/patient/medicines" className="text-gray-600 hover:text-gray-800 font-medium">
                                <i className="fas fa-arrow-left mr-2"></i> Continue Shopping
                            </Link>
                            <Link href="/dashboard/patient/checkout" className="btn btn-primary px-8 py-3 text-lg">
                                Proceed to Checkout <i className="fas fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

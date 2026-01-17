'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PatientNav from '@/components/dashboard/patient/PatientNav';
import TranslatedText from '@/components/TranslatedText';

interface Address {
    id?: number;
    full_name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}

interface Product {
    id: number;
    item_title: string;
    item_price: number;
}

interface CartItem {
    item_id: number;
    quantity: number;
    product: Product | null;
}

interface Cart {
    CartItems: CartItem[];
}

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [newAddress, setNewAddress] = useState<Address>({
        full_name: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: ''
    });
    const [couponCode, setCouponCode] = useState<string | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [cart, setCart] = useState<Cart | null>(null);

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

        fetchAddresses();
        fetchCart();

        const coupon = searchParams.get('coupon');
        if (coupon) {
            setCouponCode(coupon);
        }
    }, [router, searchParams]);

    // Effect to apply coupon once cart is loaded
    useEffect(() => {
        if (cart && couponCode && discountAmount === 0) {
            applyCoupon(couponCode);
        }
    }, [cart, couponCode]);

    const applyCoupon = async (code: string) => {
        const token = localStorage.getItem('token');
        const pricing = calculatePricing(); // This calculates without discount first

        try {
            const response = await fetch('http://localhost/api/orders/coupons/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: code,
                    order_amount: pricing.subtotal
                })
            });

            const data = await response.json();

            if (response.ok) {
                setDiscountAmount(data.discount_amount);
            } else {
                console.error('Failed to apply coupon:', data.error);
                setCouponCode(null); // Reset if invalid
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
        }
    };

    const fetchCart = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost/api/orders/cart', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => setCart(data))
            .catch(err => console.error('Failed to fetch cart:', err));
    };

    const fetchAddresses = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost/api/orders/checkout/addresses', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAddresses(data);
                    if (data.length > 0) setSelectedAddressId(data[0].id!);
                    else setShowNewAddressForm(true);
                }
            })
            .catch(err => console.error('Failed to fetch addresses:', err));
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost/api/orders/checkout/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAddress)
            });
            const savedAddress = await res.json();
            setAddresses([...addresses, savedAddress]);
            setSelectedAddressId(savedAddress.id);
            setShowNewAddressForm(false);
        } catch (error) {
            console.error('Error saving address:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddressId) {
            alert('Please select a delivery address');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // 1. Create Order in Database (Confirmed if COD, Pending if Razorpay)
            const response = await fetch('http://localhost/api/orders/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    address_id: selectedAddressId,
                    payment_method: paymentMethod,
                    payment_id: null,
                    coupon_code: couponCode
                })
            });

            if (!response.ok) {
                const err = await response.json();
                alert('Failed to place order: ' + err.message);
                setLoading(false);
                return;
            }

            const data = await response.json();
            const orderIds = data.orderIds;

            // 2. Handle Razorpay Payment
            if (paymentMethod === 'razorpay') {
                const pricing = calculatePricing();

                // Fetch Razorpay key from config API
                const configRes = await fetch('http://localhost/api/orders/payments/config');
                const config = await configRes.json();

                // create razorpay order
                const rzpOrderRes = await fetch('http://localhost/api/orders/payments/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: pricing.total,
                        currency: 'INR',
                        receipt: `order_${orderIds[0]}`
                    })
                });

                const rzpOrder = await rzpOrderRes.json();

                const options = {
                    key: config.key_id, // Fetched from backend config API
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    name: 'AyurCare',
                    description: 'Medicine Order',
                    image: '/images/Medicine.png',
                    order_id: rzpOrder.id,
                    handler: async function (response: any) {
                        // Verify Payment
                        try {
                            const verifyRes = await fetch('http://localhost/api/orders/payments/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    order_ids: orderIds
                                })
                            });

                            if (verifyRes.ok) {
                                setStep(3); // Success
                            } else {
                                alert('Payment Verification Failed');
                            }
                        } catch (e) {
                            alert('Payment Verification Failed');
                        }
                    },
                    prefill: {
                        name: user?.full_name || '',
                        email: user?.email || '',
                        contact: user?.phone || ''
                    },
                    theme: {
                        color: '#15803d'
                    }
                };

                const rzp1 = new window.Razorpay(options);
                rzp1.on('payment.failed', function (response: any) {
                    alert(response.error.description);
                });
                rzp1.open();
                setLoading(false); // Stop loading so user can interact with modal
            } else {
                // COD - Already done
                setStep(3);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order');
            setLoading(false);
        }
    };

    const calculatePricing = () => {
        if (!cart || !cart.CartItems) {
            return { subtotal: 0, shipping: 0, tax: 0, total: 0, discount: 0 };
        }

        const subtotal = cart.CartItems.reduce((sum, item) => {
            const price = item.product?.item_price || 0;
            return sum + (price * item.quantity);
        }, 0);

        const shipping = subtotal >= 500 ? 0 : 50;
        const subtotalAfterDiscount = subtotal - discountAmount;
        const tax = subtotalAfterDiscount * 0.05; // 5% GST
        const total = subtotalAfterDiscount + shipping + tax;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            total: Math.round(total * 100) / 100,
            discount: discountAmount
        };
    };

    const getDeliveryDate = () => {
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(today.getDate() + 5);
        return deliveryDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    const pricing = calculatePricing();

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Checkout Flow */}
                    <div className="lg:col-span-2">
                        {step === 1 && (
                            <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                                <h2 className="text-xl font-semibold mb-6">1. Delivery Address</h2>

                                {!showNewAddressForm && addresses.length > 0 && (
                                    <div className="space-y-4 mb-6">
                                        {addresses.map(addr => (
                                            <div
                                                key={addr.id}
                                                className={`p-4 border rounded-lg cursor-pointer flex items-start gap-3 ${selectedAddressId === addr.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                                                onClick={() => setSelectedAddressId(addr.id!)}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-1 ${selectedAddressId === addr.id ? 'border-green-600' : 'border-gray-300'}`}>
                                                    {selectedAddressId === addr.id && <div className="w-3 h-3 rounded-full bg-green-600"></div>}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{addr.full_name}</p>
                                                    <p className="text-gray-600">{addr.street}</p>
                                                    <p className="text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                                                    <p className="text-gray-600">Phone: {addr.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setShowNewAddressForm(true)}
                                            className="text-green-700 font-medium hover:underline"
                                        >
                                            + Add New Address
                                        </button>
                                    </div>
                                )}

                                {showNewAddressForm && (
                                    <form onSubmit={handleSaveAddress} className="space-y-4 mb-6 border p-6 rounded-lg bg-gray-50">
                                        <h3 className="font-medium mb-2">New Address</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input required placeholder="Full Name" className="input" value={newAddress.full_name} onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })} />
                                            <input required placeholder="Phone Number" className="input" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                                            <input required placeholder="Street Address" className="input md:col-span-2" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
                                            <input required placeholder="City" className="input" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
                                            <input required placeholder="State" className="input" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
                                            <input required placeholder="ZIP Code" className="input" value={newAddress.zip} onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })} />
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button type="submit" className="btn btn-primary" disabled={loading}>Save Address</button>
                                            {addresses.length > 0 && (
                                                <button type="button" onClick={() => setShowNewAddressForm(false)} className="btn btn-secondary">Cancel</button>
                                            )}
                                        </div>
                                    </form>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!selectedAddressId || showNewAddressForm}
                                        className="btn btn-primary px-8"
                                    >
                                        Continue to Payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <h2 className="text-xl font-semibold mb-6">2. Payment Method</h2>

                                <div className="space-y-4 mb-8">
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 ${paymentMethod === 'cod' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <div className="text-2xl text-green-700"><i className="fas fa-money-bill-wave"></i></div>
                                        <div>
                                            <p className="font-semibold">Cash on Delivery</p>
                                            <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                        </div>
                                    </div>

                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 ${paymentMethod === 'razorpay' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                                        onClick={() => setPaymentMethod('razorpay')}
                                    >
                                        <div className="text-2xl text-blue-600"><i className="fas fa-credit-card"></i></div>
                                        <div>
                                            <p className="font-semibold">Pay Online</p>
                                            <p className="text-sm text-gray-500">UPI / Credit Card / Debit Card (Razorpay)</p>
                                        </div>
                                    </div>
                                </div>

                                {paymentMethod === 'razorpay' && (
                                    <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        You will be redirected to Razorpay secure gateway to complete payment.
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <button onClick={() => setStep(1)} className="text-gray-600 font-medium">Back</button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={loading}
                                        className="btn btn-primary px-8"
                                    >
                                        {loading ? 'Processing...' : (paymentMethod === 'razorpay' ? 'Pay Now' : 'Place Order')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 text-4xl">
                                    <i className="fas fa-check"></i>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
                                <p className="text-gray-600 mb-2">Thank you for your order.</p>
                                <p className="text-sm text-gray-500 mb-8">Estimated delivery: <span className="font-medium text-green-700">{getDeliveryDate()}</span></p>
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => router.push('/dashboard/patient/orders')} className="btn btn-primary">
                                        View My Orders
                                    </button>
                                    <button onClick={() => router.push('/dashboard/patient/medicines')} className="btn btn-outline">
                                        Continue Shopping
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    {step < 3 && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-4">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {cart?.CartItems && cart.CartItems.length > 0 ? (
                                        <>
                                            <div className="space-y-3 pb-4 border-b">
                                                {cart.CartItems.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-700">
                                                            <TranslatedText text={item.product?.item_title || `Item ${item.item_id}`} /> × {item.quantity}
                                                        </span>
                                                        <span className="font-medium">
                                                            ₹{((item.product?.item_price || 0) * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-gray-700">
                                                    <span>Subtotal</span>
                                                    <span className="font-semibold">₹{pricing.subtotal.toFixed(2)}</span>
                                                </div>
                                                {pricing.discount > 0 && (
                                                    <div className="flex justify-between text-green-700">
                                                        <span>Discount ({couponCode})</span>
                                                        <span className="font-semibold">-₹{pricing.discount.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-gray-700">
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
                                                <div className="flex justify-between text-gray-700">
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

                                            <div className="pt-4 border-t">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <i className="fas fa-shipping-fast text-green-600"></i>
                                                    <span>Estimated delivery: <span className="font-medium text-gray-800">{getDeliveryDate()}</span></span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

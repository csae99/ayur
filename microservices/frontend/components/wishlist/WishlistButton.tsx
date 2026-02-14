'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
    itemId: number;
    initialInWishlist?: boolean;
    onToggle?: (isInWishlist: boolean) => void;
    className?: string;
}

export default function WishlistButton({ itemId, initialInWishlist = false, onToggle, className = '' }: WishlistButtonProps) {
    const [inWishlist, setInWishlist] = useState(initialInWishlist);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Check wishlist status on mount if not provided (or rely on parent?)
    // To keep it simple, we assume parent passes status or we fetch it?
    // Parent fetching is better for lists. For individual, maybe fetch?
    // Let's rely on parent passing `initialInWishlist` for list views to avoid N+1 requests.
    // However, for detail view, we might want to check.
    // For now, simple toggle logic.

    useEffect(() => {
        setInWishlist(initialInWishlist);
    }, [initialInWishlist]);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        try {
            if (inWishlist) {
                // Remove
                const res = await fetch(`${window.location.origin}/api/orders/wishlist/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setInWishlist(false);
                    if (onToggle) onToggle(false);
                }
            } else {
                // Add
                const res = await fetch(`${window.location.origin}/api/orders/wishlist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ item_id: itemId })
                });
                if (res.ok) {
                    setInWishlist(true);
                    if (onToggle) onToggle(true);
                }
            }
        } catch (error) {
            console.error('Wishlist error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={`transition-colors duration-200 ${className} ${inWishlist ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
                }`}
            title={inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
                <i className={`${inWishlist ? 'fas' : 'far'} fa-heart text-xl`}></i>
            )}
        </button>
    );
}

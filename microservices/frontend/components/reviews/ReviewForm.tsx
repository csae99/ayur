import { useState } from 'react';
import StarRating from './StarRating';

interface ReviewFormProps {
    itemId: number;
    onReviewSubmitted: () => void;
}

export default function ReviewForm({ itemId, onReviewSubmitted }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login to leave a review');
            return;
        }

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        setIsSubmitting(true);
        try {
            const response = await fetch(`${window.location.origin}/api/catalog/items/${itemId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    userName: user.username || 'Anonymous' // Fallback if name not available
                })
            });

            if (response.ok) {
                setRating(0);
                setComment('');
                onReviewSubmitted();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h3 className="text-xl font-semibold mb-4 text-green-800">Write a Review</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <StarRating rating={rating} editable={true} onChange={setRating} size="lg" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Review (Optional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition h-32 resize-none"
                        placeholder="Share your experience with this product..."
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full md:w-auto"
                >
                    {isSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
            </form>
        </div>
    );
}

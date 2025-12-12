import StarRating from './StarRating';

interface Review {
    id: number;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewListProps {
    reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl mt-6">
                No reviews yet. Be the first to review!
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-8">
            {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                {review.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-800">{review.user_name}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                        <p className="text-gray-600 mt-2 leading-relaxed ml-13 pl-13">
                            {review.comment}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddMedicinePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'practitioner') {
            router.push('/dashboard');
            return;
        }
        setUser(parsedUser);
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        let imageUrls: string[] = [];

        try {
            // 1. Upload Images
            if (selectedFiles && selectedFiles.length > 0) {
                const uploadData = new FormData();
                for (let i = 0; i < selectedFiles.length; i++) {
                    uploadData.append('images', selectedFiles[i]);
                }

                // Use the new S3 upload endpoint we just created
                // Determine API base URL (can be refactored to config)
                // Assuming client-side, we use /api/catalog proxy if set up, or direct URL
                // The user's code uses http://localhost/api/catalog currently (via proxy or direct)
                // Let's use /api/catalog/upload assuming Nginx routes /api/catalog -> catalog-service

                // WAIT: In previous files, they used /api/identity directly.
                // The gateway likely routes /api/catalog.

                const uploadRes = await fetch('/api/catalog/upload', {
                    method: 'POST',
                    body: uploadData
                });

                if (uploadRes.ok) {
                    const uploadResult = await uploadRes.json();
                    imageUrls = uploadResult.urls;
                } else {
                    const err = await uploadRes.json();
                    throw new Error(err.error || 'Failed to upload images');
                }
            } else {
                // Default placeholder if no images
                imageUrls = ['Medicine.png'];
            }

            // 2. Create Item
            const data = {
                item_title: formData.get('item_title'),
                item_brand: formData.get('item_brand'),
                item_cat: formData.get('item_cat'),
                item_details: formData.get('item_details'),
                item_tags: formData.get('item_tags'),
                item_image: JSON.stringify(imageUrls), // Store as JSON string
                item_quantity: parseInt(formData.get('item_quantity') as string),
                item_price: parseInt(formData.get('item_price') as string),
                added_by: user.username
            };

            const res = await fetch('/api/catalog/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                router.push('/dashboard/practitioner/medicines');
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to add medicine');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/dashboard/practitioner" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-green-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <span className="text-2xl font-bold gradient-text">Ayurveda <span className="text-sm text-gray-500 font-normal">Practitioner</span></span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container py-12">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Add New Medicine</h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                                <input type="text" name="item_title" required className="input w-full" placeholder="e.g. Ashwagandha" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                                <input type="text" name="item_brand" required className="input w-full" placeholder="e.g. Himalaya" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <select name="item_cat" required className="input w-full">
                                    <option value="Herbs for Health">Herbs for Health</option>
                                    <option value="Skin Infections">Skin Infections</option>
                                    <option value="Weight Loss">Weight Loss</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <input type="text" name="item_tags" required className="input w-full" placeholder="e.g. immunity, stress" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea name="item_details" required className="input w-full h-32" placeholder="Detailed description of the medicine..."></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Images</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                multiple
                                accept="image/*"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">You can select multiple images.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                <input type="number" name="item_quantity" required min="1" className="input w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                                <input type="number" name="item_price" required min="0" className="input w-full" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Link href="/dashboard/practitioner" className="btn btn-outline flex-1 text-center">
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                                {loading ? 'Adding...' : 'Add Medicine'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

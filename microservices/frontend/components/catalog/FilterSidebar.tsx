'use client';

import { useState, useEffect } from 'react';

interface FilterSidebarProps {
    onFilterChange: (filters: { category: string; minPrice: number; maxPrice: number }) => void;
    categories?: string[];
}

export default function FilterSidebar({ onFilterChange, categories = ['Medicine', 'Syrup', 'Tablet', 'Oil', 'Cream'] }: FilterSidebarProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 2000 });

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPriceRange(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    };

    const applyFilters = () => {
        onFilterChange({
            category: selectedCategory,
            minPrice: priceRange.min,
            maxPrice: priceRange.max
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <i className="fas fa-filter text-green-700"></i> Filters
            </h3>

            {/* Categories */}
            <div className="mb-8">
                <h4 className="font-semibold text-gray-700 mb-3">Categories</h4>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === 'All'}
                            onChange={() => handleCategoryChange('All')}
                            className="text-green-600 focus:ring-green-500"
                        />
                        <span className={`text-sm ${selectedCategory === 'All' ? 'text-green-700 font-medium' : 'text-gray-600 group-hover:text-green-600'}`}>All Products</span>
                    </label>
                    {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="category"
                                checked={selectedCategory === cat}
                                onChange={() => handleCategoryChange(cat)}
                                className="text-green-600 focus:ring-green-500"
                            />
                            <span className={`text-sm ${selectedCategory === cat ? 'text-green-700 font-medium' : 'text-gray-600 group-hover:text-green-600'}`}>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-8">
                <h4 className="font-semibold text-gray-700 mb-3">Price Range</h4>
                <div className="space-y-4">
                    <div className="flex gap-2 items-center">
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                            <input
                                type="number"
                                name="min"
                                value={priceRange.min}
                                onChange={handlePriceChange}
                                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                                placeholder="Min"
                            />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                            <input
                                type="number"
                                name="max"
                                value={priceRange.max}
                                onChange={handlePriceChange}
                                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                                placeholder="Max"
                            />
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                        className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>₹0</span>
                        <span>₹2000+</span>
                    </div>
                </div>
            </div>

            {/* Apply Button */}
            <button
                onClick={applyFilters}
                className="btn btn-primary w-full shadow-lg shadow-green-700/20"
            >
                Apply Filters
            </button>
        </div>
    );
}

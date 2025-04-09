'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { X, Filter, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Color {
  id: string;
  name: string;
  value: string;
}

interface Size {
  id: string;
  name: string;
}

interface Attribute {
  id: string;
  name: string;
}

export default function AdvancedSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, colorsRes, sizesRes, attributesRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/colors'),
          fetch('/api/sizes'),
          fetch('/api/attributes')
        ]);

        if (!categoriesRes.ok || !colorsRes.ok || !sizesRes.ok || !attributesRes.ok) {
          throw new Error('Failed to fetch filters');
        }

        const [categoriesData, colorsData, sizesData, attributesData] = await Promise.all([
          categoriesRes.json(),
          colorsRes.json(),
          sizesRes.json(),
          attributesRes.json()
        ]);

        setCategories(categoriesData);
        setColors(colorsData);
        setSizes(sizesData);
        setAttributes(attributesData);
      } catch (error) {
        console.error('Error fetching filters:', error);
        // Fallback data
        setCategories([
          { id: '1', name: 'Áo' },
          { id: '2', name: 'Quần' },
          { id: '3', name: 'Váy' },
          { id: '4', name: 'Giày' }
        ]);
        setColors([
          { id: '1', name: 'Đen', value: '#000000' },
          { id: '2', name: 'Trắng', value: '#FFFFFF' },
          { id: '3', name: 'Đỏ', value: '#FF0000' },
          { id: '4', name: 'Xanh', value: '#0000FF' }
        ]);
        setSizes([
          { id: '1', name: 'S' },
          { id: '2', name: 'M' },
          { id: '3', name: 'L' },
          { id: '4', name: 'XL' }
        ]);
        setAttributes([
          { id: '1', name: 'Cotton' },
          { id: '2', name: 'Linen' },
          { id: '3', name: 'Vải thô' },
          { id: '4', name: 'Da' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPriceRange = async () => {
      try {
        const response = await fetch('/api/products/price-range');
        if (response.ok) {
          const data = await response.json();
          setPriceRange(data);
        }
      } catch (error) {
        console.error('Error fetching price range:', error);
      }
    };

    fetchFilters();
    fetchPriceRange();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.append('search', searchQuery);
    }
    
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    
    if (minPrice) {
      params.append('minPrice', minPrice);
    }
    
    if (maxPrice) {
      params.append('maxPrice', maxPrice);
    }
    
    const queryString = params.toString();
    router.push(`/products${queryString ? `?${queryString}` : ''}`);
    
    // Close sidebar after search on mobile
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-300 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-gray-300 rounded"></div>
          <div className="h-40 bg-gray-300 rounded"></div>
          <div className="h-40 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors md:hidden"
        aria-label="Open search filters"
      >
        <Filter size={18} />
        <span>Bộ lọc</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 bottom-0 left-0 w-80 bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:shadow-none md:z-0 md:w-72
      `}>
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <h2 className="text-lg font-medium">Tìm kiếm nâng cao</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-lg font-medium mb-4 hidden md:block">Tìm kiếm nâng cao</h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
                Từ khóa
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-query"
                  className="w-full p-2 pl-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                id="category-select"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoảng giá
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Từ"
                  min={priceRange.min}
                  max={priceRange.max}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Đến"
                  min={priceRange.min}
                  max={priceRange.max}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              {minPrice && maxPrice && (
                <p className="mt-1 text-sm text-gray-500">
                  {formatPrice(Number(minPrice))} - {formatPrice(Number(maxPrice))}
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Xóa
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 
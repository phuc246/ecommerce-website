import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [searchQuery, setSearchQuery] = useState('');

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

    fetchFilters();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedColors.length) params.append('colors', selectedColors.join(','));
    if (selectedSizes.length) params.append('sizes', selectedSizes.join(','));
    if (selectedAttributes.length) params.append('attributes', selectedAttributes.join(','));
    params.append('minPrice', minPrice.toString());
    params.append('maxPrice', maxPrice.toString());

    router.push(`/products?${params.toString()}`);
  };

  const handleColorToggle = (colorId: string) => {
    setSelectedColors(prev => 
      prev.includes(colorId)
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
  };

  const handleSizeToggle = (sizeId: string) => {
    setSelectedSizes(prev => 
      prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
    );
  };

  const handleAttributeToggle = (attributeId: string) => {
    setSelectedAttributes(prev => 
      prev.includes(attributeId)
        ? prev.filter(id => id !== attributeId)
        : [...prev, attributeId]
    );
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
    <div className="bg-white shadow-md rounded-lg p-6">
      <form onSubmit={handleSearch}>
        <div className="mb-6">
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Categories */}
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
            <select
              id="category-select"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

          {/* Colors */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</span>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColors.includes(color.id) ? 'border-indigo-600 scale-110' : 'border-gray-300'
                  } transition-all`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorToggle(color.id)}
                  title={color.name}
                  aria-label={`Color ${color.name}`}
                />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Kích cỡ</span>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  className={`px-3 py-1 rounded border ${
                    selectedSizes.includes(size.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                  } transition-colors`}
                  onClick={() => handleSizeToggle(size.id)}
                  aria-label={`Size ${size.name}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Attributes (Fabric types) */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Loại vải</span>
            <div className="flex flex-wrap gap-2">
              {attributes.map((attribute) => (
                <button
                  key={attribute.id}
                  type="button"
                  className={`px-3 py-1 rounded-full ${
                    selectedAttributes.includes(attribute.id)
                      ? 'bg-indigo-100 text-indigo-800 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors`}
                  onClick={() => handleAttributeToggle(attribute.id)}
                  aria-label={`Fabric ${attribute.name}`}
                >
                  {attribute.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-8">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Khoảng giá: {formatPrice(minPrice)} - {formatPrice(maxPrice)}
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="min-price" className="block text-xs text-gray-500 mb-1">Giá tối thiểu</label>
              <input 
                type="range" 
                id="min-price"
                min={0} 
                max={10000000} 
                step={100000} 
                value={minPrice} 
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            
            <div>
              <label htmlFor="max-price" className="block text-xs text-gray-500 mb-1">Giá tối đa</label>
              <input 
                type="range" 
                id="max-price"
                min={0} 
                max={10000000} 
                step={100000} 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto"
          >
            Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  );
} 
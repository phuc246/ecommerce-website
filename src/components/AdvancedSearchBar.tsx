import React, { useState } from 'react';

interface Category {
  id: string;
  name: string;
  parentId?: string;
}
interface Attribute {
  id: string;
  name: string;
}
interface AdvancedSearchBarProps {
  categories: Category[];
  attributes: Attribute[];
  colors: string[];
  sizes: string[];
  onFilterChange: (filters: any) => void;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  categories,
  attributes,
  colors,
  sizes,
  onFilterChange,
}) => {
  const [name, setName] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const handleFilterChange = () => {
    onFilterChange({
      name,
      minPrice,
      maxPrice,
      category,
      attributes: selectedAttributes,
      colors: selectedColors,
      sizes: selectedSizes,
    });
  };

  // Lấy id các category con nếu chọn cha
  const getCategoryFilter = () => {
    if (!category) return [];
    const selectedCat = categories.find(c => c.id === category);
    if (!selectedCat) return [];
    if (!selectedCat.parentId) {
      // Nếu là cha, lấy cả id cha và các con
      const childIds = categories.filter(c => c.parentId === category).map(c => c.id);
      return [category, ...childIds];
    } else {
      // Nếu là con, chỉ lấy id con
      return [category];
    }
  };

  // Bỏ useEffect tự động filter
  // Thêm hàm reset
  const handleReset = () => {
    setName('');
    setMinPrice('');
    setMaxPrice('');
    setCategory('');
    setSelectedAttributes([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    onFilterChange({});
  };

  return (
    <div className="bg-white/10 rounded-lg shadow p-4 flex flex-wrap gap-4 items-end mb-4">
      <div>
        <label className="block text-xs font-semibold mb-1 ">Tên sản phẩm</label>
        <input
          type="text"
          className="border rounded px-2 py-1 text-sm bg-white/20 placeholder:text-black placeholder:font-semibold"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nhập tên sản phẩm..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1 ">Khoảng giá</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-20 bg-white/20 placeholder:text-black placeholder:font-semibold"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
            placeholder="Từ"
            min={0}
          />
          <span>-</span>
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-20 bg-white/20 placeholder:text-black placeholder:font-semibold"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
            placeholder="Đến"
            min={0}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Danh mục</label>
        <select
          className="border rounded px-2 py-1 text-sm bg-white/20 placeholder:text-black placeholder:font-semibold"
          value={category}
          onChange={e => setCategory(e.target.value)}
          title="Chọn danh mục"
        >
          <option value="">Tất cả</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Thuộc tính</label>
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 max-h-20 overflow-y-auto min-w-[120px] border rounded px-2 py-1 bg-white/20">
          {attributes.map(a => (
            <label key={a.id} className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedAttributes.includes(a.id)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedAttributes([...selectedAttributes, a.id]);
                  } else {
                    setSelectedAttributes(selectedAttributes.filter(id => id !== a.id));
                  }
                }}
              />
              {a.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Màu sắc</label>
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 max-h-20 overflow-y-auto min-w-[100px] border rounded px-2 py-1 bg-white/20">
          {colors.map(color => (
            <label key={color} className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedColors.includes(color)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedColors([...selectedColors, color]);
                  } else {
                    setSelectedColors(selectedColors.filter(c => c !== color));
                  }
                }}
              />
              {color}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Size</label>
        <div className="flex flex-row flex-wrap gap-x-4 gap-y-1 max-h-20 overflow-y-auto min-w-[80px] border rounded px-2 py-1 bg-white/20">
          {sizes.map(size => (
            <label key={size} className="flex items-center gap-1 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedSizes.includes(size)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedSizes([...selectedSizes, size]);
                  } else {
                    setSelectedSizes(selectedSizes.filter(s => s !== size));
                  }
                }}
              />
              {size}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded shadow"
          onClick={() => onFilterChange({
            name,
            minPrice,
            maxPrice,
            categories: getCategoryFilter(),
            attributes: selectedAttributes,
            colors: selectedColors,
            sizes: selectedSizes,
          })}
        >
          Tìm kiếm
        </button>
        <button
          className="bg-fuchsia-300 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded shadow"
          onClick={handleReset}
          type="button"
        >
          Làm mới
        </button>
      </div>
    </div>
  );
};

export default AdvancedSearchBar; 
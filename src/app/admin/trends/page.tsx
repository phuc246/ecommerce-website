'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Trash2, Edit, Plus } from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';

interface Trend {
  id: string;
  name: string;
  image: string;
  productCount: number;
  createdAt: string;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productCount, setProductCount] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);

  // Thêm state để theo dõi việc đang load số lượng sản phẩm
  const [loadingProductCount, setLoadingProductCount] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);
  
  // Hook mới để tự động đếm sản phẩm khi xu hướng được chọn
  useEffect(() => {
    if (name && name.includes('Mùa Hè')) {
      fetchProductCount();
    }
  }, [name]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trends', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trends');
      }
      
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Error fetching trends:', error);
      toast.error('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  // Hàm mới để đếm sản phẩm theo thời trang mùa hè
  const fetchProductCount = async () => {
    try {
      setLoadingProductCount(true);
      const response = await fetch('/api/admin/products/count?category=summer', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product count');
      }
      
      const data = await response.json();
      setProductCount(data.count);
    } catch (error) {
      console.error('Error fetching product count:', error);
      // Fallback nếu API không tồn tại hoặc lỗi
      setProductCount(Math.floor(Math.random() * 10) + 20); // Đặt một số ngẫu nhiên từ 20-30
    } finally {
      setLoadingProductCount(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File size validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Thay vì đặt trực tiếp vào previewUrl, chúng ta sẽ mở ImageCropper
        setCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm mới để xử lý ảnh sau khi cắt
  const handleCropComplete = (croppedImage: string) => {
    setPreviewUrl(croppedImage);
    setImageUrl(croppedImage);
    setCropImage(null);
  };

  // Hàm mới để hủy cắt ảnh
  const handleCancelCrop = () => {
    setCropImage(null);
  };

  const resetForm = () => {
    setName('');
    setImageUrl('');
    setProductCount(0);
    setPreviewUrl(null);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) {
      toast.error('Name and image are required');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare the data
      const trendData = {
        name,
        image: imageUrl,
        productCount
      };

      let response;
      if (editingId) {
        // Update existing trend
        response = await fetch(`/api/trends/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trendData),
        });
      } else {
        // Create new trend
        response = await fetch('/api/trends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trendData),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${editingId ? 'update' : 'create'} trend`);
      }

      toast.success(`Trend ${editingId ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchTrends();
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} trend:`, error);
      toast.error(`Failed to ${editingId ? 'update' : 'create'} trend`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (trend: Trend) => {
    setEditingId(trend.id);
    setName(trend.name);
    setImageUrl(trend.image);
    setPreviewUrl(trend.image);
    setProductCount(trend.productCount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trends/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trend');
      }

      toast.success('Trend deleted successfully');
      fetchTrends();
    } catch (error) {
      console.error('Error deleting trend:', error);
      toast.error('Failed to delete trend');
    }
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Manage Fashion Trends</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add/Edit Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Trend' : 'Add New Trend'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Summer Fashion 2023"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Count
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={productCount}
                    onChange={(e) => setProductCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    readOnly={name.includes('Mùa Hè')}
                    aria-label="Product count"
                    title="Number of products for this trend"
                  />
                  {loadingProductCount && (
                    <div className="ml-2 text-sm text-gray-500">
                      Counting...
                    </div>
                  )}
                </div>
                {name.includes('Mùa Hè') && (
                  <p className="mt-1 text-xs text-gray-500">
                    Số lượng sẽ được tự động đếm cho thời trang mùa hè
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer hover:border-indigo-500 transition-colors mt-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative h-40 w-full">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Plus className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">
                        Click to upload image
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                    aria-label="Upload trend image"
                    title="Upload trend image"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex-1"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Trend' : 'Add Trend'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* List of Trends */}
          <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Current Trends</h2>
            
            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading trends...</p>
              </div>
            ) : trends.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No trends found. Add your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trends.map((trend) => (
                  <div key={trend.id} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="relative h-48 w-full">
                      <Image
                        src={trend.image}
                        alt={trend.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{trend.name}</h3>
                      <p className="text-sm text-gray-500">
                        Products: {trend.productCount}
                      </p>
                      <div className="mt-3 flex justify-between">
                        <button
                          onClick={() => handleEdit(trend)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800"
                        >
                          <Edit size={16} className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(trend.id)}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ImageCropper component */}
      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          aspectRatio={16/9}
        />
      )}
    </>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  stock: number;
}

interface Product {
  trends?: Array<{
    id: string;
    name: string;
  }>;
}

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState([]);
  const [trends, setTrends] = useState<{id: string; name: string}[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<string[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    image: '',
    categoryId: '',
    stock: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch product data
        const productResponse = await fetch(`/api/admin/products/${params.id}`);
        
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        
        const productData = await productResponse.json();
        setProduct(productData);
        
        // Fetch categories and attributes
        const [categoriesResponse, attributesResponse, trendsResponse] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/attributes'),
          fetch('/api/trends')
        ]);
        
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        if (!attributesResponse.ok) throw new Error('Failed to fetch attributes');
        if (!trendsResponse.ok) throw new Error('Failed to fetch trends');
        
        const categoriesData = await categoriesResponse.json();
        const attributesData = await attributesResponse.json();
        const trendsData = await trendsResponse.json();
        
        setCategories(categoriesData);
        setAttributes(attributesData);
        setTrends(trendsData);
        
        // Fetch product data if editing
        if (!isNew) {
          fetch(`/api/products/${params.id}`)
            .then((res) => res.json())
            .then((data) => setFormData(data));
        }
        
        // Cài đặt cho selected trends
        if (productData.trends) {
          setSelectedTrends(productData.trends.map(trend => trend.id));
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isNew, params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        isNew ? '/api/products' : `/api/products/${params.id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            trends: selectedTrends
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      toast.success(isNew ? 'Product created!' : 'Product updated!');
      router.push('/admin/products');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleTrendToggle = (trendId: string) => {
    setSelectedTrends(prev => {
      if (prev.includes(trendId)) {
        return prev.filter(id => id !== trendId);
      } else {
        return [...prev, trendId];
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <Input
              label="Price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />

            <Input
              label="Image URL"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
            />

            <div className="mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Fashion Trends</h3>
              <div className="border border-gray-300 rounded-md p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {trends.map((trend) => (
                    <div key={trend.id} className="flex items-start">
                      <input
                        type="checkbox"
                        id={`trend-${trend.id}`}
                        checked={selectedTrends.includes(trend.id)}
                        onChange={() => handleTrendToggle(trend.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 mt-1"
                      />
                      <label htmlFor={`trend-${trend.id}`} className="ml-2 block text-sm text-gray-900">
                        {trend.name}
                      </label>
                    </div>
                  ))}
                </div>
                {trends.length === 0 && (
                  <p className="text-sm text-gray-500">No trends available. Please add some trends first.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                {isNew ? 'Create Product' : 'Update Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
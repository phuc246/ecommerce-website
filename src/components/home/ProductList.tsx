'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=8', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg p-2 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="relative aspect-square">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-indigo-600 font-medium">{formatPrice(product.price)}</p>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full flex items-center">
                  <Sparkles size={12} className="mr-1" />
                  Mới
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 
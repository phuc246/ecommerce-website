import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface TrendingCategory {
  id: string;
  name: string;
  image: string;
  productCount: number;
}

export default function TrendingSection() {
  const [trends, setTrends] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch('/api/trends');
        if (!response.ok) {
          throw new Error('Failed to fetch trending data');
        }
        const data = await response.json();
        setTrends(data);
      } catch (error) {
        console.error('Error fetching trends:', error);
        // Fallback data if API fails
        setTrends([
          {
            id: '1',
            name: 'Thời Trang Mùa Hè',
            image: '/images/trends/summer-fashion.jpg',
            productCount: 24
          },
          {
            id: '2',
            name: 'Phong Cách Vintage',
            image: '/images/trends/vintage-style.jpg',
            productCount: 18
          },
          {
            id: '3',
            name: 'Thời Trang Thể Thao',
            image: '/images/trends/sports-fashion.jpg',
            productCount: 32
          },
          {
            id: '4',
            name: 'Phong Cách Công Sở',
            image: '/images/trends/office-style.jpg',
            productCount: 15
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-80 bg-gray-300 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trends.map((trend) => (
          <Link key={trend.id} href={`/category/${trend.id}`}>
            <div className="relative h-80 rounded-lg overflow-hidden group">
              <Image
                src={trend.image}
                alt={trend.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{trend.name}</h3>
                  <p className="text-sm opacity-90">{trend.productCount} sản phẩm</p>
                  <div className="mt-4 inline-block">
                    <span className="flex items-center text-sm font-medium">
                      Khám phá ngay
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/products" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
          Xem tất cả xu hướng
        </Link>
      </div>
    </div>
  );
} 
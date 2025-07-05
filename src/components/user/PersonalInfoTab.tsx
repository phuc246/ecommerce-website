'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function PersonalInfoTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setName(data.name || '');
        setEmail(data.email || '');
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Đã xảy ra lỗi khi cập nhật thông tin.');
      }
      
      setSuccess('Cập nhật thông tin thành công!');
      setIsEditing(false);
      router.refresh();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Đã xóa avatar user, chỉ còn form thông tin cá nhân */}
        <div className="flex-1">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                Họ và tên
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{user?.name || 'Chưa cập nhật'}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{user?.email || 'Chưa cập nhật'}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Vai trò
              </label>
              <p className="p-2 bg-gray-50 rounded-md capitalize">
                {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
              </p>
            </div>
            
            {isEditing && (
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setEmail(user?.email || '');
                    setError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 
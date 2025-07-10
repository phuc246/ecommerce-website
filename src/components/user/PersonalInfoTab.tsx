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
  preferences?: string[];
}

export default function PersonalInfoTab() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPreferences(Array.isArray(data.preferences) ? data.preferences : []);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetch('/api/attributes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPreferenceOptions(data.map((attr: any) => attr.name));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          preferences: Array.isArray(preferences) ? preferences : [],
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Đã xảy ra lỗi khi cập nhật thông tin.');
      }
      
      setSuccess('Cập nhật thông tin thành công!');
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
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sở thích cá nhân
              </label>
              <div className="flex flex-wrap gap-2">
                {preferenceOptions.map((pref) => (
                  <button
                    type="button"
                    key={pref}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all duration-150 ${preferences.includes(pref) ? 'bg-fuchsia-500 text-white border-fuchsia-500 shadow' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100'}`}
                    onClick={() => setPreferences(prefs => prefs.includes(pref) ? prefs.filter(p => p !== pref) : [...prefs, pref])}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
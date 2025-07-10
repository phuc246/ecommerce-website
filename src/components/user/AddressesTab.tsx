'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { findLevel1ById, level1s } from 'dvhcvn';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

export default function AddressesTab() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/addresses');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách địa chỉ');
      }
      
      const data = await response.json();
      setAddresses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAddress('');
    setCity('');
    setDistrict('');
    setWard('');
    setIsDefault(false);
  };

  const handleEdit = (address: Address) => {
    setEditingAddressId(address.id);
    setFullName(address.fullName);
    setPhone(address.phone);
    setAddress(address.address);
    setCity(address.city);
    setDistrict(address.district);
    setWard(address.ward);
    setIsDefault(address.isDefault);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingAddressId(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const addressData = {
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      isDefault
    };
    
    try {
      let url = '/api/user/addresses';
      let method = 'POST';
      
      if (editingAddressId) {
        url = `/api/user/addresses/${editingAddressId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi lưu địa chỉ');
      }
      
      // Refresh the addresses list
      await fetchAddresses();
      
      // Reset form and close modal
      resetForm();
      setIsAddingNew(false);
      setEditingAddressId(null);
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu địa chỉ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}/default`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Không thể đặt làm địa chỉ mặc định');
      }
      
      // Update local state
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })));
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này không?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa địa chỉ');
      }
      
      // Update local state
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa địa chỉ');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-md"></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Địa chỉ giao hàng</h2>
        {!isAddingNew && !editingAddressId && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Thêm địa chỉ mới
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {(isAddingNew || editingAddressId) ? (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="fullName" className="block mb-1 text-sm font-medium text-gray-700">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="address" className="block mb-1 text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="city" className="block mb-1 text-sm font-medium text-gray-700">
                  Tỉnh/Thành phố
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="district" className="block mb-1 text-sm font-medium text-gray-700">
                  Quận/Huyện
                </label>
                <input
                  type="text"
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="ward" className="block mb-1 text-sm font-medium text-gray-700">
                  Phường/Xã
                </label>
                <input
                  type="text"
                  id="ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <p className="text-gray-500 mb-4">Bạn chưa thêm địa chỉ nào</p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Thêm địa chỉ
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map(addr => {
            const provinceObj = findLevel1ById(addr.city);
            const provinceName = provinceObj?.name || addr.city;
            const districtObj = provinceObj?.children?.find((d: any) => String(d.id) === String(addr.district));
            const districtName = districtObj?.name || addr.district;
            const wardObj = districtObj?.children?.find((w: any) => String(w.id) === String(addr.ward));
            const wardName = wardObj?.name || addr.ward;
            return (
              <div key={addr.id} className={`p-4 rounded-lg shadow border ${addr.isDefault ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'} flex flex-col md:flex-row md:items-center md:justify-between animate-fade-in`}>
                <div>
                  <div className="font-bold text-fuchsia-700">{addr.fullName} {addr.isDefault && <span className="ml-2 px-2 py-1 text-xs bg-pink-500 text-white rounded">Mặc định</span>}</div>
                  <div className="text-gray-700">{addr.address}, {wardName}, {districtName}, {provinceName}</div>
                  <div className="text-gray-500 text-sm">SĐT: {addr.phone}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded hover:bg-pink-200 transition">Chọn làm mặc định</button>
                  )}
                  <button onClick={() => handleEdit(addr)} className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition">Sửa</button>
                  <button onClick={() => handleDelete(addr.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition">Xóa</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 
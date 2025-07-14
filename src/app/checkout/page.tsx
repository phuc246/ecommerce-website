"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { level1s, findLevel1ById, Level1, Level2, Level3 } from 'dvhcvn';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { sendPosthogEvent } from '@/lib/utils';

interface Province {
  code: string;
  name_with_type: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const SHIPPING_FEE = 30000;
  const [cartTotal, setCartTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: 'credit_card',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    bankName: '',
    accountNumber: '',
  });
  const [addressType, setAddressType] = useState<'default' | 'new'>('default');
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionInfo, setPromotionInfo] = useState<any>(null);
  const [promotionError, setPromotionError] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availablePromotions, setAvailablePromotions] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [copiedPromo, setCopiedPromo] = useState<{[code: string]: boolean}>({});

  // Lấy danh sách tỉnh/thành
  useEffect(() => {
    fetch("https://vn-public-apis.fpo.vn/provinces/getAll?limit=-1")
      .then(res => res.json())
      .then(data => setProvinces(data.data))
      .catch(() => setProvinces([]));
  }, []);

  // Lấy giỏ hàng từ backend (API /api/cart), không lấy từ localStorage
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/cart');
        if (!res.ok) throw new Error('Không thể tải giỏ hàng');
        const data = await res.json();
        setCartItems(data.items || []);
        const total = Array.isArray(data.items)
          ? data.items.reduce((sum: number, item: any) => sum + ((item.salePrice && item.salePrice !== item.price ? item.salePrice : item.price) * (item.quantity || 1)), 0)
          : 0;
        setCartTotal(total);
      } catch {
        setCartItems([]);
        setCartTotal(0);
      }
    };
    fetchCart();
  }, []);

  // Lấy địa chỉ đã lưu
  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/user/addresses')
      .then(res => res.json())
      .then(data => {
        setAddresses(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          const defaultAddr = data.find((a: any) => a.isDefault) || data[0];
          setForm({
            name: defaultAddr.fullName,
            phone: defaultAddr.phone,
            email: session.user.email,
            address: defaultAddr.address,
          });
          setProvince(defaultAddr.city);
          setDistrict(defaultAddr.district);
          setWard(defaultAddr.ward);
          setAddressType('default');
        } else {
          setAddressType('new');
        }
      });
    // Lấy phương thức thanh toán đã lưu
    fetch('/api/user/payments')
      .then(res => res.json())
      .then(data => {
        setPaymentMethods(Array.isArray(data) ? data : []);
        const defaultPay = Array.isArray(data) ? data.find((p: any) => p.isDefault) : null;
        if (defaultPay) {
          setSelectedPayment(defaultPay.type);
          if (defaultPay.type === 'credit_card') {
            setPaymentForm({
              type: 'credit_card',
              cardNumber: defaultPay.cardNumber || '',
              cardHolder: defaultPay.cardHolder || '',
              expiryDate: defaultPay.expiryDate || '',
              bankName: '',
              accountNumber: '',
            });
          } else if (defaultPay.type === 'bank_transfer') {
            setPaymentForm({
              type: 'bank_transfer',
              cardNumber: '',
              cardHolder: '',
              expiryDate: '',
              bankName: defaultPay.bankName || '',
              accountNumber: defaultPay.accountNumber || '',
            });
          }
        }
      });
  }, [session?.user]);

  useEffect(() => {
    // Lấy danh sách mã giảm giá đang còn hiệu lực
    const fetchPromos = async () => {
      setPromoLoading(true);
      try {
        const res = await fetch('/api/promotions/active');
        const data = await res.json();
        setAvailablePromotions(Array.isArray(data) ? data : []);
      } catch {
        setAvailablePromotions([]);
      } finally {
        setPromoLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPromo(prev => ({ ...prev, [code]: true }));
    setTimeout(() => setCopiedPromo(prev => ({ ...prev, [code]: false })), 2000);
  };

  const districts: Level2[] = province ? (findLevel1ById(String(province))?.children ?? []) : [];
  const wards: Level3[] = district ? (districts.find(d => String(d.id) === String(district))?.children ?? []) : [];

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      alert('Vui lòng nhập họ tên!');
      return;
    }
    
    if (!form.phone.trim()) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }
    
    // Validate phone number format (Vietnamese)
    const phoneRegex = /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      alert('Số điện thoại không hợp lệ!');
      return;
    }
    
    if (!form.email.trim()) {
      alert('Vui lòng nhập email!');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      alert('Email không hợp lệ!');
      return;
    }
    
    if (!province) {
      alert('Vui lòng chọn tỉnh/thành phố!');
      return;
    }
    
    if (!district) {
      alert('Vui lòng chọn quận/huyện!');
      return;
    }
    
    if (!ward) {
      alert('Vui lòng chọn phường/xã!');
      return;
    }
    
    if (!form.address.trim()) {
      alert('Vui lòng nhập địa chỉ chi tiết!');
      return;
    }
    
    if (cartTotal <= 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    
    setLoading(true);
    
    try {
      let addressId = null;
      if (addressType === 'new') {
        // Lưu địa chỉ mới vào profile
        await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: form.name,
            phone: form.phone,
            address: form.address,
            city: province,
            district,
            ward,
            isDefault: addresses.length === 0
          })
        });
      }
      if (paymentMethods.length === 0 && selectedPayment !== 'cod') {
        // Lưu phương thức thanh toán mới làm mặc định
        await fetch('/api/user/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: paymentForm.type,
            cardNumber: paymentForm.cardNumber,
            cardHolder: paymentForm.cardHolder,
            expiryDate: paymentForm.expiryDate,
            bankName: paymentForm.bankName,
            accountNumber: paymentForm.accountNumber,
            isDefault: true
          })
        });
      }
      // Gộp các item trùng productVariantId, price, size
      const mergedItems: any[] = [];
      for (const item of cartItems) {
        const key = `${item.productVariantId || item.id}_${item.price || item.productVariant?.price}_${item.size || item.productVariant?.size || ''}`;
        const variantId = item.productVariantId || item.id;
        const price = item.price || item.productVariant?.price;
        const size = item.size || item.productVariant?.size;
        if (!variantId) continue;
        if (!item.quantity || item.quantity <= 0) continue;
        const found = mergedItems.find(i => i._mergeKey === key);
        if (found) {
          found.quantity += item.quantity;
        } else {
          mergedItems.push({
            productVariantId: variantId,
            quantity: item.quantity,
            price,
            size,
            _mergeKey: key,
          });
        }
      }
      const finalItems = mergedItems.map(({ _mergeKey, ...rest }) => rest);
      // Lấy tên địa chỉ đầy đủ
      const provinceName = findLevel1ById(province)?.name || province;
      const districtName = districts.find(d => String(d.id) === String(district))?.name || district;
      const wardName = wards.find(w => String(w.id) === String(ward))?.name || ward;
      // Gửi đơn hàng
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: finalItems,
          shippingAddress: `${form.address}, ${wardName}, ${districtName}, ${provinceName}`,
          paymentMethod: selectedPayment,
          phone: form.phone,
          promotionCode: promotionInfo?.code || undefined
        })
      });
      if (!response.ok) throw new Error('Đặt hàng thất bại!');
      setOrderSuccess(true);
      // Trigger cập nhật badge/toast ở Navbar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      alert('Đặt hàng thất bại! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromotion = async () => {
    setPromotionError('');
    setPromotionInfo(null);
    setDiscountAmount(0);
    if (!promotionCode.trim()) return;
    try {
      const res = await fetch('/api/promotions/active');
      const data = await res.json();
      const found = Array.isArray(data) ? data.find((p: any) => p.code.toLowerCase() === promotionCode.trim().toLowerCase()) : null;
      if (!found) {
        setPromotionError('Mã giảm giá không hợp lệ hoặc đã hết hạn!');
        return;
      }
      setPromotionInfo(found);
      let discount = 0;
      if (found.discountType === 'PERCENTAGE') {
        discount = Math.round(cartTotal * found.discountValue / 100);
      } else if (found.discountType === 'FIXED_AMOUNT') {
        discount = Math.round(found.discountValue);
      }
      setDiscountAmount(discount);
    } catch {
      setPromotionError('Không thể kiểm tra mã giảm giá!');
    }
  };

  const handleOrderSuccess = (order: { id: string; total: number }) => {
    sendPosthogEvent('order_success', { orderId: order.id, total: order.total });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-fuchsia-100 to-blue-100 py-12 px-2 animate-fade-in">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/40">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 text-center mb-6 drop-shadow animate-fade-in-up">Thanh toán</h1>
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={() => router.push('/cart')} className="px-4 py-2 bg-gradient-to-r from-pink-400 to-fuchsia-400 text-white rounded-lg font-bold shadow hover:scale-105 transition-all">← Quay lại giỏ hàng</button>
          <span className="text-pink-600 font-semibold text-sm bg-pink-100 px-3 py-1 rounded-xl shadow animate-pulse">Giao hàng dự kiến: 3-5 ngày</span>
        </div>
        {orderSuccess ? (
          <div className="text-center py-12 animate-fade-in-up">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            <div className="text-xl font-bold text-pink-600 mb-2 animate-slide-in-down">Đặt hàng thành công!</div>
            <div className="text-gray-600 mb-4 animate-fade-in">Cảm ơn bạn đã mua sắm tại shop!</div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <button className="px-6 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl font-bold shadow hover:scale-110 hover:shadow-xl transition-all animate-fade-in-up" onClick={() => router.push("/")}>Về trang chủ</button>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-pink-400 text-white rounded-xl font-bold shadow hover:scale-110 hover:shadow-xl transition-all animate-fade-in-up" onClick={() => router.push("/profile/orders")}>Xem đơn hàng</button>
            </div>
          </div>
        ) : (
          <form className="space-y-5 animate-fade-in-up" onSubmit={handleSubmit}>
            <div className="mb-4 flex gap-4 items-center">
              <label>
                <input
                  type="radio"
                  checked={addressType === 'default'}
                  disabled={addresses.length === 0}
                  onChange={() => {
                    setAddressType('default');
                    if (addresses.length > 0) {
                      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
                      setForm({
                        name: defaultAddr.fullName,
                        phone: defaultAddr.phone,
                        email: session?.user?.email || '',
                        address: defaultAddr.address,
                      });
                      setProvince(defaultAddr.city);
                      setDistrict(defaultAddr.district);
                      setWard(defaultAddr.ward);
                    }
                  }}
                />
                <span className="ml-2">Dùng địa chỉ mặc định</span>
              </label>
              <label>
                <input
                  type="radio"
                  checked={addressType === 'new'}
                  onChange={() => {
                    setAddressType('new');
                    setForm({ name: '', phone: '', email: session?.user?.email || '', address: '' });
                    setProvince('');
                    setDistrict('');
                    setWard('');
                  }}
                />
                <span className="ml-2">Nhập địa chỉ mới</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Họ tên</label>
                <input name="name" required value={form.name} onChange={handleChange} disabled={addressType === 'default'} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" title="Họ tên" placeholder="Nhập họ tên" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Số điện thoại</label>
                <input name="phone" required value={form.phone} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" title="Số điện thoại" placeholder="Nhập số điện thoại" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Email</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" title="Email" placeholder="Nhập email" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Tỉnh/Thành phố</label>
                <select required value={province} onChange={e => { setProvince(String(e.target.value)); setDistrict(""); setWard(""); }} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" title="Tỉnh/Thành phố">
                  <option value="">Chọn tỉnh/thành</option>
                  {level1s.map((p: Level1) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Quận/Huyện</label>
                <select required value={district} onChange={e => { setDistrict(String(e.target.value)); setWard(""); }} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" disabled={!province} title="Quận/Huyện">
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((d: Level2) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-pink-600 mb-1">Phường/Xã</label>
                <select required value={ward} onChange={e => setWard(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" disabled={!district} title="Phường/Xã">
                  <option value="">Chọn phường/xã</option>
                  {wards.map((w: Level3) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-pink-600 mb-1">Địa chỉ chi tiết</label>
                <input name="address" required value={form.address} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-pink-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white/80" placeholder="Số nhà, tên đường..." />
              </div>
            </div>
            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 shadow mb-4">
              <div className="font-bold text-pink-700 mb-2">Sản phẩm trong đơn hàng</div>
              <div className="divide-y divide-pink-100">
                {cartItems.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">Giỏ hàng trống</div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-4 py-2">
                      <img src={item.variantImage || item.productVariant?.image || item.productVariant?.product?.image} alt={item.productVariant?.product?.name} className="w-14 h-14 rounded-lg object-cover border border-pink-200" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.productVariant?.product?.name}</div>
                        <div className="text-xs text-gray-500">Màu: {item.productVariant?.color} | Size: {item.productVariant?.size}</div>
                      </div>
                      <div className="text-sm text-gray-700">x{item.quantity}</div>
                      <div className="text-pink-600 font-bold min-w-[80px] text-right">
                        {((item.salePrice && item.salePrice !== item.price ? item.salePrice : item.price) * item.quantity).toLocaleString()}đ
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-pink-600 mb-1">Phương thức thanh toán</label>
              <div className="flex gap-4 mb-2">
                <button type="button" className={`px-4 py-2 rounded-lg border ${selectedPayment === 'cod' ? 'bg-fuchsia-500 text-white' : 'bg-white text-fuchsia-700 border-fuchsia-200'}`} onClick={() => { setSelectedPayment('cod'); setShowPaymentForm(false); }}>Thanh toán khi nhận hàng (COD)</button>
                <button type="button" className={`px-4 py-2 rounded-lg border ${selectedPayment === 'bank_transfer' ? 'bg-fuchsia-500 text-white' : 'bg-white text-fuchsia-700 border-fuchsia-200'}`} onClick={() => { setSelectedPayment('bank_transfer'); setShowPaymentForm(true); setPaymentForm({ ...paymentForm, type: 'bank_transfer' }); }}>Chuyển khoản ngân hàng</button>
                <button type="button" className={`px-4 py-2 rounded-lg border ${selectedPayment === 'credit_card' ? 'bg-fuchsia-500 text-white' : 'bg-white text-fuchsia-700 border-fuchsia-200'}`} onClick={() => { setSelectedPayment('credit_card'); setShowPaymentForm(true); setPaymentForm({ ...paymentForm, type: 'credit_card' }); }}>Thẻ tín dụng/ghi nợ</button>
              </div>
              {showPaymentForm && selectedPayment === 'bank_transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Ngân hàng</label>
                    <input value={paymentForm.bankName} onChange={e => setPaymentForm({ ...paymentForm, bankName: e.target.value })} className="w-full p-2 border border-pink-200 rounded-md" placeholder="Tên ngân hàng" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Số tài khoản</label>
                    <input value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} className="w-full p-2 border border-pink-200 rounded-md" placeholder="Số tài khoản" />
                  </div>
                </div>
              )}
              {showPaymentForm && selectedPayment === 'credit_card' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Số thẻ</label>
                    <input value={paymentForm.cardNumber} onChange={e => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })} className="w-full p-2 border border-pink-200 rounded-md" placeholder="Số thẻ" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Tên chủ thẻ</label>
                    <input value={paymentForm.cardHolder} onChange={e => setPaymentForm({ ...paymentForm, cardHolder: e.target.value })} className="w-full p-2 border border-pink-200 rounded-md" placeholder="Tên chủ thẻ" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Ngày hết hạn</label>
                    <input value={paymentForm.expiryDate} onChange={e => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })} className="w-full p-2 border border-pink-200 rounded-md" placeholder="MM/YY" />
                  </div>
                </div>
              )}
            </div>
            {/* --- Compact voucher box --- */}
            <div className="mb-2">
              <div className="font-bold text-pink-700 mb-1 flex items-center gap-2">
                <Sparkles className="text-yellow-400 animate-pulse" size={18} />
                Mã giảm giá đang có
              </div>
              <div
                className={
                  availablePromotions.length > 2
                    ? 'flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-pink-200 scrolling-touch'
                    : 'flex flex-wrap gap-2'
                }
              >
                {promoLoading ? (
                  <div className="text-gray-400 text-sm">Đang tải...</div>
                ) : availablePromotions.length === 0 ? (
                  <div className="text-gray-400 text-sm">Chưa có mã giảm giá nào</div>
                ) : (
                  availablePromotions.map((promo) => (
                    <div
                      key={promo.id}
                      className={
                        'flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1 text-sm font-mono shadow-sm' +
                        (availablePromotions.length > 2 ? ' min-w-[210px] max-w-[320px]' : '')
                      }
                    >
                      <span className="font-bold text-pink-700">{promo.code}</span>
                      <span className="text-xs font-semibold text-pink-700 bg-white/80 rounded px-2 py-0.5">
                        {promo.discountType === 'PERCENTAGE'
                          ? `Giảm ${promo.discountValue}%`
                          : promo.discountType === 'FIXED_AMOUNT'
                            ? `Giảm ${Number(promo.discountValue).toLocaleString()}đ`
                            : ''}
                      </span>
                      <button
                        type="button"
                        className="ml-1 px-2 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200 transition text-xs font-bold"
                        onClick={() => handleCopyPromo(promo.code)}
                        aria-label="Sao chép mã giảm giá"
                      >
                        {copiedPromo[promo.code] ? 'Đã sao chép!' : 'Sao chép'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* --- End compact voucher box --- */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2 bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow">
              <div className="flex-1">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={promotionCode}
                  onChange={e => setPromotionCode(e.target.value)}
                  className="bg-white/80 border-yellow-300 focus:ring-yellow-400"
                />
              </div>
              <Button type="button" onClick={handleApplyPromotion} variant="default" className="min-w-[120px] bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-bold shadow hover:scale-105">Áp dụng</Button>
            </div>
            {promotionError && <div className="text-red-500 text-sm mb-2">{promotionError}</div>}
            {promotionInfo && (
              <div className="text-pink-700 text-sm mb-2">Áp dụng mã <b>{promotionInfo.code}</b>: {promotionInfo.discountType === 'PERCENTAGE' ? `${promotionInfo.discountValue}%` : `${promotionInfo.discountValue.toLocaleString()}đ`} - Giảm {discountAmount.toLocaleString()}đ</div>
            )}
            <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-pink-50 rounded-xl p-4 border border-pink-100 shadow">
              <div>
                <div className="text-pink-700 font-semibold">Phí vận chuyển: <span className="font-bold">{SHIPPING_FEE.toLocaleString()}đ</span></div>
                <div className="text-pink-700 font-semibold">Tổng tiền hàng: <span className="font-bold">{cartTotal.toLocaleString()}đ</span></div>
                <div className="text-pink-700 font-semibold ">Giảm giá: <span className="font-bold">-{Number(discountAmount) > 0 ? Number(discountAmount).toLocaleString() : '0'}đ</span></div>
                <div className="text-pink-700 font-bold text-lg mt-1">Tổng thanh toán: <span className="text-2xl">{(cartTotal - discountAmount + SHIPPING_FEE).toLocaleString()}đ</span></div>
              </div>
              <button type="submit" className="px-8 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl font-bold shadow hover:scale-110 hover:shadow-xl transition-all text-lg">Xác nhận đặt hàng</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
}

interface PaymentMethodsTabProps {
  userId: string;
}

export default function PaymentMethodsTab({ userId }: PaymentMethodsTabProps) {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Form state
  const [paymentType, setPaymentType] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/payments');
      
      if (!response.ok) {
        throw new Error('Không thể tải phương thức thanh toán');
      }
      
      const data = await response.json();
      setPaymentMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentType('credit_card');
    setCardNumber('');
    setCardHolder('');
    setExpiryDate('');
    setBankName('');
    setAccountNumber('');
    setIsDefault(false);
  };

  const handleEdit = (payment: PaymentMethod) => {
    setEditingPaymentId(payment.id);
    setPaymentType(payment.type);
    setCardNumber(payment.cardNumber || '');
    setCardHolder(payment.cardHolder || '');
    setExpiryDate(payment.expiryDate || '');
    setBankName(payment.bankName || '');
    setAccountNumber(payment.accountNumber || '');
    setIsDefault(payment.isDefault);
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingPaymentId(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const paymentData: any = {
      type: paymentType,
      isDefault,
    };
    
    if (paymentType === 'credit_card') {
      paymentData.cardNumber = cardNumber;
      paymentData.cardHolder = cardHolder;
      paymentData.expiryDate = expiryDate;
    } else if (paymentType === 'bank_transfer') {
      paymentData.bankName = bankName;
      paymentData.accountNumber = accountNumber;
    }
    
    try {
      let url = '/api/user/payments';
      let method = 'POST';
      
      if (editingPaymentId) {
        url = `/api/user/payments/${editingPaymentId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi lưu phương thức thanh toán');
      }
      
      // Refresh the payment methods list
      await fetchPaymentMethods();
      
      // Reset form and close form
      resetForm();
      setIsAddingNew(false);
      setEditingPaymentId(null);
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu phương thức thanh toán');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/user/payments/${paymentId}/default`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Không thể đặt làm phương thức thanh toán mặc định');
      }
      
      // Update local state
      setPaymentMethods(payments => payments.map(payment => ({
        ...payment,
        isDefault: payment.id === paymentId
      })));
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phương thức thanh toán này không?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/user/payments/${paymentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa phương thức thanh toán');
      }
      
      // Update local state
      setPaymentMethods(payments => payments.filter(payment => payment.id !== paymentId));
      
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa phương thức thanh toán');
    }
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-md"></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Phương thức thanh toán</h2>
        {!isAddingNew && !editingPaymentId && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Thêm phương thức thanh toán
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {(isAddingNew || editingPaymentId) ? (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingPaymentId ? 'Chỉnh sửa phương thức thanh toán' : 'Thêm phương thức thanh toán mới'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Loại thanh toán
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit_card"
                    checked={paymentType === 'credit_card'}
                    onChange={() => setPaymentType('credit_card')}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Thẻ tín dụng/ghi nợ</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bank_transfer"
                    checked={paymentType === 'bank_transfer'}
                    onChange={() => setPaymentType('bank_transfer')}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Chuyển khoản ngân hàng</span>
                </label>
              </div>
            </div>
            
            {paymentType === 'credit_card' ? (
              <>
                <div className="mb-4">
                  <label htmlFor="cardNumber" className="block mb-1 text-sm font-medium text-gray-700">
                    Số thẻ
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="XXXX XXXX XXXX XXXX"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="cardHolder" className="block mb-1 text-sm font-medium text-gray-700">
                    Tên chủ thẻ
                  </label>
                  <input
                    type="text"
                    id="cardHolder"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="expiryDate" className="block mb-1 text-sm font-medium text-gray-700">
                    Ngày hết hạn
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label htmlFor="bankName" className="block mb-1 text-sm font-medium text-gray-700">
                    Ngân hàng
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="accountNumber" className="block mb-1 text-sm font-medium text-gray-700">
                    Số tài khoản
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </>
            )}
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Đặt làm phương thức thanh toán mặc định</span>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu phương thức thanh toán'}
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
      ) : paymentMethods.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <p className="text-gray-500 mb-4">Bạn chưa thêm phương thức thanh toán nào</p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Thêm phương thức thanh toán
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((payment) => (
            <div 
              key={payment.id} 
              className={`p-4 border rounded-md ${payment.isDefault ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}
            >
              {payment.isDefault && (
                <div className="flex items-center mb-2 text-indigo-600 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Phương thức mặc định
                </div>
              )}

              {payment.type === 'credit_card' ? (
                <>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium">Thẻ tín dụng/ghi nợ</span>
                  </div>
                  <div className="text-gray-600 mb-1">{payment.cardHolder}</div>
                  <div className="text-gray-600 mb-1">{payment.cardNumber && formatCardNumber(payment.cardNumber)}</div>
                  <div className="text-gray-600 mb-3">Hết hạn: {payment.expiryDate}</div>
                </>
              ) : (
                <>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    <span className="font-medium">Chuyển khoản ngân hàng</span>
                  </div>
                  <div className="text-gray-600 mb-1">{payment.bankName}</div>
                  <div className="text-gray-600 mb-3">Số tài khoản: {payment.accountNumber}</div>
                </>
              )}
              
              <div className="flex space-x-2 text-sm">
                <button
                  onClick={() => handleEdit(payment)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Chỉnh sửa
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Xóa
                </button>
                {!payment.isDefault && (
                  <>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleSetDefault(payment.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Đặt làm mặc định
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
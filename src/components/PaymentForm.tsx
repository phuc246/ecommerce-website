"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface PaymentFormProps {
  payment?: {
    id: string;
    type: string;
    cardNumber?: string;
    expiryDate?: string;
    cardHolder?: string;
    bankName?: string;
    accountNumber?: string;
    isDefault: boolean;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentForm({ payment, onClose, onSuccess }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    type: payment?.type || "credit_card",
    cardNumber: payment?.cardNumber || "",
    expiryDate: payment?.expiryDate || "",
    cardHolder: payment?.cardHolder || "",
    bankName: payment?.bankName || "",
    accountNumber: payment?.accountNumber || "",
    isDefault: payment?.isDefault || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payments${payment ? `/${payment.id}` : ""}`, {
        method: payment ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save payment method");
      }

      toast.success(payment ? "Đã cập nhật phương thức thanh toán" : "Đã thêm phương thức thanh toán mới");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Không thể lưu phương thức thanh toán");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Loại thanh toán
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="credit_card">Thẻ tín dụng</option>
          <option value="bank_transfer">Chuyển khoản ngân hàng</option>
        </select>
      </div>

      {formData.type === "credit_card" ? (
        <>
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
              Số thẻ
            </label>
            <input
              type="text"
              id="cardNumber"
              required
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700">
              Tên chủ thẻ
            </label>
            <input
              type="text"
              id="cardHolder"
              required
              value={formData.cardHolder}
              onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
              Ngày hết hạn (MM/YY)
            </label>
            <input
              type="text"
              id="expiryDate"
              required
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
              Tên ngân hàng
            </label>
            <input
              type="text"
              id="bankName"
              required
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
              Số tài khoản
            </label>
            <input
              type="text"
              id="accountNumber"
              required
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
          Đặt làm phương thức thanh toán mặc định
        </label>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {isSubmitting ? "Đang lưu..." : payment ? "Cập nhật" : "Thêm"}
        </button>
      </div>
    </form>
  );
} 
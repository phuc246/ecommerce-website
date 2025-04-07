"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Tab } from "@headlessui/react";
import { Dialog } from "@headlessui/react";
import AddressForm from "@/components/AddressForm";
import PaymentForm from "@/components/PaymentForm";
import OrderDetail from "@/components/OrderDetail";

interface UserProfile {
  name: string;
  email: string;
  preferences: {
    favoriteCategories: string[];
    notificationSettings: {
      email: boolean;
      sms: boolean;
    };
    language: string;
  };
}

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

interface Payment {
  id: string;
  type: string;
  cardNumber?: string;
  expiryDate?: string;
  cardHolder?: string;
  bankName?: string;
  accountNumber?: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: {
    product: {
      name: string;
      image: string;
    };
    quantity: number;
    price: number;
  }[];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    preferences: {
      favoriteCategories: [],
      notificationSettings: {
        email: true,
        sms: false,
      },
      language: "vi",
    },
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSort, setOrderSort] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
      fetchAddresses();
      fetchPayments();
      fetchOrders();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Không thể tải thông tin hồ sơ");
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/addresses");
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Không thể tải địa chỉ");
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Không thể tải thông tin thanh toán");
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Cập nhật hồ sơ thành công");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Không thể cập nhật hồ sơ");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "all") return true;
    if (order.status === orderFilter) return true;
    if (startDate && endDate) {
      const orderDate = new Date(order.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate >= start && orderDate <= end) return true;
    }
    return false;
  }).sort((a, b) => {
    if (orderSort === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (orderSort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (orderSort === "highest") {
      return b.total - a.total;
    }
    return a.total - b.total;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Đang tải thông tin hồ sơ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex border-b border-gray-200">
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `px-4 py-2 text-sm font-medium ${
                    selected
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Thông tin cá nhân
              </Tab>
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `px-4 py-2 text-sm font-medium ${
                    selected
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Địa chỉ giao hàng
              </Tab>
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `px-4 py-2 text-sm font-medium ${
                    selected
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Thông tin thanh toán
              </Tab>
              <Tab
                className={({ selected }: { selected: boolean }) =>
                  `px-4 py-2 text-sm font-medium ${
                    selected
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                Lịch sử đơn hàng
              </Tab>
            </Tab.List>

            <Tab.Panels className="p-6">
              <Tab.Panel>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profile.email}
                        disabled
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sở thích
                      </label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="fashion"
                            checked={profile.preferences.favoriteCategories.includes(
                              "fashion"
                            )}
                            onChange={(e) => {
                              const categories = e.target.checked
                                ? [...profile.preferences.favoriteCategories, "fashion"]
                                : profile.preferences.favoriteCategories.filter(
                                    (cat) => cat !== "fashion"
                                  );
                              setProfile({
                                ...profile,
                                preferences: {
                                  ...profile.preferences,
                                  favoriteCategories: categories,
                                },
                              });
                            }}
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="fashion"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Thời trang
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="electronics"
                            checked={profile.preferences.favoriteCategories.includes(
                              "electronics"
                            )}
                            onChange={(e) => {
                              const categories = e.target.checked
                                ? [
                                    ...profile.preferences.favoriteCategories,
                                    "electronics",
                                  ]
                                : profile.preferences.favoriteCategories.filter(
                                    (cat) => cat !== "electronics"
                                  );
                              setProfile({
                                ...profile,
                                preferences: {
                                  ...profile.preferences,
                                  favoriteCategories: categories,
                                },
                              });
                            }}
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="electronics"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Điện tử
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="books"
                            checked={profile.preferences.favoriteCategories.includes(
                              "books"
                            )}
                            onChange={(e) => {
                              const categories = e.target.checked
                                ? [...profile.preferences.favoriteCategories, "books"]
                                : profile.preferences.favoriteCategories.filter(
                                    (cat) => cat !== "books"
                                  );
                              setProfile({
                                ...profile,
                                preferences: {
                                  ...profile.preferences,
                                  favoriteCategories: categories,
                                },
                              });
                            }}
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="books"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Sách
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Cài đặt thông báo
                      </label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="email-notification"
                            checked={profile.preferences.notificationSettings.email}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                preferences: {
                                  ...profile.preferences,
                                  notificationSettings: {
                                    ...profile.preferences.notificationSettings,
                                    email: e.target.checked,
                                  },
                                },
                              })
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="email-notification"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Thông báo qua email
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="sms-notification"
                            checked={profile.preferences.notificationSettings.sms}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                preferences: {
                                  ...profile.preferences,
                                  notificationSettings: {
                                    ...profile.preferences.notificationSettings,
                                    sms: e.target.checked,
                                  },
                                },
                              })
                            }
                            disabled={!isEditing}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor="sms-notification"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Thông báo qua SMS
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Ngôn ngữ
                      </label>
                      <select
                        id="language"
                        value={profile.preferences.language}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              language: e.target.value,
                            },
                          })
                        }
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Chỉnh sửa
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            fetchProfile();
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Lưu thay đổi
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </Tab.Panel>

              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddress(null);
                        setShowAddressForm(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Thêm địa chỉ mới
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="border rounded-lg p-4 relative"
                      >
                        {address.isDefault && (
                          <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Mặc định
                          </span>
                        )}
                        <h3 className="text-lg font-medium">{address.fullName}</h3>
                        <p className="mt-1 text-gray-500">{address.phone}</p>
                        <p className="mt-1 text-gray-500">
                          {address.address}, {address.ward}, {address.district},{" "}
                          {address.city}
                        </p>
                        <div className="mt-4 flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAddress(address);
                              setShowAddressForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/addresses/${address.id}`, {
                                  method: "DELETE",
                                });
                                if (!response.ok) {
                                  throw new Error("Failed to delete address");
                                }
                                toast.success("Đã xóa địa chỉ");
                                fetchAddresses();
                              } catch (error) {
                                console.error("Error deleting address:", error);
                                toast.error("Không thể xóa địa chỉ");
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Panel>

              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPayment(null);
                        setShowPaymentForm(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Thêm phương thức thanh toán
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-4 relative"
                      >
                        {payment.isDefault && (
                          <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Mặc định
                          </span>
                        )}
                        <h3 className="text-lg font-medium">
                          {payment.type === "credit_card"
                            ? "Thẻ tín dụng"
                            : "Chuyển khoản ngân hàng"}
                        </h3>
                        {payment.type === "credit_card" ? (
                          <>
                            <p className="mt-1 text-gray-500">
                              **** **** **** {payment.cardNumber?.slice(-4)}
                            </p>
                            <p className="mt-1 text-gray-500">
                              {payment.cardHolder}
                            </p>
                            <p className="mt-1 text-gray-500">
                              Hết hạn: {payment.expiryDate}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 text-gray-500">
                              {payment.bankName}
                            </p>
                            <p className="mt-1 text-gray-500">
                              {payment.accountNumber}
                            </p>
                          </>
                        )}
                        <div className="mt-4 flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowPaymentForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/payments/${payment.id}`, {
                                  method: "DELETE",
                                });
                                if (!response.ok) {
                                  throw new Error("Failed to delete payment method");
                                }
                                toast.success("Đã xóa phương thức thanh toán");
                                fetchPayments();
                              } catch (error) {
                                console.error("Error deleting payment method:", error);
                                toast.error("Không thể xóa phương thức thanh toán");
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Tab.Panel>

              <Tab.Panel>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          aria-label="Từ ngày"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          aria-label="Đến ngày"
                        />
                        {(startDate || endDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <select
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        aria-label="Lọc đơn hàng"
                      >
                        <option value="all">Tất cả</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="SHIPPED">Đang giao</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                      <select
                        value={orderSort}
                        onChange={(e) => setOrderSort(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        aria-label="Sắp xếp đơn hàng"
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="highest">Giá cao nhất</option>
                        <option value="lowest">Giá thấp nhất</option>
                      </select>
                    </div>
                  </div>

                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">
                            Đơn hàng #{order.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : order.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status === "DELIVERED"
                            ? "Đã giao"
                            : order.status === "CANCELLED"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4"
                          >
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">
                                {item.product.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {item.quantity} x{" "}
                                {item.price.toLocaleString("vi-VN")}đ
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-lg font-medium">
                          Tổng cộng:{" "}
                          {order.total.toLocaleString("vi-VN")}đ
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Address Form Dialog */}
      <Dialog
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Panel className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <Dialog.Title className="text-lg font-medium mb-6">
              {selectedAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </Dialog.Title>
            <AddressForm
              address={selectedAddress || undefined}
              onClose={() => setShowAddressForm(false)}
              onSuccess={() => {
                setShowAddressForm(false);
                fetchAddresses();
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Payment Form Dialog */}
      <Dialog
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Panel className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <Dialog.Title className="text-lg font-medium mb-6">
              {selectedPayment ? "Chỉnh sửa phương thức thanh toán" : "Thêm phương thức thanh toán"}
            </Dialog.Title>
            <PaymentForm
              payment={selectedPayment || undefined}
              onClose={() => setShowPaymentForm(false)}
              onSuccess={() => {
                setShowPaymentForm(false);
                fetchPayments();
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Panel className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg p-8 max-w-4xl w-full mx-4">
            <Dialog.Title className="text-lg font-medium mb-6">
              Chi tiết đơn hàng
            </Dialog.Title>
            {selectedOrder && (
              <OrderDetail
                orderId={selectedOrder}
                onClose={() => {
                  setSelectedOrder(null);
                  fetchOrders();
                }}
              />
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
} 
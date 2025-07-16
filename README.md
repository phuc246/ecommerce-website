# Doovin Ecommerce Website

**Tag:**  
`nextjs` `ecommerce` `prisma` `postgresql` `cloudinary` `tailwindcss` `nextauth` `admin` `react` `typescript` `vercel` `responsive` `shop` `cart` `wishlist` `order` `dashboard` `analytics` `upload` `crop` `framer-motion` `posthog` `swr` `zod` `radix-ui` `daisyui`

---

## Live Demo

Trải nghiệm ngay tại:  
👉 [https://ecommercedoovin.vercel.app/](https://ecommercedoovin.vercel.app/)

---

## 🚀 Tính năng nổi bật

- Đăng ký, đăng nhập, xác thực người dùng (NextAuth, Google, Email)
- Trang chủ hiện đại với video background, hiệu ứng động, banner khuyến mãi, sản phẩm nổi bật, trending, dịch vụ
- Tìm kiếm, lọc, phân loại sản phẩm, wishlist, giỏ hàng, đặt hàng
- Quản lý đơn hàng, trạng thái, lịch sử mua hàng
- Quản lý sản phẩm, thuộc tính (occasion wear), danh mục, màu sắc, size, biến thể, ảnh, mô tả
- Quản lý voucher/khuyến mãi, xu hướng, dịch vụ, đánh giá sản phẩm
- Dashboard thống kê: doanh thu, đơn hàng, người dùng, sản phẩm bán chạy, biểu đồ động
- Trang tĩnh: About, Liên hệ, Chính sách, v.v.
- Responsive UI: tối ưu cho desktop, tablet, mobile
- **Phân quyền admin**: chỉ truy cập admin bằng máy tính/tablet, mobile sẽ bị chặn
- **Phân tích hành vi người dùng với PostHog**:  
  > PostHog được tích hợp để thu thập, phân tích hành vi người dùng trên website (click, pageview, sự kiện mua hàng, v.v.), giúp tối ưu trải nghiệm và hỗ trợ quyết định kinh doanh.

---

## 👤 Hướng dẫn cho User

- Đăng ký, đăng nhập, cập nhật thông tin cá nhân, đổi mật khẩu
- Duyệt, tìm kiếm, lọc sản phẩm theo danh mục, thuộc tính, màu sắc, size, giá, xu hướng, occasion wear
- Thêm sản phẩm vào wishlist, giỏ hàng, đặt hàng nhanh chóng
- Quản lý đơn hàng, xem lịch sử mua, đánh giá sản phẩm
- Lưu địa chỉ, phương thức thanh toán, quản lý tài khoản

---

## 🛠️ Hướng dẫn cho Admin

- Đăng nhập với quyền admin (chỉ trên desktop/tablet)
- Quản lý sản phẩm: thêm, sửa, xóa, upload ảnh, thuộc tính, biến thể, occasion wear
- Quản lý danh mục, màu sắc, size, voucher/khuyến mãi, xu hướng, dịch vụ
- Quản lý đơn hàng, trạng thái, người dùng, đánh giá, footer, logo, cài đặt hệ thống
- Dashboard thống kê trực quan, biểu đồ động, top sản phẩm, doanh thu, người dùng mới
- Theo dõi hành vi người dùng qua PostHog analytics

---

## 🏗️ Kiến trúc & Công nghệ

- **Next.js 14** (App Router, SSR, API Route)
- **Prisma ORM & PostgreSQL** (Docker)
- **NextAuth** (JWT, Google, Email)
- **TailwindCSS + daisyUI + custom CSS**
- **Cloudinary** (upload, crop, preview ảnh)
- **Framer Motion**, **react-hot-toast**, **react-hook-form**, **zod**, **swr**
- **PostHog** (analytics: thu thập, phân tích hành vi người dùng, hỗ trợ tối ưu trải nghiệm & quyết định kinh doanh)
- **Nivo, Recharts** (biểu đồ động)
- **JSPDF, xlsx** (xuất báo cáo PDF, Excel)
- **Radix UI** (UI primitives)
- **Vercel** (deploy)

---

## 🗂️ Cấu trúc thư mục

- `src/app/`: Routing, page, API route, layout
- `src/components/`: Tất cả component UI (admin, user, home, form, v.v.)
- `src/hooks/`: Custom React hooks
- `src/lib/`: Auth, prisma, utils, validation
- `src/types/`: Định nghĩa type, interface
- `prisma/`: Schema, migration, seed
- `public/`: Ảnh tĩnh, icon, video, logo

---

## 🛠️ Hướng dẫn cài đặt & phát triển

### 1. Clone & cài đặt

```bash
git clone https://github.com/your-username/ecommerce-website-5.git
cd ecommerce-website-5
npm install
```

### 2. Khởi động database (PostgreSQL)

```bash
docker-compose up -d
```

### 3. Thiết lập biến môi trường

Tạo file `.env` và điền các biến cần thiết (xem `.env.example` nếu có).

### 4. Khởi tạo database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Chạy local

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

---

## 🏷️ Quản lý thuộc tính (Use Cases / Occasion Wear)

- **Admin** có thể tạo, sửa, xóa các thuộc tính sản phẩm (VD: “Dạo phố”, “Công sở”, “Dự tiệc”, “Du lịch”, “Thể thao”, “Ở nhà”, v.v.)
- Mỗi thuộc tính là một mục đích sử dụng hoặc tình huống mặc đồ (occasion wear)
- Sản phẩm có thể gắn nhiều thuộc tính, giúp khách hàng lọc sản phẩm theo nhu cầu thực tế
- Lịch sử thao tác thuộc tính được ghi lại (ai tạo, sửa, xóa, khi nào)
- **Khách hàng** có thể lọc sản phẩm theo occasion wear (VD: chỉ xem đồ đi tiệc, đồ công sở...)

---

## 🎟️ Quản lý voucher (Mã giảm giá)

- **Admin** có thể tạo, sửa, xóa, kích hoạt/vô hiệu hóa các mã giảm giá (voucher)
- Hỗ trợ nhiều loại: giảm giá cố định, giảm theo phần trăm, giới hạn số lần sử dụng, thời gian hiệu lực, ảnh nền cho mã
- Lịch sử thao tác voucher được ghi lại
- **Người dùng** nhập mã khi thanh toán để được giảm giá

---

## 🔥 Quản lý xu hướng (Trends)

- **Admin** tạo, sửa, xóa các xu hướng thời trang (trend), mỗi trend có tên, ảnh đại diện, danh sách sản phẩm liên quan
- Có thể gắn sản phẩm vào nhiều trend, giúp khách hàng khám phá các bộ sưu tập, phong cách nổi bật
- Lịch sử thao tác trend được ghi lại

---

## 🛎️ Dịch vụ

- Trang dịch vụ giới thiệu các tiện ích, cam kết, chính sách hậu mãi, bảo hành, đổi trả, giao hàng, chăm sóc khách hàng, v.v.
- Hiển thị nổi bật trên trang chủ và các trang liên quan

---

## 📝 Các trang tĩnh: About, Liên hệ, Chính sách

- **About:** Giới thiệu về Doovin, sứ mệnh, giá trị, hành trình phát triển, đội ngũ, đối tác, testimonial khách hàng
- **Liên hệ:** Thông tin liên hệ, hotline, email, địa chỉ, form gửi tin nhắn, liên kết mạng xã hội
- **Chính sách:** Bảo mật, điều khoản sử dụng, đổi trả, vận chuyển, thanh toán

---

## 📊 Trang Dashboard (Admin)

- Thống kê tổng quan: doanh thu, số đơn hàng, số người dùng, số sản phẩm
- Biểu đồ doanh thu, đơn hàng, người dùng mới theo tháng
- Top sản phẩm bán chạy, trạng thái đơn hàng
- Xuất báo cáo Excel, PDF
- Card số liệu động, hiệu ứng đẹp, responsive

---

## 🗄️ Database Schema (Prisma)

Các bảng chính:
- **User, Account, Session:** người dùng, xác thực
- **Product, ProductImage, ProductVariant, ProductAttribute, Category**
- **Cart, CartItem, Wishlist**
- **Order, OrderItem, Review, Payment, Address**
- **Promotion, Trend, Log, Setting, Logo**

> Xem chi tiết trong `prisma/schema.prisma`.

---

## 🔌 API Routes

- `/api/auth/*` - Xác thực, đăng nhập, đăng xuất, đổi mật khẩu
- `/api/products`, `/api/categories`, `/api/orders`, `/api/cart`, `/api/reviews`, ...
- `/api/admin/*` - Quản trị (chỉ ADMIN)
- `/api/upload` - Upload ảnh lên Cloudinary

---

## 🖼️ Upload ảnh sản phẩm

- Ảnh được upload lên Cloudinary, crop, preview, nén tự động
- Chỉ render ảnh khi đã có URL Cloudinary hợp lệ
- Hỗ trợ drag & drop, reorder, xóa ảnh, crop ảnh

---

## 🔒 Bảo mật & UX

- Chỉ cho phép admin truy cập trang quản trị từ desktop/tablet  
  (Nếu truy cập admin bằng mobile: hiện cảnh báo, yêu cầu đăng xuất)
- Tất cả API admin đều kiểm tra role, session
- Xác thực NextAuth, JWT, Google, Email

---

## 📄 License

MIT License.

---

**Enjoy Doovin Ecommerce! 🚀** 
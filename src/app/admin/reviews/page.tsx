import ReviewsTable from '@/components/admin/ReviewsTable';

export default function AdminReviewsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý đánh giá sản phẩm</h1>
      <ReviewsTable />
    </div>
  );
} 
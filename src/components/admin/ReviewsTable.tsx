'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Cần phản hồi', value: 'unreplied' },
  { label: 'Đã trả lời', value: 'replied' },
];
const STAR_OPTIONS = [5, 4, 3, 2, 1];

// Type cho review (dùng cho bảng admin)
interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  product?: { id: string; name: string; image?: string };
  user?: { id: string; name?: string };
  productId?: string;
  orderId?: string;
  productVariantId?: string;
}

// Hook lấy thông tin variant cho nhiều review
function useVariantsInfo(reviews: Review[]): Record<string, { color?: string; size?: string }> {
  const [variantMap, setVariantMap] = useState<Record<string, { color?: string; size?: string }>>({});
  useEffect(() => {
    const ids = Array.from(new Set(reviews.map((r: Review) => r.productVariantId).filter(Boolean)));
    if (ids.length === 0) return;
    Promise.all(ids.map(id => fetch(`/api/admin/products/variant/${id}`).then(res => res.json()))).then(datas => {
      const map: Record<string, { color?: string; size?: string }> = {};
      datas.forEach((v, i) => { if (v && v.id) map[v.id] = v; });
      setVariantMap(map);
    });
  }, [reviews]);
  return variantMap;
}

export default function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  // Filter state
  const [status, setStatus] = useState('all');
  const [starFilter, setStarFilter] = useState<number[]>([5,4,3,2,1]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetch('/api/products/shop?page=1&limit=1000')
      .then(res => res.json())
      .then(data => {
        const products = data.products || [];
        Promise.all(products.map((p: any) =>
          fetch(`/api/products/${p.id}/reviews`).then(r => r.json()).then(rs => rs.map((r: any) => ({...r, product: p})))
        )).then(allReviews => {
          setReviews(allReviews.flat());
          setLoading(false);
        });
      });
  }, []);

  const handleReply = async (id: string) => {
    if (!reply.trim()) return toast.error('Vui lòng nhập nội dung trả lời');
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply }),
    });
    if (res.ok) {
      toast.success('Đã trả lời đánh giá');
      setReviews(reviews.map(r => r.id === id ? { ...r, reply } : r));
      setReplyingId(null);
      setReply('');
    } else {
      toast.error('Lỗi khi trả lời đánh giá');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Đã xóa đánh giá');
      setReviews(reviews.filter(r => r.id !== id));
    } else {
      toast.error('Lỗi khi xóa đánh giá');
    }
  };

  // Filter logic
  let filtered = reviews.filter((r: Review) => {
    // Trạng thái
    if (status === 'unreplied' && r.reply) return false;
    if (status === 'replied' && !r.reply) return false;
    // Số sao
    if (!starFilter.includes(r.rating)) return false;
    // Tìm kiếm
    if (search) {
      const s = search.toLowerCase();
      if (!(
        r.product?.name?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s) ||
        r.user?.name?.toLowerCase().includes(s) ||
        r.productId?.toLowerCase().includes(s) ||
        r.orderId?.toLowerCase().includes(s)
      )) return false;
    }
    // Thời gian
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const variantMap = useVariantsInfo(reviews);

  if (loading) return <div>Đang tải đánh giá...</div>;

  return (
    <div className="bg-white/80 rounded shadow p-4">
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <span className="font-semibold mr-2">Trạng thái:</span>
        {STATUS_OPTIONS.map(opt => (
          <Button key={opt.value} size="sm" variant={status === opt.value ? 'default' : 'outline'} onClick={() => setStatus(opt.value)}>{opt.label}</Button>
        ))}
        <span className="font-semibold ml-6 mr-2">Số sao:</span>
        {STAR_OPTIONS.map(star => (
          <label key={star} className="inline-flex items-center mr-2">
            <input type="checkbox" checked={starFilter.includes(star)} onChange={e => {
              setStarFilter(f => e.target.checked ? [...f, star] : f.filter(s => s !== star));
            }} />
            <span className="ml-1 text-yellow-500 font-bold">{star}★</span>
          </label>
        ))}
        <input type="text" className="ml-6 border rounded px-2 py-1 text-sm w-48 md:w-64" placeholder="Tìm kiếm sản phẩm, đơn hàng, người mua..." value={search} onChange={e => setSearch(e.target.value)} />
        <label htmlFor="date-from" className="sr-only">Từ ngày</label>
        <input id="date-from" type="date" className="ml-2 border rounded px-2 py-1 text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span>-</span>
        <label htmlFor="date-to" className="sr-only">Đến ngày</label>
        <input id="date-to" type="date" className="border rounded px-2 py-1 text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <Button size="sm" variant="outline" className="ml-2" onClick={()=>{setStatus('all');setStarFilter([5,4,3,2,1]);setSearch('');setDateFrom('');setDateTo('');}}>Đặt lại</Button>
      </div>
      <div className="divide-y">
        {reviews.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Chưa có đánh giá nào.</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Không có đánh giá phù hợp</div>
        ) : filtered.map((r: Review) => (
          <div key={r.id} className="flex flex-col md:flex-row gap-4 py-4 items-start">
            <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden border bg-white flex items-center justify-center">
              {r.product?.image ? <img src={r.product.image} alt={r.product.name} className="object-cover w-full h-full" /> : <span className="text-gray-400">No image</span>}
            </div>
            <div className="flex-1 min-w-0 max-w-md">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-bold text-pink-600">{r.user?.name || 'Ẩn danh'}</span>
                <span className="text-xs text-gray-400">ID đơn hàng {r.orderId}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="font-semibold text-gray-800 mb-1 truncate max-w-[120px]" title={r.product?.name}>{r.product?.name}</div>
              {/* Hiển thị màu và size nếu có */}
              {r.productVariantId && variantMap[r.productVariantId ?? ''] && (
                <div className="mb-1 flex gap-3 text-xs">
                  <span className="font-semibold" {...(variantMap[r.productVariantId ?? '']?.color ? { style: { color: variantMap[r.productVariantId ?? '']?.color } } : {})}>{`Màu: ${variantMap[r.productVariantId ?? '']?.color || ''}`}</span>
                  <span className="text-gray-500 font-medium">{`Size: ${variantMap[r.productVariantId ?? '']?.size}`}</span>
                </div>
              )}
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map(star => <span key={star} className={star <= r.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
              </div>
              <div className="text-gray-700 text-sm mb-1 whitespace-pre-line">{r.comment}</div>
              {r.reply && <div className="mt-2 p-2 bg-pink-50 border-l-4 border-pink-400 text-pink-700 text-xs rounded">Phản hồi: {r.reply}</div>}
            </div>
            <div className="flex flex-col gap-2 min-w-[120px] flex-1">
              {replyingId === r.id ? (
                <div className="flex flex-col md:flex-row gap-2 w-full items-end">
                  <label htmlFor={`reply-${r.id}`} className="sr-only">Nội dung phản hồi</label>
                  <div className="relative w-full">
                    <textarea
                      id={`reply-${r.id}`}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      className="border rounded p-3 text-base flex-1 min-h-[100px] resize-y pr-14 w-full"
                      rows={5}
                      placeholder="Nhập nội dung phản hồi..."
                      maxLength={500}
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-gray-400 pointer-events-none bg-white px-1">{reply.length}/500</span>
                  </div>
                  <div className="flex flex-row gap-2 mt-2 md:mt-0">
                    <Button size="sm" onClick={() => handleReply(r.id)}>Gửi</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReply(''); }}>Hủy</Button>
                  </div>
                  <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(r.id)}>Xóa</Button>
                </div>
              ) : r.reply ? null : (
                <>
                  <Button size="sm" className="w-32 mx-auto" onClick={() => { setReplyingId(r.id); setReply(''); }}>Trả lời</Button>
                  <Button size="sm" variant="destructive" className="w-32 mx-auto" onClick={() => handleDelete(r.id)}>Xóa</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
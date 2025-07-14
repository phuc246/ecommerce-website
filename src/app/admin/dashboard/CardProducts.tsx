import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CardProducts() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher);

  if (isLoading) return <div className="animate-pulse bg-gray-200 rounded-xl h-32 w-full" />;

  return (
    <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg p-6 flex flex-col items-start">
      <div className="text-white text-lg font-medium mb-2">Sản phẩm</div>
      <div className="text-3xl font-bold text-white">
        {data ? data.totalProducts.toLocaleString('vi-VN') : 0}
      </div>
    </div>
  );
} 
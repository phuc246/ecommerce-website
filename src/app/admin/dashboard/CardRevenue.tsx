import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CardRevenue() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher);

  if (isLoading) return <div className="animate-pulse bg-gray-200 rounded-xl h-32 w-full" />;

  return (
    <div className="rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 shadow-lg p-6 flex flex-col items-start">
      <div className="text-white text-lg font-medium mb-2">Doanh thu</div>
      <div className="text-3xl font-bold text-white">
        {data ? data.totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 0}
      </div>
    </div>
  );
} 
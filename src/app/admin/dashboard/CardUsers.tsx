import useSWR from 'swr';
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CardUsers() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher);

  if (isLoading) return <div className="animate-pulse bg-gray-200 rounded-xl h-32 w-full" />;

  return (
    <div className="rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg p-6 flex flex-col items-start">
      <div className="text-white text-lg font-medium mb-2">Người dùng</div>
      <div className="text-3xl font-bold text-white">
        {data ? data.totalUsers.toLocaleString('vi-VN') : 0}
      </div>
    </div>
  );
} 
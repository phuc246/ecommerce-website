import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';

async function getDashboardData() {
  const [totalProducts, totalOrders, totalUsers, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
  ]);

  return {
    totalProducts,
    totalOrders,
    totalUsers,
    recentOrders,
  };
}

export default async function AdminDashboard() {
  const { totalProducts, totalOrders, totalUsers, recentOrders } = await getDashboardData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="p-6">
            <h3 className="text-gray-500 text-sm">Total Products</h3>
            <p className="text-3xl font-bold">{totalProducts}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-gray-500 text-sm">Total Orders</h3>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-gray-500 text-sm">Total Users</h3>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'PROCESSING'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'SHIPPED'
                        ? 'bg-purple-100 text-purple-800'
                        : order.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
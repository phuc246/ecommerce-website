"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type OrderType = any; // TODO: Đặt đúng type nếu có

interface OrdersTableProps {
  orders: OrderType[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Tổng tiền</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Ngày đặt</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: OrderType) => (
          <TableRow key={order.id}>
            <TableCell>{order.id.slice(0, 8)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{order.user?.name || order.user?.email}</span>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-semibold text-blue-600">{order.total.toLocaleString()}₫</span>
            </TableCell>
            <TableCell>
              <Badge variant={order.status === 'PENDING' ? 'secondary' : order.status === 'CANCELLED' ? 'destructive' : 'default'}>
                {order.status}
              </Badge>
            </TableCell>
            <TableCell>{new Date(order.createdAt).toLocaleString('vi-VN')}</TableCell>
            <TableCell>
              <Link href={`/admin/orders/${order.id}`}>
                <Button size="sm" variant="outline">Xem</Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
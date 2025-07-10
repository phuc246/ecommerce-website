"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';
import clsx from 'clsx';

interface SizeItem {
  id: string;
  size: string;
  stock: number;
  sku: string | null;
}

interface ColorGroup {
  color: string;
  colorHex?: string;
  image?: string;
  price?: number;
  salePrice?: number;
  sku?: string;
  productName: string;
  productId: string;
  category?: string;
  sizes: SizeItem[];
}

interface ProductGroup {
  productId: string;
  productName: string;
  colors: ColorGroup[];
}

function getStatus(stock: number) {
  if (stock === 0) return 'Hết hàng';
  if (stock <= 5) return 'Sắp hết';
  return 'Còn hàng';
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductGroup[]>([]);
  const [expanded, setExpanded] = useState<{[key:string]: boolean}>({});
  const [popupImage, setPopupImage] = useState<string|null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFromDate, setLogFromDate] = useState<string>('');
  const [logToDate, setLogToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockBadge, setStockBadge] = useState<'all' | 'low' | 'out'>('all');
  const [logUserFilter, setLogUserFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/inventory')
      .then(res => res.json())
      .then(data => {
        // Sắp xếp sản phẩm mới nhất lên đầu
        data = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProducts(data);
      });
    fetchLogs();
  }, []);

  const fetchLogs = async (from = '', to = '') => {
    let url = '/api/admin/logs?entity=inventory';
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const res = await fetch(url);
    setLogs(await res.json());
  };

  const handleLogFilter = () => {
    fetchLogs(logFromDate, logToDate);
  };

  const handleExpand = (colorKey: string) => {
    setExpanded(prev => ({ ...prev, [colorKey]: !prev[colorKey] }));
  };

  const handleEdit = (size: SizeItem) => {
    setEditingId(size.id);
    setEditStock(size.stock);
  };

  const handleSave = async (id: string) => {
    await fetch(`/api/admin/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: editStock }),
    });
    setProducts(ps => ps.map(p => ({
      ...p,
      colors: p.colors.map(c => ({
        ...c,
        sizes: c.sizes.map(s => s.id === id ? { ...s, stock: editStock } : s)
      }))
    })));
    setEditingId(null);
    fetchLogs();
  };

  // Lọc sản phẩm theo searchTerm và trạng thái tồn kho (theo badge)
  const filteredProducts = products
    .map((product: ProductGroup) => {
      const filteredColors = product.colors
        .map((color: ColorGroup) => ({
          ...color,
          sizes: color.sizes.filter((s: SizeItem) => {
            const term = searchTerm.toLowerCase();
            const matchProduct = product.productName.toLowerCase().includes(term);
            const matchColor = color.color.toLowerCase().includes(term);
            const matchSize = s.size.toLowerCase().includes(term);
            const matchSKU = (color.sku || '').toLowerCase().includes(term) || (s.sku || '').toLowerCase().includes(term);
            let matchStock = true;
            if (stockBadge === 'low') matchStock = s.stock > 0 && s.stock < 5;
            if (stockBadge === 'out') matchStock = s.stock === 0;
            return (matchProduct || matchColor || matchSize || matchSKU) && matchStock;
          })
        }))
        .filter((color: ColorGroup) => color.sizes.length > 0);
      return {
        ...product,
        colors: filteredColors
      };
    })
    .filter((p: ProductGroup) => p.colors.length > 0);

  // Lọc log theo email
  const filteredLogs = logs.filter(log =>
    log.admin?.email?.toLowerCase().includes(logUserFilter.toLowerCase())
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Quản lý kho</h1>
      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm theo tên sản phẩm, màu, size..."
          className="border rounded px-3 py-2 w-80"
        />
        {/* Badge lọc tồn kho */}
        <div className="flex gap-2">
          <button
            className={clsx("px-3 py-2 rounded font-semibold border", stockBadge === 'all' ? 'bg-pink-500 text-white border-pink-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-pink-100')}
            onClick={() => setStockBadge('all')}
          >Tất cả</button>
          <button
            className={clsx("px-3 py-2 rounded font-semibold border", stockBadge === 'low' ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-yellow-100')}
            onClick={() => setStockBadge('low')}
          >Hàng &lt;5</button>
          <button
            className={clsx("px-3 py-2 rounded font-semibold border", stockBadge === 'out' ? 'bg-red-500 text-white border-red-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-red-100')}
            onClick={() => setStockBadge('out')}
          >Hết hàng</button>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
        {/* Bảng sản phẩm */}
        <div className="bg-white rounded shadow p-4">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Tên sản phẩm</th>
              <th className="px-4 py-2 border">Màu</th>
                  <th className="px-4 py-2 border">Ảnh</th>
              <th className="px-4 py-2 border">SKU</th>
                  <th className="px-4 py-2 border">Giá</th>
                  <th className="px-4 py-2 border">Giá KM</th>
              <th className="px-4 py-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">Không có sản phẩm nào</td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    product.colors.map((color, idx) => {
                      const colorKey = product.productId + '-' + color.color + '-' + (color.colorHex || '');
                      const rowClass = `border-b bg-white hover:bg-pink-50 cursor-pointer ${idx === 0 ? 'border-t-2 border-pink-300' : ''}`;
                      return (
                        <React.Fragment key={colorKey}>
                          <tr className={rowClass} onClick={() => handleExpand(colorKey)}>
                            <td className="px-4 py-2 border font-semibold">{color.productName}</td>
                            <td className="px-4 py-2 border">{color.color}</td>
                            <td className="px-4 py-2 border">
                              {color.image && (
                                <>
                                  <Image src={color.image} alt={color.color} width={40} height={40} className="rounded shadow cursor-pointer" onClick={e => {e.stopPropagation(); setPopupImage(color.image || null);}} loading={idx === 0 ? "eager" : "lazy"} priority={idx === 0} />
                                  <Dialog open={!!popupImage} onOpenChange={() => setPopupImage(null)}>
                                    <DialogContent>
                                      <img src={popupImage || ''} alt="Ảnh lớn" className="max-w-full max-h-[80vh]" />
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-2 border">{color.sku || '-'}</td>
                            <td className="px-4 py-2 border text-right text-pink-600 font-bold">{color.price?.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-2 border text-right text-green-600 font-bold">{color.salePrice?.toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-2 border text-center">
                              <Button size="sm" variant="outline">{expanded[colorKey] ? 'Ẩn size' : 'Xem size'}</Button>
                            </td>
                          </tr>
                          {expanded[colorKey] && color.sizes.map(size => {
                            let bgColor = '';
                            if (size.stock === 0) bgColor = 'bg-red-50';
                            else if (size.stock <= 5) bgColor = 'bg-yellow-50';
                            else bgColor = 'bg-green-50';
                            return (
                              <tr key={size.id} className={`border-b ${bgColor}`}>
                                <td className="px-4 py-2 border"></td>
                                <td className="px-4 py-2 border text-xs text-gray-500">Size: <b>{size.size}</b></td>
                                <td className="px-4 py-2 border"></td>
                                <td className="px-4 py-2 border">{size.sku || '-'}</td>
                                <td className="px-4 py-2 border"></td>
                                <td className="px-4 py-2 border"></td>
                <td className="px-4 py-2 border">
                                  {editingId === size.id ? (
                                    <>
                    <Input
                      type="number"
                      value={editStock}
                      min={0}
                      onChange={e => setEditStock(Number(e.target.value))}
                      className="w-20"
                    />
                                      <Button size="sm" onClick={() => handleSave(size.id)} className="ml-2">Lưu</Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="ml-2">Huỷ</Button>
                    </>
                  ) : (
                                    <>
                                      <span className="font-semibold">Tồn kho: {size.stock}</span>
                                      <Button size="sm" onClick={e => {e.stopPropagation(); handleEdit(size);}} className="ml-2">Sửa</Button>
                                    </>
                  )}
                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Bảng log */}
        <div className="bg-white rounded shadow p-4 w-full">
          <h2 className="text-xl font-bold mb-4">Lịch sử thao tác kho</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={logUserFilter}
              onChange={e => setLogUserFilter(e.target.value)}
              placeholder="Lọc theo email người dùng..."
              className="border rounded px-3 py-2 w-72"
              title="Lọc theo email người thao tác"
            />
            <input type="date" value={logFromDate} onChange={e => setLogFromDate(e.target.value || '')} className="border rounded px-2 py-1" title="Từ ngày" placeholder="Từ ngày" />
            <span>-</span>
            <input type="date" value={logToDate} onChange={e => setLogToDate(e.target.value || '')} className="border rounded px-2 py-1" title="Đến ngày" placeholder="Đến ngày" />
            <button onClick={handleLogFilter} className="bg-pink-500 text-white px-4 py-1 rounded">Tìm kiếm</button>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-2 border w-1/6">Ngày giờ</th>
                  <th className="px-6 py-2 border w-1/5">Email</th>
                  <th className="px-6 py-2 border w-3/5">Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 10).map(log => (
                  <tr key={log.id} className="border-b">
                    <td className="px-6 py-2 border whitespace-nowrap">{format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}</td>
                    <td className="px-6 py-2 border">{log.userEmail || '-'}</td>
                    <td className="px-6 py-2 border">{log.message || log.details || log.action}</td>
              </tr>
            ))}
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-4 text-gray-400">Không có log nào</td></tr>
                )}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
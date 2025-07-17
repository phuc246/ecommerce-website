"use client";

import Image from "next/image";
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  color: string;
  size: string;
  image?: string;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
  category: { name: string };
  variants: Variant[];
  attributes?: { id: string; name: string }[];
}

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  onDelete: (id: string) => void;
  onEdit: (product: any) => void;
  categories: any[];
  trends: any[];
  attributes: any[];
}

export default function ProductTable({ products, loading, searchTerm, onDelete, onEdit, categories, trends, attributes }: ProductTableProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const router = useRouter();
  
  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchName = p.name.toLowerCase().includes(term);
    const matchColor = p.variants.some(v => v.color.toLowerCase().includes(term));
    const matchSize = p.variants.some(v => v.size.toLowerCase().includes(term));
    const matchSKU = p.variants.some(v => (v.sku || '').toLowerCase().includes(term));
    return matchName || matchColor || matchSize || matchSKU;
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getPriceRange = (variants: Variant[]) => {
    if (!variants || variants.length === 0) return 'N/A';
    
    const prices = variants.map(v => v.salePrice ?? v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) return formatCurrency(minPrice);
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  };

  const getTotalStock = (variants: Variant[]) => {
    if (!variants) return 0;
    return variants.reduce((total, v) => total + v.stock, 0);
  };

  const getVariantSummary = (variants: Variant[]) => {
    if (!variants || variants.length === 0) return { colors: 0, sizes: 0 };
    const colors = new Set(variants.map(v => v.color));
    const sizes = new Set(variants.map(v => v.size));
    return {
      colors: colors.size,
      sizes: sizes.size
    };
  };

  // Sửa lại handleEditClick để fetch chi tiết sản phẩm từ API
  const handleEditClick = async (product: any) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (!res.ok) throw new Error('Không thể lấy chi tiết sản phẩm');
      const detail = await res.json();
      const editingProduct = {
        ...detail,
        categoryPath: detail.categoryPath || [],
        attributeIds: detail.attributeIds || [],
      };
      // setEditingProduct(editingProduct); // Đã xoá
      // setShowEditModal(true); // Đã xoá
    } catch (error) {
      alert('Không thể lấy chi tiết sản phẩm!');
    }
  };

  // Sửa lại handleEditSave để cập nhật sản phẩm từ API
  const handleEditSave = async (updatedProduct: any) => {
    try {
      const res = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) throw new Error('Không thể cập nhật sản phẩm');
      onEdit(updatedProduct);
    } catch (error) {
      alert('Không thể cập nhật sản phẩm!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Ảnh</TableHead>
            <TableHead>Tên sản phẩm</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Kho</TableHead>
            <TableHead>Biến thể</TableHead>
            <TableHead>Thuộc tính</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product, index) => {
            const priceRange = getPriceRange(product.variants);
            const totalStock = getTotalStock(product.variants);
            const variantSummary = getVariantSummary(product.variants);
            const isExpanded = expandedProductId === product.id;

            // Lấy danh sách màu và size duy nhất
            const colorList = Array.from(new Set(product.variants.map(v => v.color)));
            const sizeList = Array.from(new Set(product.variants.map(v => v.size)));

            return (
              <React.Fragment key={product.id}>
                <TableRow>
                  <TableCell>
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover cursor-pointer mx-auto"
                      onClick={() => setPopupImage(product.image)}
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-red-600">{priceRange}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block bg-pink-100 text-pink-700 font-bold border border-pink-200 rounded px-2 py-0.5 min-w-[40px] text-center">{totalStock}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {/* Hiển thị mỗi màu 1 hình ảnh đại diện */}
                      {Array.from(new Map(product.variants.filter(v => v.image).map(v => [v.color, v])).values()).map((variant) => (
                        <img
                          key={variant.color}
                          src={variant.image}
                          alt={variant.color}
                          className="w-8 h-8 rounded border object-cover cursor-pointer hover:scale-110 transition-transform"
                          title={variant.color}
                          onClick={() => variant.image && setPopupImage(variant.image || null)}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sizeList.map(size => (
                        <span key={size} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{size}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.attributes?.slice(0, 3).map(attr => (
                        <Badge key={attr.id} className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-medium">
                          {attr.name}
                        </Badge>
                      ))}
                      {product.attributes && product.attributes.length > 3 && (
                        <span className="text-xs text-gray-400 ml-1">...</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-700 border border-purple-200 font-semibold">{product.category.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-pink-50 hover:bg-pink-200 text-pink-600 border border-pink-200"
                      onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      aria-label={isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                    >
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-pink-50 hover:bg-pink-200 text-pink-600 border border-pink-200"
                      onClick={() => router.push(`/admin/products/${product.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)} className="bg-pink-50 hover:bg-pink-200 text-pink-600 border border-pink-200">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${product.id}-expanded`}>
                    <TableCell colSpan={8} className="bg-gray-50 p-4">
                      <div>
                        <div className="font-semibold mb-2">Danh sách biến thể:</div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-full text-xs border">
                            <thead>
                              <tr className="bg-pink-50">
                                <th className="border px-2 py-1 text-pink-700">Màu</th>
                                <th className="border px-2 py-1">Size</th>
                                <th className="border px-2 py-1">Kho</th>
                                <th className="border px-2 py-1">Giá</th>
                                <th className="border px-2 py-1">Giá KM</th>
                                <th className="border px-2 py-1">SKU</th>
                                <th className="border px-2 py-1">Ảnh</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const grouped = product.variants.reduce((acc, v) => {
                                  if (!acc[v.color]) acc[v.color] = [];
                                  acc[v.color].push(v);
                                  return acc;
                                }, {} as Record<string, Variant[]>);
                                const colorKeys = Object.keys(grouped);
                                return colorKeys.map((color, groupIdx) => {
                                  const group = grouped[color];
                                  return group.map((variant, idx) => (
                                    <tr
                                      key={`${product.id}-${color}-${variant.id}`}
                                      className={
                                        `${groupIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} ` +
                                        (idx === 0 ? 'border-t-2 border-pink-300' : '') +
                                        (idx === group.length - 1 ? ' border-b-2 border-pink-300' : '')
                                      }
                                    >
                                      {idx === 0 && (
                                        <td rowSpan={group.length} className="font-bold text-pink-700 border-r-2 border-pink-200 align-middle text-center">
                                          {color}
                                        </td>
                                      )}
                                      <td className="border px-2 py-1">{variant.size}</td>
                                      <td className="border px-2 py-1">{variant.stock}</td>
                                      {idx === 0 ? (
                                        <td rowSpan={group.length} className="border px-2 py-1 align-middle text-center">{formatCurrency(group[0].price)}</td>
                                      ) : null}
                                      {idx === 0 ? (
                                        <td rowSpan={group.length} className="border px-2 py-1 align-middle text-center">{group[0].salePrice ? formatCurrency(group[0].salePrice) : "-"}</td>
                                      ) : null}
                                      {idx === 0 ? (
                                        <td rowSpan={group.length} className="border px-2 py-1 align-middle text-center">{group[0].sku || "-"}</td>
                                      ) : null}
                                      {idx === 0 ? (
                                        <td rowSpan={group.length} className="border px-2 py-1 align-middle text-center">
                                          {group[0].image && (
                                            <>
                                              <Image
                                                src={group[0].image}
                                                alt=""
                                                width={32}
                                                height={32}
                                                className="object-cover rounded mx-auto cursor-pointer"
                                                onClick={() => setPopupImage(group[0].image!)}
                                              />
                                            </>
                                          )}
                                        </td>
                                      ) : null}
                                    </tr>
                                  ));
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      {/* Popup hiển thị ảnh lớn luôn nằm ngoài cùng component */}
      {popupImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPopupImage(null)}
        >
          <div className="bg-white rounded-lg p-2 shadow-lg max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img src={popupImage} alt="Ảnh lớn" className="max-w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
      {/* EditProductModal is removed as per the edit hint */}
    </div>
  );
}

export type { Product, Variant }; 
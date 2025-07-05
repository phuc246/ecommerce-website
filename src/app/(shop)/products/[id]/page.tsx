"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCartIcon, ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useMouseMove } from "@/hooks/useMouseMove";
import toast from "react-hot-toast";
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/Button';
import { Heart } from 'lucide-react';
import posthog from 'posthog-js';
import { toast as sonnerToast } from 'sonner';

interface Color {
  id: string;
  name: string;
  value: string;
  image: string | null;
}

interface Size {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  color: string;
  size: string;
  stock: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  description: string;
  images: { id: string; url: string; color: string }[];
  attributes: {
    id: string;
    name: string;
    value: string;
    type: string;
  }[];
  variants?: ProductVariant[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/products/${id}`);
          if (!res.ok) throw new Error("Product not found");
          const data = await res.json();
          setProduct(data);
          setVariants(data.variants || []);

          // PostHog event capture
          posthog.capture('product_viewed', {
            productId: data.id,
            productName: data.name,
            price: data.salePrice || data.price,
          });

          if (data.images && data.images.length > 0) {
            setSelectedColor(data.images[0].color);
          }
          const sizes = data.attributes.filter((a: any) => a.type === 'size');
          if (sizes.length > 0) {
            setSelectedSize(sizes[0].value);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  const imageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const imageStyle = useMouseMove(imageRef, 0.04);
  const detailsStyle = useMouseMove(detailsRef, 0.02);
  
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();

  if (loading) return <div className="text-center p-8">Đang tải...</div>;
  if (!product) return <div className="text-center p-8">Sản phẩm không tồn tại.</div>;
  
  const getSelectedImage = () => {
    if (!selectedColor) return product.image;
    const foundImage = product.images.find(img => img.color === selectedColor);
    return foundImage?.url || product.image;
  };

  const imageSrc = getSelectedImage();
  const uniqueColors = Array.from(new Set(product.images.map(img => img.color)));
  const availableSizes = Array.isArray(product.attributes) ? product.attributes.filter(attr => attr.type === 'size') : [];
  
  const selectedVariant = variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error('Vui lòng chọn kích cỡ');
      return;
    }
    addItem({
      id: `${product.id}-${selectedColor}-${selectedSize}`,
      name: product.name,
      price: product.salePrice || product.price,
      image: imageSrc,
      quantity: 1,
      // The properties below are for display in the cart, not part of the base CartItem type
      // You might need to extend the CartItem type if you want to store these
      // @ts-ignore
      color: selectedColor,
      // @ts-ignore
      size: selectedSize,
    });
    toast.success('Đã thêm vào giỏ hàng');
  };
  
  const handleWishlistClick = () => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } else {
      addToWishlist(product.id);
      toast.success('Đã thêm vào danh sách yêu thích');
    }
  };

  // Thêm icon nổi ở góc trái dưới màn hình
  const wishlisted = isWishlisted(product.id);
  const handleFloatingWishlist = async () => {
    if (wishlisted) {
      await removeFromWishlist(product.id);
      sonnerToast.success('Đã bỏ khỏi yêu thích!');
    } else {
      await addToWishlist(product.id);
      sonnerToast.success('Đã lưu vào yêu thích!');
    }
  };
  const handleFloatingCart = () => {
    handleAddToCart();
  };

  return (
    <div className="bg-white">
      {/* Icon nổi wishlist + cart */}
      <div className="fixed left-4 bottom-4 z-50 flex flex-col gap-4">
        <button
          className={`bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center ${wishlisted ? 'ring-2 ring-pink-400' : ''}`}
          onClick={handleFloatingWishlist}
          aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
        >
          <Heart size={28} className={wishlisted ? 'text-pink-500 fill-pink-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          className="bg-white/80 hover:bg-green-400 hover:text-white text-green-500 rounded-full p-4 shadow transition-colors flex items-center justify-center"
          onClick={handleFloatingCart}
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
        >
          <ShoppingCartIcon className="w-7 h-7" />
        </button>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Section */}
          <div ref={imageRef} className="product-image-motion">
            <div className="relative w-full overflow-hidden rounded-lg shadow-lg group aspect-square bg-gray-50">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Ảnh không có sẵn
                 </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {product.salePrice && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">SALE</div>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex items-center space-x-2 mt-4 overflow-x-auto pb-2">
              {product.images.map(img => (
                <div
                  key={img.id}
                  className={`relative w-20 h-20 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${selectedColor === img.color ? 'border-pink-500 scale-110' : 'border-transparent'}`}
                  onClick={() => setSelectedColor(img.color)}
                >
                  <Image src={img.url} alt={`${product.name} - ${img.color}`} fill className="object-cover" loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
              ))}
            </div>
          </div>
          {/* Details Section */}
          <div ref={detailsRef} className="product-details-motion">
            <h1 className="text-3xl lg:text-4xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.description}</p>
            <div className="mt-4">
              <span className={`text-3xl font-bold ${product.salePrice ? 'text-pink-600' : 'text-gray-900'}`}>
                {(product.salePrice || product.price).toLocaleString()} VNĐ
              </span>
              {product.salePrice && (
                <span className="text-gray-500 line-through ml-2">
                  {product.price.toLocaleString()} VNĐ
                </span>
              )}
            </div>
            {/* Colors */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Màu sắc: <span className="font-bold">{selectedColor}</span></h3>
              <div className="flex items-center space-x-2 mt-2">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-pink-500' : 'border-transparent hover:scale-110'} bg-[${color.toLowerCase()}]`}
                    title={color}
                  />
                ))}
              </div>
            </div>
            {/* Sizes */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Kích cỡ</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {availableSizes.map((size) => (
                  <Button
                    key={size.id}
                    variant={selectedSize === size.value ? 'default' : 'outline'}
                    onClick={() => setSelectedSize(size.value)}
                    className="rounded-full"
                  >
                    {size.value}
                  </Button>
                ))}
              </div>
            </div>
            {/* Hiển thị tồn kho/cảnh báo */}
            {selectedVariant && (
              <div className="mt-2">
                {selectedVariant.sku && (
                  <div className="text-xs text-gray-500 mb-1">SKU: {selectedVariant.sku}</div>
                )}
                {selectedVariant.stock === 0 ? (
                  <span className="text-red-600 font-semibold">Hết hàng</span>
                ) : selectedVariant.stock <= 5 ? (
                  <span className="text-yellow-600 font-semibold">Sắp hết hàng ({selectedVariant.stock} sản phẩm)</span>
                ) : (
                  <span className="text-green-600">Còn {selectedVariant.stock} sản phẩm</span>
                )}
              </div>
            )}
            {/* Actions */}
            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" className="flex-grow bg-pink-600 hover:bg-pink-700" onClick={handleAddToCart} disabled={selectedVariant?.stock === 0}>Thêm vào giỏ hàng</Button>
              <Button variant="outline" size="icon" className="w-12 h-12" onClick={handleWishlistClick}>
                <Heart className={isWishlisted(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
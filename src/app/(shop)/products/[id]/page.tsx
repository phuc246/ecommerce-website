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
import AddToCartButton from '@/components/AddToCartButton';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';

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
  image?: string;
  price: number;
  salePrice?: number;
}

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  order?: number;
  altText?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  description: string;
  images: ProductImage[];
  attributes: {
    id: string;
    name: string;
    value: string;
    type: string;
  }[];
  variants?: ProductVariant[];
  category?: { name: string };
  sku?: string;
  createdAt?: string;
  colors?: Color[];
  sizes?: Size[];
}

// Mapping tên màu tiếng Việt sang mã màu
const COLOR_MAP: Record<string, string> = {
  'Đen': '#000',
  'Nâu': '#964B00',
  'Trắng': '#fff',
  'Đỏ': 'red',
  'Xanh': 'blue',
  'Xanh dương': 'blue',
  'Xanh lá': 'green',
  'Vàng': 'yellow',
  'Tím': 'purple',
  'Hồng': 'pink',
  'Cam': 'orange',
  'Be': 'beige',
  'Beige': 'beige',
  'Navy': 'navy',
  'Xám': 'gray',
  'Ghi': 'gray',
  'Xanh navy': 'navy',
  'Xanh đen': '#222',
  'Xanh rêu': '#556B2F',
  'Xanh ngọc': '#00CED1',
  'Xanh da trời': '#87CEEB',
  'Xanh lam': '#1E90FF',
  'Xanh biển': '#4682B4',
  'Xanh pastel': '#B2FFFF',
  'Nâu đất': '#8B4513',
  'Nâu nhạt': '#C68642',
  'Nâu đậm': '#654321',
  'Vàng kem': '#FFFACD',
  'Vàng đồng': '#FFD700',
  'Vàng chanh': '#FFF700',
  'Trắng kem': '#FDF6E3',
  'Trắng sữa': '#F8F8FF',
  'Be nhạt': '#F5F5DC',
  'Be đậm': '#DEB887',
  'Họa tiết': '', // Không có màu
};

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [defaultImage, setDefaultImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();

  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted, wishlist } = useWishlist();
  const { items } = useCart();
  const { data: session } = useSession();

  // Thêm state cho sản phẩm gợi ý
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  // Fetch sản phẩm gợi ý
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/products/shop?page=1&limit=40&sortBy=createdAt&sortOrder=desc');
        const data = await res.json();
        const all = data.products || [];
        // Loại bỏ sản phẩm hiện tại
        const filtered = all.filter((p: Product) => p.id !== product?.id);
        // Random 20 sản phẩm
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setSuggestedProducts(shuffled.slice(0, 20));
      } catch {}
    };
    if (product) fetchSuggestions();
  }, [product]);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/products/${id}`);
          if (!res.ok) throw new Error("Product not found");
          const data = await res.json();
          setProduct(data);
          setVariants(data.variants || []);
          setDefaultImage(data.image || '');

          // PostHog event capture
          posthog.capture('product_viewed', {
            productId: data.id,
            productName: data.name,
            price: data.salePrice || data.price,
          });

          // Set default color from first variant if available
          if (data.variants && data.variants.length > 0) {
            setSelectedColor(data.variants[0].color);
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
  
  if (loading) return <div className="text-center p-8">Đang tải...</div>;
  if (!product) return <div className="text-center p-8">Sản phẩm không tồn tại.</div>;
  
  // Helper: kiểm tra mã màu hợp lệ
  function isValidColor(str: string): boolean {
    if (!str) return false;
    // Hex, rgb, rgba, hsl, tên màu css
    return /^#([0-9a-f]{3}){1,2}$/i.test(str) ||
      /^rgb(a)?\(/i.test(str) ||
      /^hsl(a)?\(/i.test(str) ||
      [
        'black','silver','gray','white','maroon','red','purple','fuchsia','green','lime','olive','yellow','navy','blue','teal','aqua','orange','aliceblue','antiquewhite','aquamarine','azure','beige','bisque','blanchedalmond','blueviolet','brown','burlywood','cadetblue','chartreuse','chocolate','coral','cornflowerblue','cornsilk','crimson','cyan','darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey','darkkhaki','darkmagenta','darkolivegreen','darkorange','darkorchid','darkred','darksalmon','darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise','darkviolet','deeppink','deepskyblue','dimgray','dimgrey','dodgerblue','firebrick','floralwhite','forestgreen','gainsboro','ghostwhite','gold','goldenrod','greenyellow','grey','honeydew','hotpink','indianred','indigo','ivory','khaki','lavender','lavenderblush','lawngreen','lemonchiffon','lightblue','lightcoral','lightcyan','lightgoldenrodyellow','lightgray','lightgreen','lightgrey','lightpink','lightsalmon','lightseagreen','lightskyblue','lightslategray','lightslategrey','lightsteelblue','lightyellow','limegreen','linen','magenta','mediumaquamarine','mediumblue','mediumorchid','mediumpurple','mediumseagreen','mediumslateblue','mediumspringgreen','mediumturquoise','mediumvioletred','midnightblue','mintcream','mistyrose','moccasin','navajowhite','oldlace','olivedrab','orangered','orchid','palegoldenrod','palegreen','paleturquoise','palevioletred','papayawhip','peachpuff','peru','pink','plum','powderblue','rosybrown','royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell','sienna','skyblue','slateblue','slategray','slategrey','snow','springgreen','steelblue','tan','thistle','tomato','turquoise','violet','wheat','whitesmoke','yellowgreen','rebeccapurple'
      ].includes(str.toLowerCase());
  }

  // Lấy danh sách màu từ variants
  const colorOptions = Array.from(new Set((variants || []).map(v => v.color).filter(Boolean)));
  // Khi chọn màu, lấy size từ variants cùng màu
  const sizeOptions = selectedColor
    ? Array.from(new Set((variants || []).filter(v => v.color === selectedColor).map(v => v.size).filter(Boolean)))
    : [];
  // Khi chọn size, xác định variant cụ thể
  const selectedVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
  // Nếu variant có ảnh riêng, ưu tiên ảnh đó làm ảnh chính
  const getSelectedImage = () => {
    if (selectedVariant && selectedVariant.image) return selectedVariant.image;
    return product.image;
  };
  const imageSrc = getSelectedImage();
  // Lấy ảnh chính và ảnh phụ từ mảng ProductImage
  const mainImageObj = product.images.find(img => img.isMain) || product.images[0];
  const mainImage = mainImageObj?.url || product.image;
  const additionalImages = product.images.filter(img => !img.isMain).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  // Thumbnails: ảnh chính + ảnh phụ
  const thumbnailsToShow = [mainImageObj, ...additionalImages].filter(Boolean).slice(0, 7);
  const extraCount = thumbnailsToShow.length > 7 ? (thumbnailsToShow.length - 7) : 0;
  // Debug: log ra console và render thông tin ảnh phụ
  if ((product.images || []).length > 0) {
    console.log('Ảnh phụ:', product.images);
  }
  // Số lượng tối đa
  const maxQuantity = selectedVariant ? selectedVariant.stock : 1;

  // Tính giá min-max của tất cả variant
  const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.salePrice ?? v.price)) : 0;
  const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.salePrice ?? v.price)) : 0;

  // Helper: tách tên và mã màu nếu có dạng 'Tên - MãMàu' hoặc 'Tên (MãMàu)'
  function parseColorVariant(str: string): { label: string, color?: string } {
    if (!str) return { label: '' };
    // Dạng 'Tên - MãMàu'
    const dashMatch = str.match(/^(.*)\s*-\s*([#a-zA-Z0-9() ,]+)/);
    if (dashMatch && isValidColor(dashMatch[2].trim())) {
      return { label: dashMatch[1].trim(), color: dashMatch[2].trim() };
    }
    // Dạng 'Tên (MãMàu)'
    const parenMatch = str.match(/^(.*)\(([^)]+)\)$/);
    if (parenMatch && isValidColor(parenMatch[2].trim())) {
      return { label: parenMatch[1].trim(), color: parenMatch[2].trim() };
    }
    // Nếu là mã màu
    if (isValidColor(str.trim())) return { label: '', color: str.trim() };
    // Chỉ là tên
    return { label: str.trim() };
  }

  const handleAddToCart = async () => {
    // Validate trước
    if (!selectedColor) {
      sonnerToast.error('Hãy chọn biến thể');
      return;
    }
    if (!selectedSize) {
      sonnerToast.error('Hãy chọn size');
      return;
    }
    if (quantity < 1) {
      sonnerToast.error('Số lượng sản phẩm phải lớn hơn 0');
      return;
    }
    if (quantity > 99) {
      sonnerToast.error('Số lượng tối đa là 99');
      return;
    }
    if (selectedVariant && selectedVariant.stock === 0) {
      sonnerToast.error('Sản phẩm đã hết hàng!');
      return;
    }
    if (selectedVariant && selectedVariant.stock < quantity) {
      sonnerToast.error(`Chỉ còn ${selectedVariant.stock} sản phẩm trong kho!`);
      return;
    }
    // Sau đó mới kiểm tra đăng nhập
    if (!session || !session.user) {
      sonnerToast.error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      setTimeout(() => router.push('/login'), 1200);
      return;
    }
    // Lấy đúng variant để lấy id
    const variant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
    if (!variant) {
      sonnerToast.error('Không tìm thấy biến thể phù hợp!');
      return;
    }
    // Tìm colorId và sizeId nếu có trong product
    let colorId = undefined;
    let sizeId = undefined;
    if (product && Array.isArray(product.colors)) {
      const colorObj = product.colors.find(c => c.name === selectedColor);
      if (colorObj) colorId = colorObj.id;
    }
    if (product && Array.isArray(product.sizes)) {
      const sizeObj = product.sizes.find(s => s.name === selectedSize);
      if (sizeObj) sizeId = sizeObj.id;
    }
    // Nếu không có, fallback về variant.color/size hoặc selectedColor/selectedSize
    colorId = colorId || variant.color || selectedColor;
    sizeId = sizeId || variant.size || selectedSize;
    try {
      await addItem({
        productId: product.id,
        colorId: variant.color,
        sizeId: variant.size,
        quantity,
      });
      sonnerToast.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      console.error('Add to cart error:', error);
      sonnerToast.error('Thêm vào giỏ hàng thất bại!');
    }
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
  const toggleWishlist = async () => {
    if (!session || !session.user) {
      // toast logic đã có trong hook, chỉ cần gọi add/remove
      await addToWishlist(product.id); // sẽ tự hiện toast lỗi nếu chưa đăng nhập
      return;
    }
    if (wishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };
  const handleFloatingCart = async () => {
    await handleAddToCart();
  };

  // Đảm bảo reviews luôn là mảng
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => {
    if (product?.id) {
      fetch(`/api/products/${product.id}/reviews`).then(res => res.json()).then(setReviews);
    }
  }, [product?.id]);

  return (
    <div className="relative min-h-screen">
      {/* Lớp nền đen mờ chỉ phủ phần background nội dung sản phẩm */}
      <div className="absolute top-0 left-0 w-full h-full z-0 bg-slate-900  " />
      {/* Hàng 1: grid 2 cột */}
      <div className="container mx-auto px-4 pt-28 pb-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Cột trái: Ảnh + ảnh phụ */}
          <div ref={imageRef} className="product-image-motion w-full">
            <div className="relative w-full overflow-hidden rounded-2xl shadow-lg group aspect-square bg-gray-50">
              {mainImage ? (
                <Image
                  src={mainImage}
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
            {thumbnailsToShow.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ maxWidth: '100%' }}>
                {thumbnailsToShow.map((img, index) => (
                  <div
                    key={img.id || index}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${img.url === mainImage ? 'border-pink-500 scale-110' : 'border-transparent hover:border-pink-500 hover:scale-110'}`}
                    onClick={() => {
                      setProduct(prev => prev ? { ...prev, image: img.url } : null);
                    }}
                  >
                    <Image src={img.url} alt={img.altText || product?.name || ''} fill className="object-cover" loading="lazy" sizes="64px" />
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-200 text-gray-500 rounded-lg font-bold text-lg flex-shrink-0">
                    +{extraCount}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Cột phải: Thông tin sản phẩm */}
          <div ref={detailsRef} className="product-details-motion w-full max-w-xl mx-auto">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {product.category?.name && <span className="inline-block bg-pink-200 text-pink-700 text-xs font-bold px-3 py-1 rounded-full shadow border border-pink-300">{product.category.name}</span>}
                {product.sku && <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">SKU: {product.sku}</span>}
                <span className="inline-block bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white text-xs px-2 py-1 rounded font-bold shadow">Đã bán: <span className="font-extrabold">--</span></span>
              </div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-500 to-pink-600 drop-shadow mb-1">{product.name}</h1>
              {/* Đã di chuyển mô tả dài xuống dưới ảnh phụ */}
            </div>
            {/* Giá sản phẩm */}
            <div className="flex items-center gap-4 mb-4">
              {selectedVariant ? (
                <>
                  <span className={`text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-fuchsia-500 to-pink-600 drop-shadow`}>{(selectedVariant.salePrice || selectedVariant.price).toLocaleString()} VNĐ</span>
                  {selectedVariant.salePrice && (
                    <span className="text-gray-400 line-through ml-2 drop-shadow">{selectedVariant.price.toLocaleString()} VNĐ</span>
                  )}
                </>
              ) : (
                minPrice === maxPrice ? (
                  <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-fuchsia-500 to-pink-600 drop-shadow">{minPrice.toLocaleString()} VNĐ</span>
                ) : (
                  <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-fuchsia-500 to-pink-600 drop-shadow">{minPrice.toLocaleString()} - {maxPrice.toLocaleString()} VNĐ</span>
                )
              )}
            </div>
            {/* Thuộc tính đặc biệt */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {product.attributes.map(attr => (
                  <span key={attr.id} className="inline-block bg-pink-100 text-pink-700 font-bold text-xs px-2 py-1 rounded shadow-sm border border-pink-200">
                    {attr.name}{attr.value ? ':' : ''} {attr.value && <span className="font-extrabold">{attr.value}</span>}
                  </span>
                ))}
              </div>
            )}
            {/* Colors (Biến thể) */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-pink-400 mb-1">Biến thể: <span className="font-bold text-white">{selectedColor || '--'}</span></h3>
              <div className="flex items-center space-x-2 mt-1">
                {colorOptions.length > 0 ? colorOptions.map((rawColor) => {
                  let { label, color } = parseColorVariant(rawColor);
                  if (!label) label = rawColor;
                  // Mapping tên màu tiếng Việt sang mã màu nếu chưa có mã màu
                  if (!color && COLOR_MAP[label]) color = COLOR_MAP[label];
                  if (!color && isValidColor(label)) color = label;
                  return (
                    <button
                      key={rawColor}
                      onClick={() => { setSelectedColor(rawColor); setSelectedSize(null); }}
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium shadow-sm whitespace-nowrap mr-2 transition-colors duration-200 ${selectedColor === rawColor ? 'bg-pink-500 text-white border-pink-600' : 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'}`}
                    >
                      {label}
                      {color && isValidColor(color) && (
                        <span className="ml-2 inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                      )}
                    </button>
                  );
                }) : <span className="text-xs text-gray-400">Không có Biến thể </span>}
              </div>
            </div>
            {/* Sizes */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-pink-400 mb-1">Kích cỡ</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {sizeOptions.length > 0 ? sizeOptions.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full font-bold px-5 py-2 text-base border-2 transition-all duration-150
                      ${selectedSize === size
                        ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white border-pink-400 shadow-lg'
                        : 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200 hover:text-pink-900'}
                    `}
                    disabled={!selectedColor}
                  >
                    {size}
                  </Button>
                )) : <span className="text-xs text-gray-400">Chọn loại Biến thể trước </span>}
              </div>
            </div>
            {/* Số lượng mua */}
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-sm font-bold text-pink-400">Số lượng</h3>
              <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                <button type="button" className="px-3 py-1 text-lg font-bold text-gray-500 hover:text-pink-500 disabled:opacity-50" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>-</button>
                <input type="number" min={1} max={maxQuantity} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(Number(e.target.value), maxQuantity)))} className="w-12 text-center bg-transparent outline-none border-0" placeholder="Số lượng" aria-label="Số lượng" disabled={!selectedVariant || maxQuantity === 0} />
                <button type="button" className="px-3 py-1 text-lg font-bold text-gray-500 hover:text-pink-500" onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} disabled={!selectedVariant || quantity >= maxQuantity}>+</button>
              </div>
              {selectedVariant && (
                selectedVariant.stock === 0 ? (
                  <span className="inline-block px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-sm ml-2 animate-pulse">Hết hàng</span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-lg bg-green-700 text-white font-bold text-sm ml-2">Còn {selectedVariant.stock} sản phẩm</span>
                )
              )}
            </div>
            {/* Actions */}
            <div className="mt-8 flex items-center gap-4">
              <button
                className="py-3 px-4 rounded-lg border border-gray-300 bg-white/80 text-gray-700 font-semibold flex items-center gap-2 hover:bg-pink-100 transition-all duration-200"
                onClick={() => router.back()}
                type="button"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Quay lại
              </button>
              <button
                className="flex-grow py-3 rounded-lg bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 text-white font-extrabold text-lg shadow-lg hover:from-pink-400 hover:to-fuchsia-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
                onClick={handleAddToCart}
                disabled={selectedVariant && selectedVariant.stock === 0}
              >
                Thêm vào giỏ hàng
              </button>
              <button
                className="bg-white/80 hover:bg-pink-400 hover:text-white text-pink-500 rounded-full p-4 shadow transition-colors flex items-center justify-center"
                onClick={toggleWishlist}
                aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
              >
                <Heart size={28} className={wishlisted ? 'text-pink-500 fill-pink-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Hàng 2: grid 2 cột (mô tả & đánh giá) */}
      <div className="container mx-auto px-4 pb-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Cột trái: mô tả 3/4 */}
          <div className="md:col-span-3">
            <h2 className="text-lg font-bold text-pink-300 mb-2">Mô tả sản phẩm</h2>
            <p className="text-pink-100 text-base font-medium drop-shadow whitespace-pre-line">{product.description}</p>
          </div>
          {/* Cột phải: đánh giá 1/4 */}
          <div className="md:col-span-1">
            <h2 className="text-lg font-bold text-pink-300 mb-3">Đánh giá sản phẩm</h2>
            {(!reviews || reviews.length === 0) ? (
              <div className="text-pink-100 text-base font-medium italic">Chưa có đánh giá nào</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white/10 rounded-lg p-3 shadow border border-pink-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-pink-400">{review.user?.name || 'Ẩn danh'}</span>
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                    <div className="text-pink-100 text-sm mb-1 whitespace-pre-line">{review.comment}</div>
                    {review.reply && (
                      <div className="mt-2 p-2 bg-pink-50 border-l-4 border-pink-400 text-pink-700 text-xs rounded">
                        <span className="font-bold">Phản hồi từ quản trị viên:</span> {review.reply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Hàng 3: Sản phẩm gợi ý */}
      <div className="container mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-pink-400 mb-4">Có thể bạn thích</h2>
        <div className="relative">
          {suggestedProducts.length === 0 ? (
            <div className="text-pink-100 text-base italic">Không có sản phẩm gợi ý</div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-pink-200">
              {suggestedProducts.map((p) => {
                // Đảm bảo có category cho ProductCard
                const cardProduct = {
                  ...p,
                  category: p.category || { name: '' },
                };
                return (
                  <div key={p.id} className="min-w-[220px] max-w-[240px] flex-shrink-0">
                    <ProductCard product={cardProduct as any} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Floating action buttons bottom left - giống home */}
      <div className="fixed left-6 bottom-8 z-50 flex flex-col gap-4">
        <button
          className="relative bg-pink-200 text-pink-600 rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-300 transition-colors group"
          onClick={() => { router.push('/wishlist'); }}
          aria-label="Danh sách yêu thích"
          title="Danh sách yêu thích"
          type="button"
        >
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="flex"
          >
            <Heart className="h-7 w-7" />
          </motion.span>
          {wishlist.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-400 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white font-bold">
              {wishlist.length}
            </span>
          )}
        </button>
        <button
          className="relative bg-pink-400 text-white rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-pink-500 transition-colors group"
          onClick={() => { router.push('/cart'); }}
          aria-label="Giỏ hàng"
          title="Giỏ hàng"
          type="button"
        >
          <ShoppingCartIcon className="w-7 h-7" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white font-bold">
              {items.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
} 
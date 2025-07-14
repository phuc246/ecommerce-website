"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';
import { sendPosthogEvent } from '@/lib/utils';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isWishlisted } = useWishlist();
  const [product, setProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [mainImg, setMainImg] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<any[]>([]);
  const { items: cartItems } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const openModal = useCallback((idx: number) => {
    let imgs = images;
    let index = idx;
    if (mainImg && !images.some(img => img.url === mainImg)) {
      imgs = [{ url: mainImg, isMain: true }, ...images];
      index = 0;
    }
    setModalImages(imgs);
    setModalIndex(index);
    setIsModalOpen(true);
  }, [images, mainImg]);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const handleModalKey = useCallback((e: any) => { if (e.key === 'Escape') closeModal(); }, [closeModal]);
  useEffect(() => { if (isModalOpen) { window.addEventListener('keydown', handleModalKey); return () => window.removeEventListener('keydown', handleModalKey); } }, [isModalOpen, handleModalKey]);
  const [flyImage, setFlyImage] = useState<null | { x: number, y: number, url: string }>(null);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const [modalImages, setModalImages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { status } = useSession();
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedPage, setRelatedPage] = useState(0);
  const relatedPerPage = 12; // tối đa 12 sản phẩm random
  const relatedRow = 4; // mỗi lần hiển thị 4 sp
  const relatedSliderRef = useRef<HTMLDivElement>(null);

  // Lấy variant đã chọn
  const selectedVariant = product && Array.isArray(product.variants)
    ? product.variants.find((v: any) => v.color === selectedColor && v.size === selectedSize)
    : undefined;
  // Helper lấy productVariantId từ variant đã chọn
  const selectedVariantId = selectedVariant?.id;

  // Fetch reviews khi load trang hoặc khi chọn biến thể
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    let url = `/api/products/${id}/reviews`;
    if (selectedVariantId) url += `?productVariantId=${selectedVariantId}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id, selectedVariantId]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
          setProduct(data);
        const imgs = data.images && data.images.length > 0 ? data.images : data.image ? [{ url: data.image, isMain: true }] : [];
        // Lọc trùng ảnh theo url trước khi set
        const uniqueImgs = imgs.filter((img: any, idx: number, arr: any[]) => arr.findIndex((i: any) => i.url === img.url) === idx);
        setImages(uniqueImgs);
        setMainImg(uniqueImgs[0]?.url);
        setLoading(false);
      })
      .catch(() => {
        setError("Không tìm thấy sản phẩm");
          setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!product || !product.id) return;
    fetch('/api/products/shop')
      .then(res => res.json())
      .then(data => {
        let all = Array.isArray(data) ? data : data.products || [];
        all = all.filter((p: any) => p.id !== product.id);
        // Xáo trộn random
        for (let i = all.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        setRelatedProducts(all.slice(0, relatedPerPage));
        setRelatedPage(0);
      });
  }, [product && product.id]);

  useEffect(() => {
    if (product && product.id) {
      sendPosthogEvent('product_view', { productId: product.id, name: product.name });
    }
  }, [product?.id]);

  const handleRelatedPrev = () => {
    setRelatedPage((p) => Math.max(0, p - 1));
  };
  const handleRelatedNext = () => {
    setRelatedPage((p) => Math.min(Math.ceil(relatedProducts.length / relatedRow) - 1, p + 1));
  };

  if (loading) return <div className="text-center py-12">Đang tải...</div>;
  if (error || !product) return <div className="text-center py-12 text-red-500">{error || "Không tìm thấy sản phẩm"}</div>;
  
  // Lấy danh sách màu và size còn hàng
  const colorOptions: string[] = Array.from(new Set((product.variants || []).map((v: any) => v.color)));
  const sizeOptions: string[] = selectedColor
    ? Array.from(new Set((product.variants || []).filter((v: any) => v.color === selectedColor).map((v: any) => v.size)))
    : [];
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  // Tính giá thấp nhất, cao nhất trong tất cả biến thể
  const prices = (product.variants || []).map((v: any) => v.salePrice && v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Tính giá gốc thấp nhất, cao nhất (để luôn hiện giá gốc nếu có sale)
  const oldPrices = (product.variants || []).map((v: any) => v.price);
  const minOldPrice = Math.min(...oldPrices);
  const maxOldPrice = Math.max(...oldPrices);
  // Hiển thị giá của biến thể đã chọn (nếu có), nếu chưa chọn thì hiển thị khoảng giá
  const showSale = selectedVariant?.salePrice && selectedVariant.salePrice < selectedVariant.price;
  const displayPrice = selectedVariant ? (showSale ? selectedVariant.salePrice : selectedVariant.price) : minPrice;
  const displayOldPrice = selectedVariant ? (showSale ? selectedVariant.price : (selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.price ? selectedVariant.price : null)) : (minOldPrice !== maxOldPrice ? `${minOldPrice.toLocaleString('vi-VN')}đ - ${maxOldPrice.toLocaleString('vi-VN')}đ` : (minOldPrice > minPrice ? minOldPrice.toLocaleString('vi-VN') : null));
  // Badge danh mục con (chỉ hiện 1 lần, dưới tên sản phẩm)
  const categoryBadge = product.category?.name ? (
    <span className="inline-block bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-bold mr-2 mb-1 border border-blue-200">{product.category.name}</span>
  ) : null;
  // Badge thuộc tính
  const attributeBadges = (product.attributes || []).map((attr: any) => (
    <span key={attr.id} className="inline-block bg-yellow-50 border border-yellow-200 rounded px-2 py-0.5 text-yellow-700 font-semibold text-xs mr-1 mb-1">{attr.name} {attr.value}</span>
  ));
  // Badge đã bán, đánh giá
  const sold = typeof product.sold === 'number' ? product.sold : 0;
  const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
  const avgRating = reviewCount > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount) : 0;

  // Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    if (!selectedColor || !selectedSize || outOfStock) return;
    if (addToCartBtnRef.current && cartIconRef.current) {
      const btnRect = addToCartBtnRef.current.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();
      setFlyImage({
        x: cartRect.left - btnRect.left,
        y: cartRect.top - btnRect.top,
        url: mainImg || ''
      });
      setTimeout(() => setFlyImage(null), 900);
    }
    setAdding(true);
      await addItem({
        productId: product.id,
      colorId: selectedColor,
      sizeId: selectedSize,
        quantity,
      });
    setAdding(false);
    // No redirect
  };

  // Nút yêu thích đồng bộ
  const wishlisted = isWishlisted(product.id);
  const handleWishlist = () => {
    if (wishlisted) removeFromWishlist(product.id);
    else addToWishlist(product.id);
  };

  // Khi chọn màu, nếu biến thể có ảnh thì đổi ảnh chính
  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null);
    const colorVariant = product.variants.find((v: any) => v.color === color);
    if (colorVariant?.image) setMainImg(colorVariant.image);
  };

  const relatedShown = relatedProducts.slice(relatedPage * relatedRow, (relatedPage + 1) * relatedRow);
  const relatedCount = relatedShown.length;
  const cardHeight = 224; // h-56 = 14rem = 224px
  const gap = 16; // gap-4 = 1rem = 16px
  const minHeight = relatedCount > 0 ? (relatedCount * cardHeight + (relatedCount - 1) * gap) : 0;

  // Thay thế style inline bằng className động
  const minHeightClass = `related-slider-minheight-${relatedCount}`;

  return (
    <div className="relative min-h-screen pt-24">
      {/* Pattern background */}
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-full bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100">
          <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-40 md:h-64 opacity-60">
            <path fill="#fbc2eb" fillOpacity="0.5" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
            <path fill="#a6c1ee" fillOpacity="0.3" d="M0,256L60,229.3C120,203,240,149,360,154.7C480,160,600,224,720,229.3C840,235,960,181,1080,176C1200,171,1320,213,1380,234.7L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
        </div>
      </div>
      {/* Floating icons bottom left */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4 items-start">
        {/* Sửa nút trái tim nổi ở góc trái dưới: */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/wishlist')}
          className="bg-pink-200 text-pink-600 rounded-full shadow-lg p-4 flex items-center justify-center border-2 border-pink-200 relative"
          aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
          title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
        >
          <motion.span
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="flex"
          >
            <Heart size={28} className={wishlisted ? 'fill-pink-500 text-pink-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
          </motion.span>
        </motion.button>
        <motion.button
          ref={cartIconRef}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/cart')}
          className="bg-pink-400 text-white rounded-full shadow-lg p-4 flex items-center justify-center border-2 border-pink-400 relative"
          aria-label="Xem giỏ hàng"
          title="Xem giỏ hàng"
        >
          <ShoppingCart size={28} />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white font-bold">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </motion.button>
                 </div>
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-yellow-100 via-pink-50 to-orange-100 rounded-3xl shadow-2xl p-8 md:p-14 relative">
        {/* Gallery + Thông tin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-3 relative cursor-pointer" onClick={() => openModal(images.findIndex(img => img.url === mainImg))}>
              <img src={mainImg} alt={product.name} className="object-contain w-full h-full" />
            </div>
            {/* Modal popup for images */}
            <AnimatePresence>
              {isModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                  onClick={closeModal}
                  aria-modal="true"
                  role="dialog"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="relative bg-white rounded-2xl shadow-2xl p-2 flex flex-col items-center"
                    onClick={e => e.stopPropagation()}
                  >
                    <img src={modalImages[modalIndex]?.url} alt={product.name} className="max-w-[80vw] max-h-[80vh] rounded-xl object-contain" />
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-pink-100 hover:bg-pink-300 text-pink-600 rounded-full p-2 shadow-lg"
                      onClick={() => setModalIndex((modalIndex - 1 + modalImages.length) % modalImages.length)}
                      aria-label="Ảnh trước"
                      type="button"
                    >
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-100 hover:bg-pink-300 text-pink-600 rounded-full p-2 shadow-lg"
                      onClick={() => setModalIndex((modalIndex + 1) % modalImages.length)}
                      aria-label="Ảnh sau"
                      type="button"
                    >
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      className="absolute top-2 right-2 bg-gray-100 hover:bg-gray-300 text-gray-700 rounded-full p-2 shadow-lg"
                      onClick={closeModal}
                      aria-label="Đóng"
                      type="button"
                    >
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any, idx: number) => (
                <img
                  key={img.url + '-' + idx}
                  src={img.url}
                  alt={product.name + " " + idx}
                  className={`w-16 h-16 rounded-lg border cursor-pointer object-cover ${mainImg === img.url ? 'ring-2 ring-pink-400' : ''}`}
                  onClick={() => setMainImg(img.url)}
                />
              ))}
              </div>
          </div>
          {/* Thông tin sản phẩm */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-1 bg-gradient-to-r from-pink-500 via-yellow-400 to-fuchsia-500 bg-clip-text text-transparent animate-gradient-x">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {categoryBadge}
              <span className="inline-block bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-bold border border-green-200">Đã bán {sold}</span>
              <span className="flex bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-bold border border-yellow-200 items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><polygon points="9.9,1.1 7.6,6.6 1.6,7.6 6,11.9 4.9,17.9 9.9,14.9 14.9,17.9 13.8,11.9 18.2,7.6 12.2,6.6 "/></svg>
                ))}
                <span className="ml-1">{reviewCount}</span>
              </span>
            </div>
            {/* Giá sản phẩm */}
            <div className="flex items-end gap-4 mb-2 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-pink-600">
                {selectedVariant ? displayPrice.toLocaleString('vi-VN') + 'đ' : `${minPrice.toLocaleString('vi-VN')}đ${minPrice !== maxPrice ? ' - ' + maxPrice.toLocaleString('vi-VN') + 'đ' : ''}`}
              </span>
              {selectedVariant && showSale && (
                <span className="text-base md:text-lg line-through text-gray-400 ml-2">{selectedVariant.price.toLocaleString('vi-VN')}đ</span>
                  )}
              {!selectedVariant && minOldPrice !== maxOldPrice && (
                <span className="text-base md:text-lg line-through text-gray-400 ml-2">{minOldPrice.toLocaleString('vi-VN')}đ - {maxOldPrice.toLocaleString('vi-VN')}đ</span>
              )}
            </div>
            {/* Badge thuộc tính */}
            {attributeBadges.length > 0 && (
              <div className="mb-3">
                <div className="font-semibold mb-1">Phù hợp:</div>
                <div className="flex flex-wrap gap-2">{attributeBadges}</div>
              </div>
            )}
            {/* Chọn màu */}
            <div className="mb-2">
              <div className="font-semibold mb-1">Màu sắc:</div>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => {
                  // Tìm thumbnail cho màu này nếu có
                  const colorVariant = product.variants.find((v: any) => v.color === color);
                  const thumb = colorVariant?.image;
                  return (
                    <button key={color} className={`flex items-center gap-1 px-3 py-1 rounded-full border ${selectedColor === color ? 'bg-pink-500 text-white border-pink-600' : 'bg-white text-pink-700 border-pink-200'} font-bold shadow-sm`} onClick={() => handleSelectColor(color)}>
                      {thumb && <img src={thumb} alt={color} className="w-6 h-6 rounded mr-1 border object-cover" />}
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Chọn size */}
            <div className="mb-2">
              <div className="font-semibold mb-1">Size:</div>
              <div className="flex gap-2 flex-wrap">
                {sizeOptions.length === 0 && <span className="text-gray-400 text-xs">Chọn màu trước</span>}
                {sizeOptions.map((size) => {
                  const variant = product.variants.find((v: any) => v.color === selectedColor && v.size === size);
                  return (
                    <button key={size} className={`px-3 py-1 rounded-full border font-bold shadow-sm ${selectedSize === size ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white text-yellow-700 border-yellow-200'}`} onClick={() => setSelectedSize(size)}>
                    {size}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Số lượng */}
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold">Số lượng:</span>
              <input type="number" min={1} max={selectedVariant?.stock || 1} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(Number(e.target.value), selectedVariant?.stock || 1)))} className="w-16 px-2 py-1 border rounded focus:ring-pink-400" disabled={outOfStock} placeholder="Số lượng" aria-label="Số lượng" />
              {selectedVariant && (
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1
                    ${selectedVariant.stock < 5
                      ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                      : 'bg-green-100 text-green-700 border-green-300 animate-[pulse_2s_infinite]'}
                  `}
                  aria-live="polite"
                >
                  {selectedVariant.stock < 5 ? '⚠️' : '✔️'}
                  Còn {selectedVariant.stock} sản phẩm
                </span>
              )}
            </div>
            {/* Nút thêm vào giỏ hàng */}
            <div className="flex items-center justify-center gap-3 mt-6 w-full">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.back()}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-pink-600 bg-pink-50 border border-pink-200 font-semibold text-base hover:underline transition-all"
                type="button"
              >
                <ArrowLeft size={20} />
                Quay về
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={!selectedColor || !selectedSize || outOfStock || adding}
                ref={addToCartBtnRef}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                type="button"
              >
                {(!selectedColor || !selectedSize)
                  ? (adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng')
                  : (outOfStock ? 'Hết hàng' : (adding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'))}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleWishlist}
                className={`flex items-center justify-center p-3 rounded-full border-2 font-bold text-pink-500 border-pink-300 bg-white shadow transition-all duration-200 ${wishlisted ? 'bg-pink-100' : ''}`}
                aria-label={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
                type="button"
              >
                <motion.span
                  animate={wishlisted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={wishlisted ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
                  className="flex"
              >
                  <Heart size={22} className={wishlisted ? 'fill-pink-500 text-pink-500' : ''} fill={wishlisted ? 'currentColor' : 'none'} />
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
        {/* Mô tả chi tiết, đánh giá, sản phẩm liên quan... */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-pink-700 mb-2">Mô tả sản phẩm</h2>
            <div className="text-gray-700 whitespace-pre-line mb-4">{product.description}</div>
            {/* Đánh giá sản phẩm */}
            <div className="mt-6">
              <h3 className="font-semibold text-pink-600 mb-1">Đánh giá sản phẩm</h3>
              {reviewsLoading ? (
                <div className="text-gray-400 text-sm">Đang tải đánh giá...</div>
              ) : reviews.length === 0 ? (
                <div className="text-gray-400 text-sm">Chưa có đánh giá nào cho {selectedVariant ? 'biến thể này' : 'sản phẩm này'}.</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {reviews.slice(0, 3).map((r: any) => (
                    <div key={r.id} className="bg-white/80 rounded-xl border border-pink-100 p-3 flex gap-3 items-center">
                      {(r.orderVariant?.image || r.productVariant?.image) && (
                        <img src={r.orderVariant?.image || r.productVariant?.image} alt="variant" className="w-12 h-12 rounded border object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-pink-700 text-sm">{renderReviewerName(r)}</span>
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-0.5">
                          {[1,2,3,4,5].map(star => <StarIcon key={star} className={star <= r.rating ? 'text-yellow-400 h-4 w-4' : 'text-gray-300 h-4 w-4'} />)}
                          <span className="ml-2 text-xs font-semibold" {...(r.orderVariant?.color || r.productVariant?.color ? { style: { color: r.orderVariant?.color || r.productVariant?.color } } : {})}>
                            {r.orderVariant?.color || r.productVariant?.color}
                          </span>
                          {(r.orderVariant?.size || r.productVariant?.size) && <span className="ml-1 text-xs text-gray-500">Size: {r.orderVariant?.size || r.productVariant?.size}</span>}
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-line line-clamp-2">{r.comment}</div>
                      </div>
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <div className="text-center text-xs text-pink-500 mt-2">Cuộn để xem thêm đánh giá...</div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Sản phẩm liên quan - slider */}
          <div>
            <h3 className="font-semibold text-pink-600 mb-2">Có thể bạn thích</h3>
            <div className={`relative flex items-center justify-center ${minHeightClass}`}>
              {/* Nút trái */}
              <button
                onClick={handleRelatedPrev}
                disabled={relatedPage === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-full flex items-center px-2 bg-transparent border-none shadow-none text-yellow-400 text-3xl hover:bg-yellow-100/40 rounded-full transition disabled:opacity-30 z-10"
                aria-label="Sản phẩm trước"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {/* Slider */}
              <div ref={relatedSliderRef} className="flex flex-col gap-4 mx-10 transition-all duration-300">
                {relatedShown.map((p: any) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="group bg-white rounded-2xl shadow-xl overflow-hidden aspect-[3/4] flex flex-col justify-end hover:shadow-2xl transition relative max-w-[160px] h-56 mx-auto">
                    <img src={p.image} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="relative z-10 px-2 py-2 flex flex-wrap items-center gap-1 justify-center bg-gradient-to-t from-white/80 via-white/30 to-transparent">
                      {Array.isArray(p.attributes) && p.attributes.slice(0, 3).map((attr: any) => (
                        <span key={attr.id || attr.name} className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 font-bold">{attr.name}</span>
                      ))}
                      {Array.isArray(p.attributes) && p.attributes.length > 3 && (
                        <span className="text-xs bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 font-bold">+{p.attributes.length - 3}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {/* Nút phải */}
              <button
                onClick={handleRelatedNext}
                disabled={relatedPage >= Math.ceil(relatedProducts.length / relatedRow) - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-full flex items-center px-2 bg-transparent border-none shadow-none text-yellow-400 text-3xl hover:bg-yellow-100/40 rounded-full transition disabled:opacity-30 z-10"
                aria-label="Sản phẩm tiếp theo"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {flyImage && (
          <motion.img
            src={flyImage.url}
            alt="fly"
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, position: 'fixed', zIndex: 50, left: addToCartBtnRef.current?.getBoundingClientRect().left, top: addToCartBtnRef.current?.getBoundingClientRect().top }}
            animate={{ x: flyImage.x, y: flyImage.y, scale: 0.2, opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
            className="pointer-events-none rounded-xl shadow-lg border-2 border-pink-200"
            style={{ position: 'fixed', width: '80px', height: '80px', left: addToCartBtnRef.current?.getBoundingClientRect().left, top: addToCartBtnRef.current?.getBoundingClientRect().top }}
          />
        )}
      </AnimatePresence>
      <style jsx global>{`
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease-in-out infinite;
  }
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`}</style>
    </div>
  );
}

// Helper để ẩn tên nếu cần
function renderReviewerName(review: { user?: { name?: string }, hideName?: boolean }) {
  const name = review.user?.name || 'Người dùng';
  if (!review.hideName) return name;
  if (name.length <= 2) return name;
  return name[0] + '*****' + name[name.length - 1];
} 
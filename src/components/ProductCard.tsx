import { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

interface ProductCardProps {
  product: Product & {
    category: {
      name: string;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        <div className="mb-2">
          <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full">
            {product.category.name}
          </span>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="block text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 mb-2"
        >
          {product.name}
        </Link>
        <p className="text-2xl font-bold text-blue-600 mb-4">
          ${product.price.toFixed(2)}
        </p>
        <div className="transform translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  );
} 
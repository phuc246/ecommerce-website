import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <h1 className="text-4xl font-bold mb-8">Welcome to Our Ecommerce Store</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Discover our amazing products with great prices and excellent quality.
      </p>
      <Link
        href="/products"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Shop Now
      </Link>
    </div>
  );
} 
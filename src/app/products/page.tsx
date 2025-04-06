import { PrismaClient } from "@prisma/client";
import ProductCard from "@/components/ProductCard";

const prisma = new PrismaClient();

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });
  return products;
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our amazing collection of products, carefully selected for quality and value.
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products available at the moment.</p>
        </div>
      )}
    </div>
  );
} 
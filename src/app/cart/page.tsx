import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import CartItem from "@/components/CartItem";
import { redirect } from "next/navigation";
import Link from "next/link";

const prisma = new PrismaClient();

async function getCart() {
  const session = await getServerSession();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      cart: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  return user?.cart;
}

export default async function CartPage() {
  const cart = await getCart();
  
  if (!cart) {
    redirect("/auth/signin");
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        {cart.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">Your cart is empty</h3>
            <p className="mt-1 text-gray-500">Start adding some items to your cart!</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                <div className="flex justify-between text-base text-gray-500">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base text-gray-500">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <button className="mt-6 w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Proceed to Checkout
              </button>
              
              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
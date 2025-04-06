'use client';

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            Ecommerce
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/products" className="hover:text-gray-600">
              Products
            </Link>
            <Link href="/cart" className="hover:text-gray-600">
              Cart
            </Link>
            {session ? (
              <>
                <Link href="/orders" className="hover:text-gray-600">
                  Orders
                </Link>
                {session.user?.email === "admin@example.com" && (
                  <Link href="/admin" className="hover:text-gray-600">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="hover:text-gray-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth/signin" className="hover:text-gray-600">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
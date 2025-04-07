"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="pt-16 flex-grow">{children}</main>
      <Footer />
    </div>
  );
} 
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import UserNavigation from "@/components/UserNavigation";
import AdminNavigation from "@/components/AdminNavigation";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

function NavigationWrapper() {
  const { data: session } = useSession();
  return session?.user?.role === "ADMIN" ? <AdminNavigation /> : <UserNavigation />;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <NavigationWrapper />
          <main>{children}</main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
} 
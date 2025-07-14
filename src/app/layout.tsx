'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/providers/AuthProvider";
import { WishlistProvider } from "@/hooks/use-wishlist";
import Layout from "@/components/Layout";
import { CSPostHogProvider } from "@/providers/PostHogProvider";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { sendPosthogEvent } from '@/lib/utils';
import posthog from '@/lib/posthog';

const inter = Inter({ subsets: ["latin"] });

function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    sendPosthogEvent('$pageview', { pathname });
    const handlePageLeave = () => {
      posthog.capture && posthog.capture('$pageleave');
    };
    window.addEventListener('beforeunload', handlePageLeave);
    return () => window.removeEventListener('beforeunload', handlePageLeave);
  }, [pathname]);
  return (
    <AuthProvider>
      <CSPostHogProvider>
        <WishlistProvider>
          <Layout>
            {children}
          </Layout>
        </WishlistProvider>
      </CSPostHogProvider>
    </AuthProvider>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdmin = pathname.startsWith('/admin');
  return (
    <html lang="vi">
      <body className={inter.className + " min-h-screen"}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { maxWidth: 360, width: '100%', margin: '0.5rem 0' },
            className: 'shadow-lg rounded-xl',
          }}
          gap={16}
          visibleToasts={5}
        />
      </body>
    </html>
  );
} 
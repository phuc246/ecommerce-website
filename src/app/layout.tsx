import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/providers/AuthProvider";
import { WishlistProvider } from "@/hooks/use-wishlist";
import Layout from "@/components/Layout";
import AnalyticsClient from '@/components/AnalyticsClient';
import { CSPostHogProvider } from "@/providers/PostHogProvider";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Doovin',
  description: 'Doovin - E-commerce',
  icons: {
    icon: '/favicon.ico',
  },
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CSPostHogProvider>
        <WishlistProvider>
          <Layout>
            {children}
          </Layout>
          <Toaster />
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
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <AnalyticsClient />
      </body>
    </html>
  );
} 
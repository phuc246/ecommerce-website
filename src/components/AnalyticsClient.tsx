"use client";
import { Analytics } from '@vercel/analytics/react';
import { usePathname } from 'next/navigation';

export default function AnalyticsClient() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;
  return <Analytics />;
} 
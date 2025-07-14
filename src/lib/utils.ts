import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import posthog from '@/lib/posthog';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function sendPosthogEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog) {
    const distinctId = posthog.get_distinct_id?.();
    const props = {
      ...properties,
      ...(distinctId ? { userId: distinctId } : {})
    };
    // Kiểm tra kích thước properties (dưới 5KB)
    const size = JSON.stringify(props).length;
    if (size > 5000) {
      console.warn('PostHog event properties quá lớn, không gửi:', props);
      return;
    }
    posthog.capture(event, props);
  }
}

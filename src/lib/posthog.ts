import posthog from 'posthog-js';

if (typeof window !== 'undefined' && !(window as any).__posthog_inited) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://us.i.posthog.com', // SỬA LẠI HOST CHO ĐÚNG
    capture_pageview: false,
  });
  (window as any).__posthog_inited = true;
}

export default posthog; 
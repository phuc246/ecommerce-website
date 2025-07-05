import { useState, useCallback, useEffect } from 'react';

export interface LogoData {
  url: string;
  isCircular: boolean;
  isLoading: boolean;
}

export function useLogo() {
  const [logo, setLogo] = useState<LogoData>({
    url: '',
    isCircular: true,
    isLoading: true,
  });

  const fetchLogo = useCallback(async () => {
    setLogo((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/logo', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        next: { revalidate: 0 },
      });
      if (!response.ok) throw new Error('Failed to fetch logo');
      const data = await response.json();
      let logoUrl = data.url || '';
      if (logoUrl && typeof logoUrl === 'string') {
        if (!logoUrl.startsWith('data:image/')) {
          logoUrl = `${logoUrl}?t=${Date.now()}`;
        }
      }
      setLogo({
        url: logoUrl,
        isCircular: data.isCircular !== undefined ? data.isCircular : true,
        isLoading: false,
      });
    } catch (error) {
      setLogo({
        url: '',
        isCircular: true,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  // Manual refresh
  const refresh = () => fetchLogo();

  return { ...logo, refresh };
} 
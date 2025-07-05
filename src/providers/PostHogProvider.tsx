'use client'
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false // Disable automatic pageview capture, as we'll handle it manually
  })
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <PostHogAuthWrapper>
                {children}
            </PostHogAuthWrapper>
        </PostHogProvider>
    )
}

function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session.user) {
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
            });
        } else if (status === 'unauthenticated') {
            posthog.reset();
        }
    }, [session, status]);

    return children;
} 
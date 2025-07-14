'use client'
import { useSession } from 'next-auth/react';
import posthog from '@/lib/posthog';
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react';

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
            posthog.capture('pageview'); // Gửi event để PostHog ghi nhận device info
        } else if (status === 'unauthenticated') {
            posthog.reset();
        }
    }, [session, status]);

    return children;
} 
'use client';

import { useEffect } from 'react';

export function PWARegister(): null {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator)) return;
        if (process.env.NODE_ENV !== 'production') return;

        const register = async (): Promise<void> => {
            try {
                await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            } catch (err) {
                console.warn('SW registration failed', err);
            }
        };

        if (document.readyState === 'complete') {
            void register();
        } else {
            window.addEventListener('load', () => void register(), { once: true });
        }
    }, []);

    return null;
}

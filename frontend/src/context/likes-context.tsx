'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

interface LikesContextValue {
    likedIds: Set<string>;
    isLiked: (productId: string) => boolean;
    toggleLike: (productId: string) => Promise<boolean>;
    requireAuth: () => boolean;
    onAuthRequired: (handler: () => void) => void;
}

const LikesContext = createContext<LikesContextValue | null>(null);

export function LikesProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [authHandler, setAuthHandler] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (status !== 'authenticated') {
            setLikedIds(new Set());
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/likes/ids');
                if (!res.ok) return;
                const data = (await res.json()) as { ids: string[] };
                if (!cancelled) setLikedIds(new Set(data.ids));
            } catch (err) {
                console.error('Failed to load liked ids:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [status, session?.user?.email]);

    const isLiked = useCallback(
        (productId: string) => likedIds.has(productId),
        [likedIds]
    );

    const requireAuth = useCallback(() => {
        if (status !== 'authenticated') {
            authHandler?.();
            return false;
        }
        return true;
    }, [status, authHandler]);

    const toggleLike = useCallback(
        async (productId: string): Promise<boolean> => {
            if (!requireAuth()) return false;

            const willLike = !likedIds.has(productId);
            setLikedIds((prev) => {
                const next = new Set(prev);
                if (willLike) next.add(productId);
                else next.delete(productId);
                return next;
            });

            try {
                const res = await fetch('/api/likes/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId }),
                    keepalive: true,
                });
                if (!res.ok) throw new Error('toggle failed');
                const data = (await res.json()) as { liked: boolean };
                setLikedIds((prev) => {
                    const next = new Set(prev);
                    if (data.liked) next.add(productId);
                    else next.delete(productId);
                    return next;
                });
                return data.liked;
            } catch (err) {
                // Ignore aborted/in-flight failures caused by navigation —
                // the request reaches the server via keepalive.
                if (typeof window !== 'undefined' && document.visibilityState === 'hidden') {
                    return willLike;
                }
                console.error('toggleLike error:', err);
                setLikedIds((prev) => {
                    const next = new Set(prev);
                    if (willLike) next.delete(productId);
                    else next.add(productId);
                    return next;
                });
                return !willLike;
            }
        },
        [likedIds, requireAuth]
    );

    const onAuthRequired = useCallback((handler: () => void) => {
        setAuthHandler(() => handler);
    }, []);

    const value = useMemo<LikesContextValue>(
        () => ({ likedIds, isLiked, toggleLike, requireAuth, onAuthRequired }),
        [likedIds, isLiked, toggleLike, requireAuth, onAuthRequired]
    );

    return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>;
}

export function useLikes(): LikesContextValue {
    const ctx = useContext(LikesContext);
    if (!ctx) throw new Error('useLikes must be used within LikesProvider');
    return ctx;
}

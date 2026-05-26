'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useLikes } from '@/context/likes-context';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
    productId: string;
    variant?: 'overlay' | 'inline';
    className?: string;
}

export function LikeButton({ productId, variant = 'overlay', className }: LikeButtonProps) {
    const { isLiked, toggleLike } = useLikes();
    const { status } = useSession();
    const [authOpen, setAuthOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const liked = isLiked(productId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status !== 'authenticated') {
            setAuthOpen(true);
            return;
        }
        if (pending) return;
        setPending(true);
        try {
            await toggleLike(productId);
        } finally {
            setPending(false);
        }
    };

    const baseClasses =
        variant === 'overlay'
            ? 'absolute top-2 right-2 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white transition-all hover:scale-110 active:scale-95'
            : 'inline-flex items-center justify-center gap-2 h-12 px-4 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-all active:scale-95';

    return (
        <>
            <button
                type="button"
                aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
                aria-pressed={liked}
                data-testid="like-button"
                data-liked={liked ? 'true' : 'false'}
                onClick={handleClick}
                disabled={pending}
                className={cn(baseClasses, className)}
            >
                <Heart
                    className={cn(
                        'h-5 w-5 transition-colors',
                        liked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-700'
                    )}
                />
                {variant === 'inline' && (
                    <span className="text-base font-medium">
                        {liked ? 'В избранном' : 'В избранное'}
                    </span>
                )}
            </button>
            <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </>
    );
}

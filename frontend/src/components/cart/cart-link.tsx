'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';

export function CartLink() {
    const { totalCount } = useCart();

    return (
        <Link href="/cart" data-testid="cart-link">
            <Button
                variant="ghost"
                size="icon"
                aria-label="Корзина"
                className="relative"
            >
                <ShoppingCart className="h-5 w-5" />
                {totalCount > 0 && (
                    <span
                        data-testid="cart-badge"
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center"
                    >
                        {totalCount}
                    </span>
                )}
            </Button>
        </Link>
    );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ProductCard } from '@/components/item-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { AuthDialog } from '@/components/auth/auth-dialog';

export default function FavoritesPage() {
    const { status } = useSession();
    const [items, setItems] = useState<Product[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [authOpen, setAuthOpen] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (status !== 'authenticated') {
            setLoading(false);
            setItems([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/likes');
                if (!res.ok) throw new Error('failed');
                const data = (await res.json()) as { items: Product[] };
                if (!cancelled) setItems(data.items);
            } catch (err) {
                console.error('Failed to load favorites:', err);
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [status]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                        <span>SMARTBUY</span>
                    </Link>
                    <Link href="/products">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            К каталогу
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                <div className="flex items-center gap-3 mb-8">
                    <Heart className="h-7 w-7 fill-red-500 text-red-500" />
                    <h1 className="text-3xl font-bold tracking-tight" data-testid="favorites-title">
                        Избранное {items && `(${items.length})`}
                    </h1>
                </div>

                {status === 'unauthenticated' && (
                    <div className="text-center py-20" data-testid="favorites-unauth">
                        <p className="text-gray-500 mb-4">
                            Войдите, чтобы видеть свои избранные товары.
                        </p>
                        <Button onClick={() => setAuthOpen(true)}>Войти</Button>
                        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
                    </div>
                )}

                {status === 'authenticated' && loading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-[300px] w-full rounded-lg" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {status === 'authenticated' && !loading && items && items.length === 0 && (
                    <div className="text-center py-20" data-testid="favorites-empty">
                        <p className="text-gray-500 mb-4">У вас пока нет избранных товаров.</p>
                        <Link href="/products">
                            <Button>Перейти в каталог</Button>
                        </Link>
                    </div>
                )}

                {status === 'authenticated' && !loading && items && items.length > 0 && (
                    <div
                        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6"
                        data-testid="favorites-grid"
                    >
                        {items.map((product, idx) => (
                            <ProductCard key={(product.id || product.url) + idx} product={product} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

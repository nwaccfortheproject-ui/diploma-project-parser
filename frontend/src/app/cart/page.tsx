'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart, formatKzt } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';

const DELIVERY_FEE = 1990;

export default function CartPage() {
    const { items, totalCount, totalPrice, setQuantity, removeFromCart } = useCart();
    const hasItems = items.length > 0;
    const total = hasItems ? totalPrice + DELIVERY_FEE : 0;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold tracking-tighter text-lg">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        <span>SMARTBUY</span>
                    </Link>
                    <UserMenu />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingCart className="h-7 w-7 text-blue-600" />
                    <h1 className="text-3xl font-bold tracking-tight" data-testid="cart-title">
                        Корзина {hasItems && `(${totalCount})`}
                    </h1>
                </div>

                {!hasItems && (
                    <div className="text-center py-20" data-testid="cart-empty">
                        <p className="text-gray-500 mb-4">Ваша корзина пуста.</p>
                        <Link href="/products">
                            <Button>Перейти в каталог</Button>
                        </Link>
                    </div>
                )}

                {hasItems && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <ul className="lg:col-span-2 space-y-4" data-testid="cart-items">
                            {items.map((item) => {
                                const lineTotal = item.unitPrice * item.quantity;
                                const lineKey = `${item.id}-${item.size ?? ''}`;
                                return (
                                    <li
                                        key={lineKey}
                                        data-testid="cart-item"
                                        className="flex gap-4 p-4 bg-white rounded-xl border"
                                    >
                                        <Link
                                            href={`/product/${item.id}`}
                                            className="relative w-24 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
                                        >
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                sizes="96px"
                                                className="object-cover object-top"
                                            />
                                        </Link>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                                                    {item.brand}
                                                </div>
                                                <Link
                                                    href={`/product/${item.id}`}
                                                    className="font-medium text-gray-900 line-clamp-2 hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.size && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Размер: <span className="font-medium text-gray-900">{item.size}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="inline-flex items-center border rounded-md">
                                                    <button
                                                        type="button"
                                                        aria-label="Уменьшить"
                                                        data-testid="cart-qty-decrease"
                                                        onClick={() =>
                                                            setQuantity(item.id, item.size, item.quantity - 1)
                                                        }
                                                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span
                                                        className="w-10 text-center text-sm font-medium"
                                                        data-testid="cart-qty"
                                                    >
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        aria-label="Увеличить"
                                                        data-testid="cart-qty-increase"
                                                        onClick={() =>
                                                            setQuantity(item.id, item.size, item.quantity + 1)
                                                        }
                                                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right">
                                                    <div
                                                        className="font-semibold text-gray-900"
                                                        data-testid="cart-line-total"
                                                    >
                                                        {formatKzt(lineTotal)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        aria-label="Удалить из корзины"
                                                        data-testid="cart-remove"
                                                        onClick={() => removeFromCart(item.id, item.size)}
                                                        className="text-xs text-gray-500 hover:text-red-600 inline-flex items-center gap-1 mt-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <aside className="lg:col-span-1">
                            <div
                                className="bg-white rounded-xl border p-6 sticky top-24"
                                data-testid="cart-summary"
                            >
                                <h2 className="text-lg font-semibold mb-4">Итого</h2>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">Товары ({totalCount})</dt>
                                        <dd className="font-medium text-gray-900" data-testid="cart-subtotal">
                                            {formatKzt(totalPrice)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-600">Доставка по РК</dt>
                                        <dd className="font-medium text-gray-900">
                                            {formatKzt(DELIVERY_FEE)}
                                        </dd>
                                    </div>
                                    <div className="h-px bg-gray-200 my-3" />
                                    <div className="flex justify-between text-base">
                                        <dt className="font-semibold">К оплате</dt>
                                        <dd className="font-bold" data-testid="cart-total">
                                            {formatKzt(total)}
                                        </dd>
                                    </div>
                                </dl>

                                <Link href="/checkout" className="block mt-6">
                                    <Button className="w-full h-12 text-base" data-testid="checkout-button">
                                        Перейти к оплате
                                    </Button>
                                </Link>

                                <Link href="/products" className="block mt-3">
                                    <Button variant="ghost" className="w-full gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Продолжить покупки
                                    </Button>
                                </Link>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

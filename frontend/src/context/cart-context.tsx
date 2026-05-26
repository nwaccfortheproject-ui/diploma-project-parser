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
import { Product } from '@/types';

export interface CartItem {
    id: string;
    title: string;
    brand: string;
    image: string;
    unitPrice: number;
    priceLabel: string;
    quantity: number;
    size: string | null;
}

interface AddOptions {
    size?: string | null;
}

interface CartContextValue {
    items: CartItem[];
    totalCount: number;
    totalPrice: number;
    addToCart: (product: Product, opts?: AddOptions) => void;
    removeFromCart: (id: string, size: string | null) => void;
    setQuantity: (id: string, size: string | null, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'smartbuy.cart.v1';

export function parsePriceToNumber(value: string | null | undefined): number {
    if (!value) return 0;
    const digits = value.replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}

export function formatKzt(amount: number): string {
    return `${amount.toLocaleString('ru-RU').replace(/,/g, ' ')} тг`;
}

function sameLine(a: CartItem, productId: string, size: string | null): boolean {
    return a.id === productId && (a.size ?? null) === (size ?? null);
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as CartItem[];
                if (Array.isArray(parsed)) setItems(parsed);
            }
        } catch (err) {
            console.error('Cart hydrate error:', err);
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (err) {
            console.error('Cart persist error:', err);
        }
    }, [items, hydrated]);

    const addToCart = useCallback((product: Product, opts?: AddOptions) => {
        if (!product.id) return;
        const priceLabel = product.discount_price || product.price || '';
        const unitPrice = parsePriceToNumber(priceLabel);
        const image = product.images?.[0] || '/placeholder.jpg';
        const size = opts?.size ?? null;

        setItems((prev) => {
            const idx = prev.findIndex((it) => sameLine(it, product.id!, size));
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                return next;
            }
            const newItem: CartItem = {
                id: product.id!,
                title: product.title || 'Товар',
                brand: product.brand || '',
                image,
                unitPrice,
                priceLabel,
                quantity: 1,
                size,
            };
            return [...prev, newItem];
        });
    }, []);

    const removeFromCart = useCallback((id: string, size: string | null) => {
        setItems((prev) => prev.filter((it) => !sameLine(it, id, size)));
    }, []);

    const setQuantity = useCallback(
        (id: string, size: string | null, quantity: number) => {
            setItems((prev) => {
                if (quantity <= 0) {
                    return prev.filter((it) => !sameLine(it, id, size));
                }
                return prev.map((it) =>
                    sameLine(it, id, size) ? { ...it, quantity } : it
                );
            });
        },
        []
    );

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const totalCount = useMemo(
        () => items.reduce((sum, it) => sum + it.quantity, 0),
        [items]
    );

    const totalPrice = useMemo(
        () => items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
        [items]
    );

    const value = useMemo<CartContextValue>(
        () => ({
            items,
            totalCount,
            totalPrice,
            addToCart,
            removeFromCart,
            setQuantity,
            clearCart,
        }),
        [items, totalCount, totalPrice, addToCart, removeFromCart, setQuantity, clearCart]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}

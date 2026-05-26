'use client';

import { Button } from "@/components/ui/button";
import { useStylist } from "@/context/style-context";
import { Check, Shirt, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { LikeButton } from "@/components/product/like-button";
import { useCart } from "@/context/cart-context";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

interface ProductActionsProps {
    product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
    const { openTryOn } = useStylist();
    const { addToCart } = useCart();
    const { data: session } = useSession();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [sizeError, setSizeError] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    useEffect(() => {
        if (!justAdded) return;
        const timer = setTimeout(() => setJustAdded(false), 1800);
        return () => clearTimeout(timer);
    }, [justAdded]);

    const hasSizes = product.sizes && product.sizes.length > 0;

    const handleAddToCart = () => {
        if (hasSizes && !selectedSize) {
            setSizeError(true);
            return;
        }
        setSizeError(false);
        addToCart(product, { size: selectedSize });
        setJustAdded(true);
    };

    return (
        <div className="space-y-4 mb-8">
            {hasSizes && (
                <div className="mb-2">
                    <div className="flex items-baseline justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Выберите размер</h3>
                        {sizeError && (
                            <span className="text-xs text-red-600" data-testid="size-error">
                                Выберите размер
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2" data-testid="size-selector">
                        {product.sizes.map((size) => {
                            const active = selectedSize === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => {
                                        setSelectedSize(size);
                                        setSizeError(false);
                                    }}
                                    data-testid={`size-${size}`}
                                    aria-pressed={active}
                                    className={cn(
                                        'min-w-[3rem] h-10 px-3 rounded-md border text-sm font-medium transition-all',
                                        active
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 bg-white text-gray-900 hover:border-gray-900'
                                    )}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <Button
                    className="flex-1 h-12 text-lg"
                    onClick={handleAddToCart}
                    data-testid="add-to-cart"
                >
                    {justAdded ? (
                        <>
                            <Check className="mr-2 h-5 w-5" />
                            Добавлено в корзину
                        </>
                    ) : (
                        <>
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            Добавить в корзину
                        </>
                    )}
                </Button>
                {product.id && (
                    <LikeButton productId={product.id} variant="inline" className="flex-shrink-0" />
                )}
            </div>

            <Button
                variant="default"
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity"
                onClick={() => {
                    if (!session) {
                        setAuthDialogOpen(true);
                    } else {
                        openTryOn(product);
                    }
                }}
            >
                <Shirt className="mr-2 h-5 w-5" />
                Примерить с AI Стилистом
            </Button>

            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </div>
    );
}

'use client';

import { Button } from "@/components/ui/button";
import { useStylist } from "@/context/style-context";
import { Shirt } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { LikeButton } from "@/components/product/like-button";
import { Product } from "@/types";

interface ProductActionsProps {
    product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
    const { openTryOn } = useStylist();
    const { data: session } = useSession();
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    return (
        <div className="space-y-4 mb-8">
            <div className="flex gap-3">
                <Button className="flex-1 h-12 text-lg">
                    Добавить в корзину
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

            <Button variant="outline" className="w-full h-12 text-lg" asChild>
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                    Открыть в магазине
                </a>
            </Button>

            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
        </div>
    );
}

'use client';

import { Button } from "@/components/ui/button";
import { useStylist } from "@/context/style-context";
import { Shirt } from "lucide-react";

interface ProductActionsProps {
    product: any; // Type strictly if possible
}

export function ProductActions({ product }: ProductActionsProps) {
    const { openTryOn } = useStylist();

    return (
        <div className="space-y-4 mb-8">
            <Button className="w-full h-12 text-lg">
                Добавить в корзину
            </Button>

            <Button
                variant="default"
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity"
                onClick={() => openTryOn(product)}
            >
                <Shirt className="mr-2 h-5 w-5" />
                Примерить с AI Стилистом
            </Button>

            <Button variant="outline" className="w-full h-12 text-lg" asChild>
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                    Открыть в магазине
                </a>
            </Button>
        </div>
    );
}

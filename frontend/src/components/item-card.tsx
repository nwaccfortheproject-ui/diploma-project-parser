import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const hasDiscount = !!product.discount_price;
    const currentPrice = product.discount_price || product.price;

    // Images
    const primaryImage = product.images.length > 0 ? product.images[0] : '/placeholder.jpg';
    const secondaryImage = product.images.length > 1 ? product.images[1] : primaryImage;

    return (
        <Card className="group border-none shadow-none bg-transparent">
            <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 mb-3">
                {/* Badges */}
                {hasDiscount && (
                    <Badge className="absolute top-2 left-2 z-10 bg-red-600/90 text-white border-0 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-sm shadow-sm">
                        Sale
                    </Badge>
                )}

                {/* Images with Hoover Effect */}
                <div className="w-full h-full relative">
                    {/* Primary Image */}
                    <Image
                        src={primaryImage}
                        alt={product.title || 'Product Image'}
                        fill
                        className="object-cover object-top transition-all duration-500 ease-in-out group-hover:scale-105 group-hover:opacity-0"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    {/* Secondary Image (Reveal on Hover) */}
                    <Image
                        src={secondaryImage}
                        alt={product.title || 'Product Image'}
                        fill
                        className="object-cover object-top absolute inset-0 opacity-0 transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />

                    {/* Dark Overlay on Hover (Optional, adds contrast if needed) */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                </div>
            </Link>

            <CardContent className="px-1 py-0 space-y-1">
                {/* Brand */}
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-gray-500">
                    {product.brand}
                </div>

                {/* Title */}
                <Link href={`/product/${product.id}`}>
                    <h3 className="font-medium text-sm text-gray-900 leading-tight line-clamp-1 group-hover:text-black transition-colors">
                        {product.title}
                    </h3>
                </Link>

                {/* Price */}
                <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-bold text-sm text-gray-900">
                        {currentPrice}
                    </span>
                    {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through decoration-gray-400/60">
                            {product.price}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

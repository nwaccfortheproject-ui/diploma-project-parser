"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductGalleryProps {
    images: string[];
    title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const safeImages = images.length > 0 ? images : ['/placeholder.jpg'];

    const nextImage = () => {
        setActiveIndex((prev) => (prev + 1) % safeImages.length);
    };

    const prevImage = () => {
        setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
    };

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 group">
                <Image
                    src={safeImages[activeIndex]}
                    alt={`${title} - Image ${activeIndex + 1}`}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Navigation Arrows */}
                {safeImages.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-10 w-10 shadow-sm"
                            onClick={(e) => { e.preventDefault(); prevImage(); }}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black opacity-0 group-hover:opacity-100 transition-opacity rounded-full h-10 w-10 shadow-sm"
                            onClick={(e) => { e.preventDefault(); nextImage(); }}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {safeImages.length > 1 && (
                <div className="grid grid-cols-5 gap-4">
                    {safeImages.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={cn(
                                "relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 transition-all ring-2 ring-transparent",
                                activeIndex === i ? "ring-blue-600 ring-offset-2" : "opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`View ${i + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

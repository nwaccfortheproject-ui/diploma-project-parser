import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    /** Outer box size in pixels (square). */
    size?: number;
    className?: string;
    priority?: boolean;
}

/**
 * Source asset has a wide white margin around the design, so we render
 * the image at ~165% of the slot and clip the surrounding whitespace.
 */
export function Logo({ size = 48, className, priority = false }: LogoProps) {
    const inner = Math.round(size * 1.65);
    return (
        <div
            data-testid="logo"
            aria-label="SMARTBUY"
            role="img"
            className={cn('relative overflow-hidden select-none flex-shrink-0', className)}
            style={{ width: size, height: size }}
        >
            <Image
                src="/IMG_4241.JPG"
                alt=""
                width={inner}
                height={inner}
                priority={priority}
                className="absolute pointer-events-none"
                style={{
                    width: inner,
                    height: inner,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </div>
    );
}

import { ImageResponse } from 'next/og';
import { IconGraphic } from '@/lib/pwa-icon';

export const dynamic = 'force-static';
export const contentType = 'image/png';

const SIZE = 512;

export function GET(): ImageResponse {
    return new ImageResponse(<IconGraphic size={SIZE} variant="maskable" />, {
        width: SIZE,
        height: SIZE,
    });
}

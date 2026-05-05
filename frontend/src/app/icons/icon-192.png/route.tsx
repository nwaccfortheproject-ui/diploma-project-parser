import { ImageResponse } from 'next/og';
import { IconGraphic } from '@/lib/pwa-icon';

export const dynamic = 'force-static';
export const contentType = 'image/png';

const SIZE = 192;

export function GET(): ImageResponse {
    return new ImageResponse(<IconGraphic size={SIZE} />, { width: SIZE, height: SIZE });
}

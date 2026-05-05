import { ImageResponse } from 'next/og';
import { IconGraphic } from '@/lib/pwa-icon';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon(): ImageResponse {
    return new ImageResponse(<IconGraphic size={64} />, { ...size });
}

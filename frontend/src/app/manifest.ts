import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SMARTBUY — Premium Brands & Latest Trends',
        short_name: 'SMARTBUY',
        description:
            'SMARTBUY — премиум маркетплейс брендовой одежды с AI-стилистом и виртуальной примеркой.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1020',
        theme_color: '#0b1020',
        lang: 'ru',
        dir: 'ltr',
        categories: ['shopping', 'lifestyle', 'fashion'],
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-maskable.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Каталог',
                short_name: 'Каталог',
                description: 'Все товары и фильтры',
                url: '/products',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
            {
                name: 'AI Стилист',
                short_name: 'Стилист',
                description: 'Подбор образов с AI',
                url: '/?stylist=1',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
            },
        ],
    };
}

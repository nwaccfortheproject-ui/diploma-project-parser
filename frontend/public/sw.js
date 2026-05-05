/* SMARTBUY service worker
 *
 * Strategies:
 *  - Navigation requests:        Network-first, fallback to /offline
 *  - /_next/static + /icons/*:   Cache-first (immutable, hashed assets)
 *  - Cloudinary / frgroup CDN:   Stale-while-revalidate (images)
 *  - /api/* and other POST:      Network-only (never cache)
 */

const VERSION = 'v1';
const CACHE_STATIC = `smartbuy-static-${VERSION}`;
const CACHE_PAGES = `smartbuy-pages-${VERSION}`;
const CACHE_IMAGES = `smartbuy-images-${VERSION}`;

const PRECACHE_URLS = ['/offline', '/icons/icon-192.png', '/icons/icon-512.png'];

const IMAGE_HOSTS = ['res.cloudinary.com', 'media.frgroup.kz'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_STATIC)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => ![CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES].includes(k))
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

function isStaticAsset(url) {
    return (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname === '/manifest.webmanifest' ||
        url.pathname === '/favicon.ico'
    );
}

function isImageRequest(request, url) {
    if (request.destination === 'image') return true;
    return IMAGE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone()).catch(() => {});
    }
    return response;
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })
        .catch(() => cached);
    return cached || network;
}

async function networkFirstNavigation(request) {
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            const cache = await caches.open(CACHE_PAGES);
            cache.put(request, response.clone()).catch(() => {});
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match('/offline');
        if (offline) return offline;
        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GETs from the page; never cache mutations or auth.
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Skip cross-origin requests we don't explicitly handle.
    const isSameOrigin = url.origin === self.location.origin;
    const isCdnImage = !isSameOrigin && IMAGE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));

    if (!isSameOrigin && !isCdnImage) return;

    // Skip API routes — always go to network, never serve stale data.
    if (isSameOrigin && url.pathname.startsWith('/api/')) return;

    // Skip Next.js HMR / data probes — let the framework handle them.
    if (url.pathname.startsWith('/_next/data/') || url.pathname.startsWith('/_next/webpack-hmr')) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    if (isImageRequest(request, url)) {
        event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES));
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, CACHE_STATIC));
        return;
    }
});

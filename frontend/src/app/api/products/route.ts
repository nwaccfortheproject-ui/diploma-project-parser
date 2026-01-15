import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Product, ProductsResponse } from '@/types';

// Load data once in memory (serverless warm start cache)
let PRODUCTS_CACHE: Product[] | null = null;

function getProducts(): Product[] {
    if (PRODUCTS_CACHE) return PRODUCTS_CACHE;
    try {
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        PRODUCTS_CACHE = JSON.parse(fileContents);
        // Normalize prices for sorting/filtering and Generate IDs
        PRODUCTS_CACHE?.forEach(p => {
            // Generate a consistent ID from the unique URL
            // Simple hash or encoding since we don't have crypto in Edge/Browser same way, 
            // but this is Node environment.
            let hash = 0;
            for (let i = 0; i < p.url.length; i++) {
                const char = p.url.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            const hexId = Math.abs(hash).toString(16);
            (p as any).id = hexId;

            const price = p.discount_price || p.price;
            (p as any)._parsedPrice = parsePrice(price);
        });
        return PRODUCTS_CACHE || [];
    } catch (e) {
        console.error('Failed to load products', e);
        return [];
    }
}

function parsePrice(priceStr: string | null): number {
    if (!priceStr) return 0;
    // Remove non-numeric characters except digits
    const numericMap = priceStr.replace(/[^\d]/g, '');
    return parseInt(numericMap) || 0;
}

interface CategoryNode {
    name: string;
    count: number;
    children: Map<string, CategoryNode>;
}

function buildCategoryTree(products: Product[]): any[] {
    const root = new Map<string, CategoryNode>();

    products.forEach(p => {
        let currentLevel = root;
        p.categories.forEach((catName) => {
            if (!currentLevel.has(catName)) {
                currentLevel.set(catName, { name: catName, count: 0, children: new Map() });
            }
            const node = currentLevel.get(catName)!;
            node.count++;
            currentLevel = node.children;
        });
    });

    // Helper to convert Map to Array recursively
    const mapToArray = (map: Map<string, CategoryNode>): any[] => {
        return Array.from(map.values()).map(node => ({
            name: node.name,
            count: node.count,
            children: mapToArray(node.children)
        }));
    };

    return mapToArray(root);
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search')?.toLowerCase() || '';

    // Filters
    const genders = searchParams.getAll('gender');
    const categories = searchParams.getAll('category');
    const brands = searchParams.getAll('brand');
    const sizes = searchParams.getAll('size');
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : null;

    let products = getProducts();

    // 1. Base Filter (Search Only) - Facets will be based on this to remain stable
    let searchBase = products;
    if (search) {
        searchBase = products.filter(p => {
            const titleMatch = p.title?.toLowerCase().includes(search);
            const brandMatch = p.brand?.toLowerCase().includes(search);
            const articulMatch = p.article?.toLowerCase().includes(search);
            return titleMatch || brandMatch || articulMatch;
        });
    }

    // 2. Calculate Facets from Search Base (Stable logic)
    const facets = {
        brands: Array.from(new Set(searchBase.map(p => p.brand).filter(Boolean) as string[])).sort(),
        categories: buildCategoryTree(searchBase),
        genders: Array.from(new Set(searchBase.map(p => p.gender).filter(Boolean) as string[])).sort(),
        sizes: Array.from(new Set(searchBase.flatMap(p => p.sizes))).sort(),
        minPrice: searchBase.length ? Math.min(...searchBase.map(p => (p as any)._parsedPrice)) : 0,
        maxPrice: searchBase.length ? Math.max(...searchBase.map(p => (p as any)._parsedPrice)) : 0,
    };

    // 3. Apply Detailed Filters for Products List
    let filtered = searchBase.filter(p => {
        // Gender
        if (genders.length > 0) {
            if (!p.gender || !genders.includes(p.gender)) return false;
        }

        // Category
        if (categories.length > 0) {
            const hasCat = p.categories.some(cat => categories.includes(cat));
            if (!hasCat) return false;
        }

        // Brand
        if (brands.length > 0) {
            if (!p.brand || !brands.includes(p.brand)) return false;
        }

        // Size
        if (sizes.length > 0) {
            const hasSize = p.sizes.some(s => sizes.includes(s));
            if (!hasSize) return false;
        }

        // Price
        const price = (p as any)._parsedPrice;
        if (minPrice !== null && price < minPrice) return false;
        if (maxPrice !== null && price > maxPrice) return false;

        return true;
    });

    // 3. Paginate
    const total = filtered.length;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return NextResponse.json({
        items: paginated,
        total,
        page,
        limit,
        facets
    });
}

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';

interface CategoryNode {
    name: string;
    count: number;
    children: Map<string, CategoryNode>;
}

function buildCategoryTree(products: any[]): any[] {
    const root = new Map<string, CategoryNode>();

    products.forEach(p => {
        let currentLevel = root;
        (p.categories || []).forEach((catName: string) => {
            if (!currentLevel.has(catName)) {
                currentLevel.set(catName, { name: catName, count: 0, children: new Map() });
            }
            const node = currentLevel.get(catName)!;
            node.count++;
            currentLevel = node.children;
        });
    });

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
    try {
        await connectToDatabase();
        
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

        let query: any = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { article: { $regex: search, $options: 'i' } }
            ];
        }

        // 1. Fetch entire query base for stable facets (only select needed fields for speed)
        const searchBase = await Product.find(query)
            .select('brand gender categories sizes parsedPrice')
            .lean();

        // 2. Compute Facets
        const facets = {
            brands: Array.from(new Set(searchBase.map(p => p.brand).filter(Boolean) as string[])).sort(),
            categories: buildCategoryTree(searchBase),
            genders: Array.from(new Set(searchBase.map(p => p.gender).filter(Boolean) as string[])).sort(),
            sizes: Array.from(new Set(searchBase.flatMap(p => p.sizes || []))).sort(),
            minPrice: searchBase.length ? Math.min(...searchBase.map(p => p.parsedPrice || 0)) : 0,
            maxPrice: searchBase.length ? Math.max(...searchBase.map(p => p.parsedPrice || 0)) : 0,
        };

        // 3. Add detailed filters to query
        if (genders.length > 0) query.gender = { $in: genders };
        if (categories.length > 0) query.categories = { $in: categories };
        if (brands.length > 0) query.brand = { $in: brands };
        if (sizes.length > 0) query.sizes = { $in: sizes };
        
        if (minPrice !== null || maxPrice !== null) {
            query.parsedPrice = {};
            if (minPrice !== null) query.parsedPrice.$gte = minPrice;
            if (maxPrice !== null) query.parsedPrice.$lte = maxPrice;
        }

        const total = await Product.countDocuments(query);
        const start = (page - 1) * limit;
        
        const paginated = await Product.find(query)
            .skip(start)
            .limit(limit)
            .lean();

        // Convert _id to id for backwards compatibility with the UI
        const items = paginated.map(p => {
            const temp = { ...p, id: p._id.toString() } as any;
            delete temp._id;
            delete temp.__v;
            return temp;
        });

        return NextResponse.json({
            items,
            total,
            page,
            limit,
            facets
        });
    } catch (err: any) {
        console.error("Products API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

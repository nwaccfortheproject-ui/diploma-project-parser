export interface Product {
    id?: string;
    url: string;
    title: string | null;
    brand: string | null;
    article: string | null;
    composition: string | null;
    gender: string | null;
    categories: string[];
    breadcrumbs: { text: string; url: string | null }[];
    price: string | null;
    discount_price: string | null;
    sizes: string[];
    images: string[];
    description: Record<string, string>;
}

export interface CategoryNode {
    name: string;
    count: number;
    children: CategoryNode[];
}

export interface ProductsResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    facets: {
        brands: string[];
        categories: CategoryNode[]; // Changed from string[] to Tree
        genders: string[];
        sizes: string[];
        minPrice: number;
        maxPrice: number;
    };
}

export interface FilterState {
    search: string;
    gender: string[];
    categories: string[];
    brands: string[];
    sizes: string[];
    minPrice: number | null;
    maxPrice: number | null;
}

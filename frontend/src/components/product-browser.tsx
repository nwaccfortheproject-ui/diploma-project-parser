'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterState, ProductsResponse } from '@/types';
import { ProductCard } from '@/components/item-card';
import { FilterSidebar } from '@/components/filter-sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

export function ProductBrowser() {
    // State
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProductsResponse | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const ITEMS_PER_PAGE = 16;

    const [filters, setFilters] = useState<FilterState>({
        search: '',
        gender: [],
        categories: [],
        brands: [],
        sizes: [],
        minPrice: null,
        maxPrice: null,
    });

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', ITEMS_PER_PAGE.toString());

        if (debouncedSearch) params.set('search', debouncedSearch);

        filters.gender.forEach(g => params.append('gender', g));
        filters.categories.forEach(c => params.append('category', c));
        filters.brands.forEach(b => params.append('brand', b));
        filters.sizes.forEach(s => params.append('size', s));

        if (filters.minPrice !== null) params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice !== null) params.set('maxPrice', filters.maxPrice.toString());

        try {
            const res = await fetch(`/api/products?${params.toString()}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, filters]);

    useEffect(() => {
        fetchData();
        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchData]);

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        setPage(1); // Reset to page 1 on filter change
    };

    const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

    // Helper to generate pagination items
    const renderPaginationItems = () => {
        const items = [];
        const maxVisible = 5; // Total visible page numbers including first/last

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={page === i}
                            onClick={() => setPage(i)}
                            className="cursor-pointer"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            // Always show first
            items.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        isActive={page === 1}
                        onClick={() => setPage(1)}
                        className="cursor-pointer"
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            // Ellipsis or numbers near start
            if (page > 3) {
                items.push(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
            }

            // Neighbors
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);

            for (let i = start; i <= end; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={page === i}
                            onClick={() => setPage(i)}
                            className="cursor-pointer bg-blue-50"
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            // Ellipsis or numbers near end
            if (page < totalPages - 2) {
                items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
            }

            // Always show last
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink
                        isActive={page === totalPages}
                        onClick={() => setPage(totalPages)}
                        className="cursor-pointer"
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }
        return items;
    };


    return (
        <div className="flex flex-col min-h-screen">
            {/* Header / Search Bar area */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 py-4 mb-6">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Filter className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] overflow-y-auto">
                                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                                {data && (
                                    <FilterSidebar
                                        facets={data.facets}
                                        filters={filters}
                                        onChange={handleFilterChange}
                                    />
                                )}
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 w-full flex-1 flex gap-8">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-10">
                    {data ? (
                        <FilterSidebar
                            facets={data.facets}
                            filters={filters}
                            onChange={handleFilterChange}
                        />
                    ) : (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-[200px] w-full" />
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 pb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold tracking-tight">Products {data && `(${data.total})`}</h1>
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-500" />}
                    </div>

                    {/* Grid */}
                    {loading && !data ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="h-[300px] w-full rounded-lg" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : data && data.items.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.items.map((product, idx) => (
                                <ProductCard key={product.url + idx} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            No products found matching your criteria.
                        </div>
                    )}

                    {/* Pagination */}
                    {data && totalPages > 1 && (
                        <div className="mt-10">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>

                                    {renderPaginationItems()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

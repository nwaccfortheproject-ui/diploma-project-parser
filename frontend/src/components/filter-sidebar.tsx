import { useState, useEffect, useMemo, useCallback } from 'react';
import { FilterState, ProductsResponse, CategoryNode } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight, ChevronDown, X, Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
    facets: ProductsResponse['facets'];
    filters: FilterState;
    onChange: (newFilters: FilterState) => void;
    className?: string;
}

// Helper to get all descendant names recursively
function getAllDescendants(node: CategoryNode): string[] {
    let descendants: string[] = [];
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            descendants.push(child.name);
            descendants = descendants.concat(getAllDescendants(child));
        });
    }
    return descendants;
}

// Helper to filter category tree
function filterCategoryTree(nodes: CategoryNode[], query: string): CategoryNode[] {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes.map(node => {
        // Check if current node matches
        const matches = node.name.toLowerCase().includes(lowerQuery);

        // Check children
        const filteredChildren = filterCategoryTree(node.children || [], query);
        const hasMatchingChildren = filteredChildren.length > 0;

        // Keep node if it matches OR has matching children
        if (matches || hasMatchingChildren) {
            return {
                ...node,
                children: filteredChildren // Use filtered children to trim tree
            };
        }
        return null;
    }).filter(Boolean) as CategoryNode[];
}

// Recursive Category Component
function CategoryTreeItem({ node, selected, onToggle, level = 0, forceOpen = false }: {
    node: CategoryNode,
    selected: string[],
    onToggle: (v: string, descendants: string[]) => void,
    level?: number,
    forceOpen?: boolean
}) {
    const isSelected = selected.includes(node.name);

    // Memoize descendants calculation to avoid unnecessary re-renders
    const descendants = useMemo(() => getAllDescendants(node), [node]);

    const hasSelectedDescendant = useMemo(() => {
        return descendants.some(d => selected.includes(d));
    }, [descendants, selected]);

    const isPartiallyActive = !isSelected && hasSelectedDescendant;

    // Auto open if it has selected descendants so user sees what is selected OR if search is active (forceOpen)
    const [isOpen, setIsOpen] = useState(isSelected || hasSelectedDescendant || forceOpen);

    // Sync isOpen when forceOpen changes or selection changes (if deep linking)
    useEffect(() => {
        if (forceOpen) setIsOpen(true);
        if (hasSelectedDescendant) setIsOpen(true);
    }, [forceOpen, hasSelectedDescendant]);

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 py-1 px-1 rounded transition-colors group",
                    isSelected
                        ? "bg-blue-100 text-blue-800 font-medium"
                        : isPartiallyActive
                            ? "bg-blue-50 text-blue-600" // Highlight for active parent
                            : "hover:bg-gray-100",
                    level > 0 && "ml-3"
                )}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsOpen(!isOpen);
                        }}
                        className="p-1 hover:bg-black/5 rounded text-gray-500 transition-colors"
                    >
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                ) : <span className="w-5" />}

                <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => onToggle(node.name, descendants)}>
                    <Checkbox
                        id={`cat-${node.name}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggle(node.name, descendants)}
                        className={cn("h-4 w-4", isSelected && "border-blue-500 data-[state=checked]:bg-blue-500")}
                    />

                    <Label htmlFor={`cat-${node.name}`} className={cn("text-sm cursor-pointer flex-1 truncate pointer-events-none", isSelected && "text-blue-700")}>
                        {node.name} <span className="text-xs text-gray-400 group-hover:text-gray-500">({node.count})</span>
                    </Label>
                </div>
            </div>

            {hasChildren && isOpen && (
                <div className="border-l border-gray-200 ml-2.5 pl-1">
                    {node.children.map(child => (
                        <CategoryTreeItem
                            key={child.name}
                            node={child}
                            selected={selected}
                            onToggle={onToggle}
                            level={level + 1}
                            forceOpen={forceOpen}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FilterSidebar({ facets, filters, onChange, className }: FilterSidebarProps) {
    const [priceRange, setPriceRange] = useState([0, 1000000]);

    // Local search states
    const [brandQuery, setBrandQuery] = useState('');
    const [categoryQuery, setCategoryQuery] = useState('');

    useEffect(() => {
        const min = filters.minPrice !== null ? filters.minPrice : facets.minPrice;
        const max = filters.maxPrice !== null ? filters.maxPrice : facets.maxPrice;
        if (min !== undefined && max !== undefined) {
            setPriceRange([min, max]);
        }
    }, [facets.minPrice, facets.maxPrice, filters.minPrice, filters.maxPrice]);


    const handlePriceChange = (val: number[]) => {
        setPriceRange(val);
    };

    const handlePriceCommit = (val: number[]) => {
        onChange({ ...filters, minPrice: val[0], maxPrice: val[1] });
    };

    const toggleFilter = (key: keyof FilterState, value: string) => {
        const current = filters[key] as string[];
        const newValues = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        onChange({ ...filters, [key]: newValues });
    };

    // Specialized toggle for Categories
    const toggleCategory = (value: string, descendants: string[]) => {
        const current = filters.categories;
        const isSelected = current.includes(value);
        let newValues: string[];

        if (isSelected) {
            // Uncheck: Remove self AND all descendants
            const toRemove = new Set([value, ...descendants]);
            newValues = current.filter(v => !toRemove.has(v));
        } else {
            // Check: Add self AND all descendants
            const toAdd = new Set([...current, value, ...descendants]);
            newValues = Array.from(toAdd);
        }
        onChange({ ...filters, categories: newValues });
    };

    const resetFilters = () => {
        setBrandQuery('');
        setCategoryQuery('');
        onChange({
            search: filters.search,
            gender: [],
            categories: [],
            brands: [],
            sizes: [],
            minPrice: null,
            maxPrice: null,
        });
    };

    const hasActiveFilters = filters.gender.length > 0 ||
        filters.categories.length > 0 ||
        filters.brands.length > 0 ||
        filters.sizes.length > 0 ||
        filters.minPrice !== null;


    // Helper to sort selected items to top
    const sortWithSelected = (items: string[], selected: string[]) => {
        return [...items].sort((a, b) => {
            const aSel = selected.includes(a);
            const bSel = selected.includes(b);
            if (aSel && !bSel) return -1;
            if (!aSel && bSel) return 1;
            return a.localeCompare(b);
        });
    };

    // Filtered Facets based on local search
    const filteredBrands = useMemo(() =>
        sortWithSelected(
            facets.brands.filter(b => b.toLowerCase().includes(brandQuery.toLowerCase())),
            filters.brands
        ),
        [facets.brands, brandQuery, filters.brands]);

    const filteredCategories = useMemo(() =>
        filterCategoryTree(facets.categories, categoryQuery),
        [facets.categories, categoryQuery]);


    // Helper to get cards, hiding children if parent is selected
    // Note: We use facets.categories (Full Tree) instead of filteredCategories to ensure chips are always stable
    const getVisibleCategoryChips = (nodes: CategoryNode[], selected: string[], seen: Set<string> = new Set()): CategoryNode[] => {
        let chips: CategoryNode[] = [];

        for (const node of nodes) {
            // If this node is selected
            if (selected.includes(node.name)) {
                // Add it if unique
                if (!seen.has(node.name)) {
                    chips.push(node);
                    seen.add(node.name);
                }
                // IMPORTANT: If parent is selected, we assume it covers all children, so we DO NOT recurse.
                // This hides the child chips.
            } else {
                // If not selected, we MUST recurse to check for selected children
                if (node.children && node.children.length > 0) {
                    chips.push(...getVisibleCategoryChips(node.children, selected, seen));
                }
            }
        }
        return chips;
    };

    // Ensure we are working with the full data for chips logic
    const visibleCategoryChips = useMemo(() =>
        getVisibleCategoryChips(facets.categories, filters.categories),
        [facets.categories, filters.categories]);

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                        Reset All
                    </Button>
                )}
            </div>

            <Accordion type="multiple" defaultValue={['gender', 'category', 'price', 'brand']} className="w-full">

                {/* Price */}
                <AccordionItem value="price">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex-1 text-left">Price (₸)</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-muted-foreground">Range</span>
                            {(filters.minPrice !== null || filters.maxPrice !== null) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                                    onClick={() => onChange({ ...filters, minPrice: null, maxPrice: null })}
                                >
                                    Reset
                                </Button>
                            )}
                        </div>
                        <div className="px-2 pt-2 pb-2">
                            <Slider
                                defaultValue={[facets.minPrice, facets.maxPrice]}
                                value={priceRange}
                                min={facets.minPrice}
                                max={facets.maxPrice}
                                step={500}
                                onValueChange={handlePriceChange}
                                onValueCommit={handlePriceCommit}
                                className="mb-4"
                            />
                            <div className="flex items-center justify-between gap-2">
                                <Input
                                    type="number"
                                    value={priceRange[0]}
                                    onChange={(e) => handlePriceCommit([parseInt(e.target.value) || 0, priceRange[1]])}
                                    className="h-8 text-xs"
                                />
                                <span className="text-gray-400">-</span>
                                <Input
                                    type="number"
                                    value={priceRange[1]}
                                    className="h-8 text-xs"
                                    onChange={(e) => handlePriceCommit([priceRange[0], parseInt(e.target.value) || 0])}
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Gender */}
                <AccordionItem value="gender">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex-1 text-left">Gender</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-muted-foreground">Select</span>
                            {filters.gender.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                                    onClick={() => onChange({ ...filters, gender: [] })}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        {filters.gender.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.gender.map(g => (
                                    <Badge key={g} variant="secondary" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {g}
                                        <button
                                            type="button"
                                            className="ml-1 hover:text-red-500 focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFilter('gender', g);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2">
                            {sortWithSelected(facets.genders, filters.gender).map((g) => {
                                const isSelected = filters.gender.includes(g);
                                return (
                                    <div key={g} className={cn("flex items-center space-x-2 rounded p-1", isSelected ? "bg-blue-50" : "")}>
                                        <Checkbox
                                            id={`g-${g}`}
                                            checked={isSelected}
                                            onCheckedChange={() => toggleFilter('gender', g)}
                                        />
                                        <Label htmlFor={`g-${g}`} className={cn(isSelected && "text-blue-700 font-medium")}>{g}</Label>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Categories */}
                <AccordionItem value="category">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex-1 text-left">Category</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-between items-center mb-2 px-1">
                            {/* Search Input for Category */}
                            <div className="relative flex-1 mr-2">
                                <SearchIcon className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                                <Input
                                    placeholder="Search categories..."
                                    value={categoryQuery}
                                    onChange={(e) => setCategoryQuery(e.target.value)}
                                    className="h-7 text-xs pl-7 pr-6"
                                />
                                {categoryQuery && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1.5 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
                                        onClick={() => setCategoryQuery('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {filters.categories.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                                    onClick={() => onChange({ ...filters, categories: [] })}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Chips for Selected Categories */}
                        {visibleCategoryChips.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {visibleCategoryChips.map(node => (
                                    <Badge key={node.name} variant="secondary" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {node.name}
                                        <button
                                            type="button"
                                            className="ml-1 hover:text-red-500 focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // We must simply remove this node and all its descendants. 
                                                // Descendants are derived from the node object itself.
                                                const descendants = getAllDescendants(node);
                                                toggleCategory(node.name, descendants);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <ScrollArea className="h-72 pr-2">
                            <div className="space-y-1">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((node) => (
                                        <CategoryTreeItem
                                            key={node.name}
                                            node={node}
                                            selected={filters.categories}
                                            onToggle={toggleCategory}
                                            forceOpen={categoryQuery.length > 0} // Open tree when searching
                                        />
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-500 text-center py-4">No categories found</div>
                                )}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                {/* Brand */}
                <AccordionItem value="brand">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex-1 text-left">Brand</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <div className="relative flex-1 mr-2">
                                <SearchIcon className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
                                <Input
                                    placeholder="Search brands..."
                                    value={brandQuery}
                                    onChange={(e) => setBrandQuery(e.target.value)}
                                    className="h-7 text-xs pl-7 pr-6"
                                />
                                {brandQuery && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1.5 text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none"
                                        onClick={() => setBrandQuery('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            {(filters.brands.length > 0) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                                    onClick={() => onChange({ ...filters, brands: [] })}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        {filters.brands.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.brands.map(b => (
                                    <Badge key={b} variant="secondary" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {b}
                                        <button
                                            type="button"
                                            className="ml-1 hover:text-red-500 focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFilter('brands', b);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-2">
                                {filteredBrands.length > 0 ? (
                                    filteredBrands.map((b) => {
                                        const isSelected = filters.brands.includes(b);
                                        return (
                                            <div key={b} className={cn("flex items-center space-x-2 p-1 rounded", isSelected ? "bg-blue-50" : "")}>
                                                <Checkbox
                                                    id={`b-${b}`}
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleFilter('brands', b)}
                                                />
                                                <Label htmlFor={`b-${b}`} className={cn("text-sm cursor-pointer", isSelected && "text-blue-700 font-medium")}>{b}</Label>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-xs text-gray-500 text-center py-4">No brands found</div>
                                )}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                {/* Sizes */}
                <AccordionItem value="size">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex-1 text-left">Size</span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-muted-foreground">Select</span>
                            {filters.sizes.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-2 text-[10px] text-muted-foreground hover:text-red-500"
                                    onClick={() => onChange({ ...filters, sizes: [] })}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                        {filters.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.sizes.map(s => (
                                    <Badge key={s} variant="secondary" className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {s}
                                        <button
                                            type="button"
                                            className="ml-1 hover:text-red-500 focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFilter('sizes', s);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="grid grid-cols-3 gap-2">
                                {sortWithSelected(facets.sizes, filters.sizes).map((s) => {
                                    const isSelected = filters.sizes.includes(s);
                                    return (
                                        <div key={s} className={cn("flex items-center space-x-1 p-1 rounded border border-transparent", isSelected ? "bg-blue-50 border-blue-200" : "")}>
                                            <Checkbox
                                                id={`s-${s}`}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleFilter('sizes', s)}
                                            />
                                            <Label htmlFor={`s-${s}`} className={cn("text-xs cursor-pointer truncate", isSelected && "text-blue-700 font-medium")} title={s}>{s}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}

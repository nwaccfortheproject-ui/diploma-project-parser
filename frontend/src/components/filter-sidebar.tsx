import { useState, useEffect, useMemo } from 'react';
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
import { ChevronRight, ChevronDown, X } from 'lucide-react';
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

// Recursive Category Component
function CategoryTreeItem({ node, selected, onToggle, level = 0 }: {
    node: CategoryNode,
    selected: string[],
    onToggle: (v: string, descendants: string[]) => void,
    level?: number
}) {
    const isSelected = selected.includes(node.name);
    // Auto-open if selected or if a descendant is selected (active parent)
    const descendants = useMemo(() => getAllDescendants(node), [node]);
    const hasSelectedDescendant = descendants.some(d => selected.includes(d));
    const isPartiallyActive = !isSelected && hasSelectedDescendant;

    // Auto open if it has selected descendants so user sees what is selected
    const [isOpen, setIsOpen] = useState(isSelected || hasSelectedDescendant);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 py-1 px-1 rounded transition-colors group",
                    isSelected
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : isPartiallyActive
                            ? "bg-blue-50/50" // Lighter highlight for active parent
                            : "hover:bg-gray-50",
                    level > 0 && "ml-3"
                )}
            >
                {hasChildren ? (
                    <button onClick={() => setIsOpen(!isOpen)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400">
                        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                ) : <span className="w-4" />}

                <Checkbox
                    id={`cat-${node.name}`}
                    checked={isSelected}
                    onCheckedChange={() => onToggle(node.name, descendants)}
                    className={cn("h-4 w-4", isSelected && "border-blue-500 data-[state=checked]:bg-blue-500")}
                />

                <Label htmlFor={`cat-${node.name}`} className={cn("text-sm cursor-pointer flex-1 truncate", isSelected && "text-blue-700")}>
                    {node.name} <span className="text-xs text-gray-400 group-hover:text-gray-500">({node.count})</span>
                </Label>
            </div>

            {hasChildren && isOpen && (
                <div className="border-l border-gray-100 ml-2">
                    {node.children.map(child => (
                        <CategoryTreeItem
                            key={child.name}
                            node={child}
                            selected={selected}
                            onToggle={onToggle}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FilterSidebar({ facets, filters, onChange, className }: FilterSidebarProps) {
    const [priceRange, setPriceRange] = useState([0, 1000000]);

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
            // We use Set to avoid duplicates
            const toAdd = new Set([...current, value, ...descendants]);
            newValues = Array.from(toAdd);
        }
        onChange({ ...filters, categories: newValues });
    };

    const resetFilters = () => {
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

    // Helper to get chips, hiding children if parent is selected
    // Changed to return CategoryNode[] to have direct access to descendants in the UI loop
    const getVisibleCategoryChips = (nodes: CategoryNode[], selected: string[]): CategoryNode[] => {
        let chips: CategoryNode[] = [];
        for (const node of nodes) {
            if (selected.includes(node.name)) {
                // If parent is selected, add ONLY parent, and do NOT recurse (hide children chips)
                chips.push(node);
            } else {
                // If parent NOT selected, recurse children
                if (node.children && node.children.length > 0) {
                    chips.push(...getVisibleCategoryChips(node.children, selected));
                }
            }
        }
        return chips;
    };

    const visibleCategoryChips = getVisibleCategoryChips(facets.categories, filters.categories);

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                        Reset
                    </Button>
                )}
            </div>

            <Accordion type="multiple" defaultValue={['gender', 'category', 'price', 'brand']} className="w-full">

                {/* Price */}
                <AccordionItem value="price">
                    <AccordionTrigger>Price (₸)</AccordionTrigger>
                    <AccordionContent>
                        <div className="px-2 pt-4 pb-2">
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
                    <AccordionTrigger>Gender</AccordionTrigger>
                    <AccordionContent>
                        {/* Mini Cards (Chips) for selected */}
                        {filters.gender.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.gender.map(g => (
                                    <Badge key={g} variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {g} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFilter('gender', g); }} />
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
                    <AccordionTrigger>Category</AccordionTrigger>
                    <AccordionContent>
                        {visibleCategoryChips.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {visibleCategoryChips.map(node => (
                                    <Badge key={node.name} variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {node.name} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e) => {
                                            e.stopPropagation();
                                            // Direct access to node and descendants! Robust!
                                            const descendants = getAllDescendants(node);
                                            toggleCategory(node.name, descendants);
                                        }} />
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <ScrollArea className="h-72 pr-2">
                            <div className="space-y-1">
                                {facets.categories.map((node) => (
                                    <CategoryTreeItem
                                        key={node.name}
                                        node={node}
                                        selected={filters.categories}
                                        onToggle={toggleCategory}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                {/* Brand */}
                <AccordionItem value="brand">
                    <AccordionTrigger>Brand</AccordionTrigger>
                    <AccordionContent>
                        {filters.brands.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.brands.map(b => (
                                    <Badge key={b} variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {b} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFilter('brands', b); }} />
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="mb-2">
                            <Input placeholder="Search brands..." className="h-7 text-xs" />
                        </div>
                        <ScrollArea className="h-[200px] pr-4">
                            <div className="space-y-2">
                                {sortWithSelected(facets.brands, filters.brands).map((b) => {
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
                                })}
                            </div>
                        </ScrollArea>
                    </AccordionContent>
                </AccordionItem>

                {/* Sizes */}
                <AccordionItem value="size">
                    <AccordionTrigger>Size</AccordionTrigger>
                    <AccordionContent>
                        {filters.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {filters.sizes.map(s => (
                                    <Badge key={s} variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        {s} <X className="ml-1 h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFilter('sizes', s); }} />
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

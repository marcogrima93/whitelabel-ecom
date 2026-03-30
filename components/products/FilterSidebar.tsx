"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ProductFilter } from "@/lib/supabase/types";

interface Category { id: string; name: string; slug: string; }

interface FilterSidebarProps {
  currentCategory?: string;
  /** Map of field → selected values (parsed from URL params by the page) */
  activeFilters: Record<string, string[]>;
  currentSort?: string;
  currentSearch?: string;
  categories: Category[];
  productFilters: ProductFilter[];
}

// ── shared hook for URL manipulation ──────────────────────────────────────────
function useFilterActions(onNavigate?: () => void) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
    onNavigate?.();
  };

  const toggleDynamicFilter = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const key = `flt_${field}`;
    const existing = (params.get(key) ?? "").split(",").filter(Boolean);
    const next = existing.includes(value)
      ? existing.filter((v) => v !== value)
      : [...existing, value];
    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
    onNavigate?.();
  };

  const clearFilters = () => {
    router.push("/products");
    onNavigate?.();
  };

  return { setParam, toggleDynamicFilter, clearFilters };
}

// ── Shared filter content ──────────────────────────────────────────────────────
function FilterContent({
  currentCategory,
  activeFilters,
  currentSort,
  currentSearch,
  categories,
  productFilters,
  onNavigate,
}: FilterSidebarProps & { onNavigate?: () => void }) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { setParam, toggleDynamicFilter, clearFilters } = useFilterActions(onNavigate);

  const hasActiveFilters =
    currentCategory ||
    currentSearch ||
    Object.values(activeFilters).some((v) => v.length > 0);

  const activeFilterCount = Object.values(activeFilters).reduce(
    (sum, vals) => sum + vals.length,
    0
  );

  return (
    <div className="space-y-1">
      {/* Search */}
      <div className="pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = formData.get("q") as string;
            setParam("q", q || null);
          }}
        >
          <Input
            ref={searchInputRef}
            name="q"
            placeholder="Search products..."
            defaultValue={currentSearch || ""}
            aria-label="Search products"
            autoFocus={false}
          />
        </form>
      </div>

      {/* Sort */}
      <div className="pb-4">
        <Label className="text-sm font-semibold mb-2 block">Sort By</Label>
        <Select
          value={currentSort || "featured"}
          onValueChange={(v) => setParam("sort", v === "featured" ? null : v)}
        >
          <SelectTrigger aria-label="Sort by">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Accordion
        type="multiple"
        defaultValue={[
          "category",
          ...productFilters.map((f) => f.id),
        ]}
        className="w-full"
      >
        {/* Category */}
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-semibold">Category</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <button
                  onClick={() => setParam("category", null)}
                  className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                    !currentCategory ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setParam("category", cat.slug)}
                    className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      currentCategory === cat.slug
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Dynamic filter groups */}
        {productFilters.map((group) => {
          if (group.options.length === 0) return null;
          const selected = activeFilters[group.field] ?? [];
          return (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger className="text-sm font-semibold">
                <span className="flex items-center gap-2">
                  {group.label}
                  {selected.length > 0 && (
                    <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {selected.length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2.5">
                  {group.options.map((opt) => {
                    const checked = selected.includes(opt);
                    const id = `filter-${group.field}-${opt}`;
                    return (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={() => toggleDynamicFilter(group.field, opt)}
                        />
                        <Label
                          htmlFor={id}
                          className="text-sm font-normal cursor-pointer leading-none"
                        >
                          {opt}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({activeFilterCount})
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────
export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-20 space-y-4">
        <h2 className="font-bold text-lg">Filters</h2>
        <FilterContent {...props} />
      </div>
    </aside>
  );
}

// ── Mobile sheet ──────────────────────────────────────────────────────────────
export function MobileFilterSheet(props: FilterSidebarProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    props.currentCategory ||
    props.currentSearch ||
    Object.values(props.activeFilters).some((v) => v.length > 0);

  const activeFilterCount = Object.values(props.activeFilters).reduce(
    (sum, vals) => sum + vals.length,
    0
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount > 0 ? activeFilterCount : "!"}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-80 flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterContent {...props} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

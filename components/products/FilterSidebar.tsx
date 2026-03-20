"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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

interface Category { id: string; name: string; slug: string; }
interface ProductFilter { id: string; label: string; options: string[]; }

interface FilterSidebarProps {
  currentCategory?: string;
  currentFilter?: string;
  currentSort?: string;
  currentSearch?: string;
  categories: Category[];
  productFilters: ProductFilter[];
}

export function FilterSidebar({
  currentCategory,
  currentFilter,
  currentSort,
  currentSearch,
  categories,
  productFilters,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => router.push("/products");

  const hasActiveFilters = currentCategory || currentFilter || currentSearch;

  const filterContent = (
    <div className="space-y-1">
      {/* Search */}
      <div className="pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const q = formData.get("q") as string;
            updateFilter("q", q || null);
          }}
        >
          <Input
            name="q"
            placeholder="Search products..."
            defaultValue={currentSearch || ""}
            aria-label="Search products"
          />
        </form>
      </div>

      {/* Sort */}
      <div className="pb-4">
        <Label className="text-sm font-semibold mb-2 block">Sort By</Label>
        <Select
          value={currentSort || "featured"}
          onValueChange={(v) => updateFilter("sort", v === "featured" ? null : v)}
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
        defaultValue={["category", ...productFilters.map((f) => f.id)]}
        className="w-full"
      >
        {/* Category filter */}
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-semibold">Category</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter("category", null)}
                  className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                    !currentCategory ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => updateFilter("category", cat.slug)}
                    className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      currentCategory === cat.slug ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Dynamic filter groups from DB */}
        {productFilters.map((group) => {
          if (group.options.length === 0) return null;
          return (
            <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger className="text-sm font-semibold">{group.label}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter("filter", null)}
                    className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      !currentFilter ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    All {group.label}s
                  </button>
                  {group.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateFilter("filter", opt)}
                      className={`block text-sm w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                        currentFilter === opt ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="w-full mt-4" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 space-y-4">
          <h2 className="font-bold text-lg">Filters</h2>
          {filterContent}
        </div>
      </aside>

      {/* Mobile filter sheet */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">!</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

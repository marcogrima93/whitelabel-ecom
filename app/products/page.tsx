import { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { getProducts } from "@/lib/supabase/products";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import { FilterSidebar, MobileFilterSheet } from "@/components/products/FilterSidebar";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse all products at ${siteConfig.shopName}. Find the perfect items for your needs.`,
};

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const supabase = await createServiceRoleClient();

  // Parse dynamic filter params: ?flt_<field>=val1,val2
  const activeFilters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (key.startsWith("flt_") && raw) {
      const field = key.slice(4); // strip "flt_"
      const values = String(raw).split(",").map((v) => v.trim()).filter(Boolean);
      if (values.length > 0) activeFilters[field] = values;
    }
  }

  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;

  const [products, { data: categories }, { data: productFilters }] = await Promise.all([
    getProducts({
      category,
      dynamicFilters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
      sort: (sort as "featured" | "price_asc" | "price_desc" | "newest") || undefined,
      search,
    }),
    supabase.from("categories").select("*"),
    supabase.from("product_filters").select("*").order("sort_order", { ascending: true }),
  ]);

  const resolvedCategories = categories ?? [];
  const resolvedFilters = productFilters ?? [];

  const categoryName = category
    ? resolvedCategories.find((c) => c.slug === category)?.name
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <nav className="text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li><a href="/" className="hover:text-foreground transition-colors">Home</a></li>
            <li>/</li>
            <li className="text-foreground font-medium">
              {categoryName || "All Products"}
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold">
          {categoryName || "All Products"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {products.length} product{products.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Mobile: filter button row */}
      <div className="lg:hidden mb-4 flex items-center gap-3">
        <MobileFilterSheet
          currentCategory={category}
          activeFilters={activeFilters}
          currentSort={sort}
          currentSearch={search}
          categories={resolvedCategories}
          productFilters={resolvedFilters}
        />
        <p className="text-sm text-muted-foreground ml-auto">
          {products.length} item{products.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filter Sidebar */}
        <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
          <div className="hidden lg:block">
            <FilterSidebar
              currentCategory={category}
              activeFilters={activeFilters}
              currentSort={sort}
              currentSearch={search}
              categories={resolvedCategories}
              productFilters={resolvedFilters}
            />
          </div>
        </Suspense>

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryName={resolvedCategories.find((c) => c.slug === product.category)?.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

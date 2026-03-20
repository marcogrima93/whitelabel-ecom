import { Suspense } from "react";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { getProducts } from "@/lib/supabase/products";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/products/ProductCard";
import { FilterSidebar } from "@/components/products/FilterSidebar";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse all products at ${siteConfig.shopName}. Find the perfect items for your needs.`,
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    filter?: string;
    sort?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const supabase = await createServiceRoleClient();

  const [products, { data: categories }, { data: filterGroups }, { data: filterOptions }] =
    await Promise.all([
      getProducts({
        category: params.category,
        filterField: params.filter,
        sort: (params.sort as "featured" | "price_asc" | "price_desc" | "newest") || undefined,
        search: params.q,
      }),
      supabase.from("categories").select("*").order("position"),
      supabase.from("product_filter_groups").select("*").order("position"),
      supabase.from("product_filter_options").select("*").order("position"),
    ]);

  const resolvedCategories = categories ?? [];

  const categoryName = params.category
    ? resolvedCategories.find((c) => c.slug === params.category)?.name
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

      <div className="flex gap-8">
        {/* Filter Sidebar */}
        <Suspense fallback={<div className="hidden lg:block w-64 shrink-0" />}>
          <FilterSidebar
            currentCategory={params.category}
            currentFilter={params.filter}
            currentSort={params.sort}
            currentSearch={params.q}
            categories={resolvedCategories}
            filterGroups={filterGroups ?? []}
            filterOptions={filterOptions ?? []}
          />
        </Suspense>

        {/* Product Grid */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

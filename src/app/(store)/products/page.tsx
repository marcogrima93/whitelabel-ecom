import { Suspense } from "react";
import { ProductGrid } from "@/modules/ecom/components/ProductGrid";
import { getProducts, getCategories } from "@/modules/ecom/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { siteConfig } from "../../../../site.config";

export const metadata: Metadata = {
  title: "Products",
  description: `Browse all products at ${siteConfig.shopName}`,
};

interface ProductsPageProps {
  searchParams: { category?: string; search?: string; sort?: string; page?: string; min?: string; max?: string };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [{ products, total }, categories] = await Promise.all([
    getProducts({
      category: searchParams.category,
      search: searchParams.search,
      sort: (searchParams.sort as any) || "featured",
      page: Number(searchParams.page) || 1,
      minPrice: searchParams.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams.max ? Number(searchParams.max) : undefined,
    }),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / 12);
  const currentPage = Number(searchParams.page) || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="font-bold text-lg mb-4">Filters</h2>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Category</h3>
            <div className="flex flex-col gap-1">
              <a href="/products" className={`text-sm ${!searchParams.category ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                All Products
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className={`text-sm ${searchParams.category === cat.id ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="mb-6">
            <h3 className="font-medium text-sm mb-2">Sort By</h3>
            <div className="flex flex-col gap-1">
              {[
                { value: "featured", label: "Featured" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
                { value: "newest", label: "Newest" },
              ].map((opt) => (
                <a
                  key={opt.value}
                  href={`/products?${new URLSearchParams({ ...searchParams, sort: opt.value }).toString()}`}
                  className={`text-sm ${(searchParams.sort || "featured") === opt.value ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">{total} products</p>
          </div>
          <ProductGrid products={products} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <a
                  key={page}
                  href={`/products?${new URLSearchParams({ ...searchParams, page: page.toString() }).toString()}`}
                  className={`px-3 py-1 rounded text-sm ${page === currentPage ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted-foreground/10"}`}
                >
                  {page}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

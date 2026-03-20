// ============================================================================
// Product Data Access Layer
// ============================================================================
// Abstracts Supabase queries. Falls back to mock data if Supabase is not configured.
// ============================================================================

import type { Product } from "./types";
import { mockProducts } from "./mock-data";

const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export interface ProductFilters {
  category?: string;
  filterField?: string;
  search?: string;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price_asc" | "price_desc" | "newest";
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return applyFiltersToMock(mockProducts, filters);
  }

  const { createServiceRoleClient } = await import("./server");
  const supabase = await createServiceRoleClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_archived", false);

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.filterField) {
    query = query.eq("filter_field", filters.filterField);
  }

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters?.inStockOnly) {
    query = query.neq("stock_status", "OUT_OF_STOCK");
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte("retail_price", filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte("retail_price", filters.maxPrice);
  }

  switch (filters?.sort) {
    case "price_asc":
      query = query.order("retail_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("retail_price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error?.message || JSON.stringify(error, null, 2));
    return applyFiltersToMock(mockProducts, filters);
  }

  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return mockProducts.find((p) => p.slug === slug) || null;
  }

  const { createServiceRoleClient } = await import("./server");
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return mockProducts.find((p) => p.slug === slug) || null;
  }

  return data as Product;
}

export async function getRelatedProducts(
  category: string,
  excludeSlug: string,
  limit = 4
): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return mockProducts
      .filter((p) => p.category === category && p.slug !== excludeSlug)
      .slice(0, limit);
  }

  const { createServiceRoleClient } = await import("./server");
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_archived", false)
    .neq("slug", excludeSlug)
    .limit(limit);

  if (error) {
    return mockProducts
      .filter((p) => p.category === category && p.slug !== excludeSlug)
      .slice(0, limit);
  }

  return data as Product[];
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter((p) => p.stock_status === "IN_STOCK").slice(0, limit);
  }

  const { createServiceRoleClient } = await import("./server");
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_archived", false)
    .eq("stock_status", "IN_STOCK")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return mockProducts.filter((p) => p.stock_status === "IN_STOCK").slice(0, limit);
  }

  return data as Product[];
}

// ── Helper: apply filters to mock data ──────────────────────────────────
function applyFiltersToMock(products: Product[], filters?: ProductFilters): Product[] {
  let result = [...products];

  if (filters?.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters?.filterField) {
    result = result.filter((p) => p.filter_field === filters.filterField);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (filters?.inStockOnly) {
    result = result.filter((p) => p.stock_status !== "OUT_OF_STOCK");
  }

  if (filters?.minPrice !== undefined) {
    result = result.filter((p) => p.retail_price >= filters.minPrice!);
  }

  if (filters?.maxPrice !== undefined) {
    result = result.filter((p) => p.retail_price <= filters.maxPrice!);
  }

  switch (filters?.sort) {
    case "price_asc":
      result.sort((a, b) => a.retail_price - b.retail_price);
      break;
    case "price_desc":
      result.sort((a, b) => b.retail_price - a.retail_price);
      break;
    case "newest":
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }

  return result;
}

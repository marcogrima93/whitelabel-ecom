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
  /** Dynamic filters from product_filters table: { fieldName: ["val1","val2"] }
   *  AND logic across fields, OR logic within each field's values. */
  dynamicFilters?: Record<string, string[]>;
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

  if (filters?.dynamicFilters) {
    for (const [field, values] of Object.entries(filters.dynamicFilters)) {
      if (values.length > 0) {
        // filter_field stores a JSON object e.g. {"cut":"ribeye","grade":"A5"}
        // Use Postgres containment: filter_field_json @> '{"field":"value"}'
        // We OR across values within the same field, AND across fields.
        // Since we can't do OR containment in a single .filter(), we use
        // the cs (contains) operator on the jsonb-cast column via raw filter.
        // For simplicity with TEXT column: use ilike matching on the serialised JSON.
        const orConditions = values
          .map((v) => `filter_field.ilike.%"${field}":"${v}"%`)
          .join(",");
        query = query.or(orConditions);
      }
    }
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

  return (data as Product[]).map(normaliseImages);
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

  return normaliseImages(data as Product);
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

  return (data as Product[]).map(normaliseImages);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return mockProducts.filter((p) => p.stock_status === "IN_STOCK").slice(0, limit);
  }

  const { createServiceRoleClient } = await import("./server");
  const supabase = await createServiceRoleClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_archived", false)
    .eq("is_featured", true)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return mockProducts.filter((p) => p.stock_status === "IN_STOCK").slice(0, limit);
  }

  const featured = (data as Product[]).map(normaliseImages).filter((p) => p.stock_status !== "OUT_OF_STOCK");
  if (featured.length <= limit) return featured;
  // Randomly sample if more than limit
  return [...featured].sort(() => Math.random() - 0.5).slice(0, limit);
}

// ── Helper: normalise images column ──────────────────────────────────────
// Supabase may return TEXT[] as a plain string, a JSON string, or a proper array.
// This ensures product.images is always a clean string[].
function normaliseImages(product: Product): Product {
  let imgs = product.images as unknown;
  if (!imgs) return { ...product, images: [] };
  if (typeof imgs === "string") {
    try { imgs = JSON.parse(imgs); } catch { imgs = [imgs]; }
  }
  if (!Array.isArray(imgs)) imgs = [String(imgs)];
  return {
    ...product,
    images: (imgs as unknown[])
      .map((u) => String(u).trim())
      .filter((u) => u.startsWith("http") || u.startsWith("/")),
  };
}

// ── Helper: apply filters to mock data ───────────────────────────────────
function applyFiltersToMock(products: Product[], filters?: ProductFilters): Product[] {
  let result = [...products];

  if (filters?.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters?.dynamicFilters) {
    for (const [field, values] of Object.entries(filters.dynamicFilters)) {
      if (values.length > 0) {
        result = result.filter((p) => {
          try {
            const parsed = JSON.parse(p.filter_field || "{}") as Record<string, string>;
            return values.includes(parsed[field]);
          } catch {
            return false;
          }
        });
      }
    }
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

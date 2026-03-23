import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductFilters } from "../types";
import type { ProductWithImages, ProductWithDetails, Category, OrderWithItems } from "@/types/database";

// ─── Products ───────────────────────────────────────────────

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = createServerSupabaseClient();
  const { category, minPrice, maxPrice, inStock, search, sort = "featured", page = 1, limit = 12 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)", { count: "exact" })
    .eq("is_active", true)
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category_id", category);
  if (minPrice !== undefined) query = query.gte("price", minPrice);
  if (maxPrice !== undefined) query = query.lte("price", maxPrice);
  if (inStock) query = query.gt("inventory_count", 0);
  if (search) query = query.ilike("name", `%${search}%`);

  switch (sort) {
    case "price-asc": query = query.order("price", { ascending: true }); break;
    case "price-desc": query = query.order("price", { ascending: false }); break;
    case "newest": query = query.order("created_at", { ascending: false }); break;
    case "featured":
    default: query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: (data as unknown as ProductWithImages[]) || [], total: count || 0 };
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), category:categories(*), reviews(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as unknown as ProductWithDetails;
}

export async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(8);

  if (error) throw error;
  return (data as unknown as ProductWithImages[]) || [];
}

// ─── Categories ─────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

// ─── Orders ─────────────────────────────────────────────────

export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as OrderWithItems[]) || [];
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data as unknown as OrderWithItems;
}

// ─── Admin Queries ──────────────────────────────────────────

export async function getAllOrders() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as OrderWithItems[]) || [];
}

export async function getAllProducts() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as ProductWithImages[]) || [];
}

export async function getAllCustomers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAdminStats() {
  const supabase = createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const [ordersToday, pendingOrders, allOrders, customers] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const monthlyRevenue = (allOrders.data || []).reduce((sum, o) => sum + Number(o.total), 0);

  return {
    ordersToday: ordersToday.count || 0,
    pendingOrders: pendingOrders.count || 0,
    monthlyRevenue,
    totalCustomers: customers.count || 0,
  };
}

// ─── Pages (CMS) ────────────────────────────────────────────

export async function getPageBySlug(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return data;
}

// ─── Discount Codes ─────────────────────────────────────────

export async function validateDiscountCode(code: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  if (data.max_uses && data.used_count >= data.max_uses) return null;
  if (data.starts_at && new Date(data.starts_at) > new Date()) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return data;
}

// ============================================================================
// Supabase Data Access Layer
// ============================================================================
// Server-side database queries for orders, customers, addresses, and quotes.
// These functions use the service role client for admin operations.
// ============================================================================

import { createServerSupabaseClient, createServiceRoleClient } from "./server";
import type { Order, OrderItem, Profile, Address, QuoteRequest, OrderStatus, DiscountCode } from "./types";

// ── Orders ──────────────────────────────────────────────────────────────

export async function getOrders(options?: {
  status?: OrderStatus;
  limit?: number;
}): Promise<(Order & { items?: OrderItem[] })[]> {
  const supabase = await createServiceRoleClient();
  
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (options?.status) {
    query = query.eq("status", options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
  
  return data || [];
}

export async function getOrderById(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const supabase = await createServiceRoleClient();
  
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  
  if (orderError || !order) {
    console.error("Error fetching order:", orderError);
    return null;
  }
  
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  
  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
  }
  
  return { ...order, items: items || [] };
}

export async function getUserOrders(userId: string): Promise<(Order & { items?: OrderItem[] })[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
  
  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    (data || []).map(async (order) => {
      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      return { ...order, items: items || [] };
    })
  );
  
  return ordersWithItems;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  
  if (error) {
    console.error("Error updating order status:", error);
    return false;
  }
  
  return true;
}

export async function updateOrderNotes(orderId: string, notes: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  
  const { error } = await supabase
    .from("orders")
    .update({ notes })
    .eq("id", orderId);
  
  if (error) {
    console.error("Error updating order notes:", error);
    return false;
  }
  
  return true;
}

export async function createOrder(orderData: {
  orderNumber: string;
  userId?: string;
  email: string;
  deliveryMethod: "DELIVERY" | "COLLECTION";
  deliveryAddress?: Record<string, string>;
  deliveryFee: number;
  deliverySlot?: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  discountCode?: string;
  discountAmount?: number;
  notes?: string;
  stripePaymentIntentId?: string;
  items: {
    productId: string;
    productName: string;
    productImage: string;
    selectedOption: string;
    pricePerUnit: number;
    quantity: number;
  }[];
}): Promise<Order | null> {
  const supabase = await createServiceRoleClient();
  
  // Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderData.orderNumber,
      user_id: orderData.userId || null,
      email: orderData.email,
      status: "PENDING",
      delivery_method: orderData.deliveryMethod,
      delivery_address: orderData.deliveryAddress || null,
      delivery_fee: orderData.deliveryFee,
      delivery_slot: orderData.deliverySlot || null,
      subtotal: orderData.subtotal,
      vat_amount: orderData.vatAmount,
      total: orderData.total,
      discount_code: orderData.discountCode || null,
      discount_amount: orderData.discountAmount || 0,
      notes: orderData.notes || null,
      stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
    })
    .select()
    .single();
  
  if (orderError || !order) {
    console.error("Error creating order:", orderError);
    return null;
  }
  
  // Create order items
  const orderItems = orderData.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    product_image: item.productImage,
    selected_option: item.selectedOption,
    price_per_unit: item.pricePerUnit,
    quantity: item.quantity,
    line_total: item.pricePerUnit * item.quantity,
  }));
  
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);
  
  if (itemsError) {
    console.error("Error creating order items:", itemsError);
  }
  
  return order;
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | null> {
  const supabase = await createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();
  
  if (error) {
    console.error("Error fetching order by payment intent:", error);
    return null;
  }
  
  return data;
}

// ── Customers / Profiles ────────────────────────────────────────────────

export async function getCustomers(options?: {
  role?: "RETAIL" | "WHOLESALE" | "ADMIN";
}): Promise<(Profile & { orderCount?: number })[]> {
  const supabase = await createServiceRoleClient();
  
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (options?.role) {
    query = query.eq("role", options.role);
  }
  
  const { data: profiles, error } = await query;
  
  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
  
  // Fetch order counts for each customer
  const customersWithCounts = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);
      return { ...profile, orderCount: count || 0 };
    })
  );
  
  return customersWithCounts;
}

export async function getCustomerById(userId: string): Promise<Profile | null> {
  const supabase = await createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  
  if (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
  
  return data;
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (error) {
    console.error("Error fetching current user profile:", error);
    return null;
  }
  
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  
  if (error) {
    console.error("Error updating profile:", error);
    return false;
  }
  
  return true;
}

export async function approveWholesaleCustomer(userId: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ wholesale_approved: true })
    .eq("id", userId);
  
  if (error) {
    console.error("Error approving wholesale customer:", error);
    return false;
  }
  
  return true;
}

export async function rejectWholesaleCustomer(userId: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  
  // Reject by setting role back to RETAIL
  const { error } = await supabase
    .from("profiles")
    .update({ role: "RETAIL", wholesale_approved: false })
    .eq("id", userId);
  
  if (error) {
    console.error("Error rejecting wholesale customer:", error);
    return false;
  }
  
  return true;
}

// ── Addresses ───────────────────────────────────────────────────────────

export async function getUserAddresses(userId: string): Promise<Address[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  
  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }
  
  return data || [];
}

export async function createAddress(address: Omit<Address, "id" | "created_at">): Promise<Address | null> {
  const supabase = await createServerSupabaseClient();
  
  // If setting as default, unset other defaults first
  if (address.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", address.user_id);
  }
  
  const { data, error } = await supabase
    .from("addresses")
    .insert(address)
    .select()
    .single();
  
  if (error) {
    console.error("Error creating address:", error);
    return null;
  }
  
  return data;
}

export async function updateAddress(addressId: string, userId: string, updates: Partial<Address>): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  
  // If setting as default, unset other defaults first
  if (updates.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }
  
  const { error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", addressId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error updating address:", error);
    return false;
  }
  
  return true;
}

export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting address:", error);
    return false;
  }
  
  return true;
}

// ── Quote Requests ──────────────────────────────────────────────────────

export async function createQuoteRequest(quote: Omit<QuoteRequest, "id" | "created_at">): Promise<QuoteRequest | null> {
  const supabase = await createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("quote_requests")
    .insert(quote)
    .select()
    .single();
  
  if (error) {
    console.error("Error creating quote request:", error);
    return null;
  }
  
  return data;
}

export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  const supabase = await createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching quote requests:", error);
    return [];
  }
  
  return data || [];
}

// ── Categories ──────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  featured: boolean;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) { console.error("Error fetching categories:", error); return []; }
  return data || [];
}

// Returns up to 4 featured categories, randomly sampled if more than 4 are marked featured
export async function getFeaturedCategories(): Promise<Category[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("featured", true)
    .order("name", { ascending: true });
  if (error) { console.error("Error fetching featured categories:", error); return []; }
  const all = data || [];
  if (all.length <= 4) return all;
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

// ── Discount Codes ─────────────────────────────────────────────────────

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("Error fetching discount codes:", error); return []; }
  return data || [];
}

export async function validateDiscountCode(code: string): Promise<DiscountCode | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .ilike("code", code.trim())
    .eq("active", true)
    .single();
  if (error || !data) return null;
  return data;
}

export async function createDiscountCode(payload: { code: string; percentage: number; active: boolean }): Promise<DiscountCode | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({ code: payload.code.toUpperCase().trim(), percentage: payload.percentage, active: payload.active })
    .select()
    .single();
  if (error) { console.error("Error creating discount code:", error); return null; }
  return data;
}

export async function updateDiscountCode(id: string, updates: { active?: boolean; percentage?: number }): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("discount_codes").update(updates).eq("id", id);
  if (error) { console.error("Error updating discount code:", error); return false; }
  return true;
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("discount_codes").delete().eq("id", id);
  if (error) { console.error("Error deleting discount code:", error); return false; }
  return true;
}

// ── Stock Management ────────────────────────────────────────────────────

/**
 * Atomically decrement stock for all LIMITED-mode products in the given items.
 *
 * Routing logic:
 *  - If the item has a selectedOption AND that option has a non-null stock_quantity
 *    in option_configs → call `decrement_stock_option` (per-option stock).
 *  - Otherwise → call `decrement_stock` (product-level stock).
 *
 * Returns { success: true } if all decrements succeeded, or
 * { success: false, outOfStockProductName } for the first product that failed.
 */
export async function decrementStockForOrder(
  items: { productId: string; productName: string; selectedOption: string; quantity: number }[]
): Promise<{ success: boolean; outOfStockProductName?: string }> {
  const supabase = await createServiceRoleClient();

  // Fetch stock data for each distinct product in one query
  const productIds = [...new Set(items.map((i) => i.productId))];
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("id, name, stock_mode, stock_quantity, option_configs")
    .in("id", productIds);

  if (fetchError || !products) {
    console.error("decrementStockForOrder: failed to fetch products", fetchError);
    return { success: false, outOfStockProductName: "Unknown product" };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const getConfigs = (p: ReturnType<typeof productMap.get>): Array<{ value: string; stock_quantity: number | null }> =>
    Array.isArray(p?.option_configs) ? p.option_configs : [];

  // ── Phase 1: Validate — check all items BEFORE decrementing anything ──
  // Prevents partial decrements where item 1 succeeds but item 2 fails.
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || product.stock_mode !== "LIMITED") continue;

    const optionCfg = item.selectedOption
      ? getConfigs(product).find((c) => c.value === item.selectedOption)
      : null;

    if (optionCfg && optionCfg.stock_quantity !== null) {
      if (optionCfg.stock_quantity < item.quantity) {
        return {
          success: false,
          outOfStockProductName: `${product.name} (${item.selectedOption})`,
        };
      }
    } else {
      if ((product.stock_quantity ?? 0) < item.quantity) {
        return { success: false, outOfStockProductName: product.name };
      }
    }
  }

  // ── Phase 2: Decrement — all stock confirmed available ──
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product || product.stock_mode !== "LIMITED") continue;

    const optionCfg = item.selectedOption
      ? getConfigs(product).find((c) => c.value === item.selectedOption)
      : null;

    const usePerOptionStock = optionCfg && optionCfg.stock_quantity !== null;

    if (usePerOptionStock) {
      const { data: rows, error: rpcError } = await supabase.rpc(
        "decrement_stock_option",
        { p_id: item.productId, p_option_value: item.selectedOption, p_qty: item.quantity }
      );
      if (rpcError) {
        console.error("decrementStockForOrder: decrement_stock_option RPC error", rpcError);
        return { success: false, outOfStockProductName: product.name };
      }
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        return { success: false, outOfStockProductName: `${product.name} (${item.selectedOption})` };
      }
    } else {
      const { data: rows, error: rpcError } = await supabase.rpc(
        "decrement_stock",
        { p_id: item.productId, p_qty: item.quantity }
      );
      if (rpcError) {
        console.error("decrementStockForOrder: decrement_stock RPC error", rpcError);
        return { success: false, outOfStockProductName: product.name };
      }
      if (!rows || (Array.isArray(rows) && rows.length === 0)) {
        return { success: false, outOfStockProductName: product.name };
      }
    }
  }

  return { success: true };
}

// ── Dashboard Stats ──────────────────────────��──────────────────────────

export async function getDashboardStats(): Promise<{
  todayOrders: number;
  pendingOrders: number;
  monthlyRevenue: number;
  newCustomers: number;
}> {
  const supabase = await createServiceRoleClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Today's orders
  const { count: todayOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());
  
  // Pending orders
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");
  
  // Monthly revenue
  const { data: monthOrders } = await supabase
    .from("orders")
    .select("total")
    .gte("created_at", firstOfMonth.toISOString())
    .in("status", ["DELIVERED"]);
  
  const monthlyRevenue = (monthOrders || []).reduce((sum, o) => sum + Number(o.total), 0);
  
  // New customers this month
  const { count: newCustomers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", firstOfMonth.toISOString());
  
  return {
    todayOrders: todayOrders || 0,
    pendingOrders: pendingOrders || 0,
    monthlyRevenue,
    newCustomers: newCustomers || 0,
  };
}

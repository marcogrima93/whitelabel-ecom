// ============================================================================
// Supabase Database Types
// ============================================================================
// In production, generate with: npx supabase gen types typescript
// These types match the SQL migration schema.
// ============================================================================

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type UserRole = "RETAIL" | "WHOLESALE" | "ADMIN";
export type OrderStatus = "PENDING" | "CONFIRMED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
export type DeliveryMethod = "DELIVERY" | "COLLECTION";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  filter_field: string;
  images: string[];
  retail_price: number;
  wholesale_price: number;
  stock_status: StockStatus;
  options: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  wholesale_approved: boolean;
  business_name: string | null;
  vat_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  line_1: string;
  line_2: string | null;
  city: string;
  region: string;
  postcode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  delivery_address: Record<string, string> | null;
  delivery_fee: number;
  delivery_slot: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  discount_code: string | null;
  discount_amount: number;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  selected_option: string;
  price_per_unit: number;
  quantity: number;
  line_total: number;
}

export interface QuoteRequest {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string | null;
  categories: string[];
  quantity: string;
  frequency: string | null;
  notes: string | null;
  created_at: string;
}

// ── Supabase Database Type Map ──────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id" | "created_at" | "updated_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      addresses: {
        Row: Address;
        Insert: Omit<Address, "id" | "created_at">;
        Update: Partial<Omit<Address, "id" | "created_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Order, "id" | "created_at" | "updated_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id">;
        Update: Partial<Omit<OrderItem, "id">>;
      };
      quote_requests: {
        Row: QuoteRequest;
        Insert: Omit<QuoteRequest, "id" | "created_at">;
        Update: Partial<Omit<QuoteRequest, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      stock_status: StockStatus;
      user_role: UserRole;
      order_status: OrderStatus;
      delivery_method: DeliveryMethod;
    };
  };
}

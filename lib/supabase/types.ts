// ============================================================================
// Supabase Database Types
// ============================================================================
// In production, generate with: npx supabase gen types typescript
// These types match the SQL migration schema.
// ============================================================================

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER";
export type StockMode = "UNLIMITED" | "LIMITED";
export type UserRole = "RETAIL" | "WHOLESALE" | "ADMIN";
export type OrderStatus =
  | "PENDING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "READY_FOR_COLLECTION"
  | "COLLECTED"
  | "CANCELLED";
export type DeliveryMethod = "DELIVERY" | "COLLECTION";

/** One enriched option value with optional price override, image link, and per-option stock. */
export interface OptionConfig {
  /** The plain-text option value, e.g. "Red", "XL", "2kg" */
  value: string;
  /** If set, replaces the product base price when this option is selected. */
  price_override: number | null;
  /** URL of an already-uploaded product image, or null if none linked. */
  image_url: string | null;
  /**
   * Per-option stock quantity. Only meaningful when the parent product has
   * stock_mode = 'LIMITED' AND the product has options defined.
   * When no options exist, the product-level stock_quantity is used instead.
   * null means this option inherits unlimited / product-level stock.
   */
  stock_quantity: number | null;
}

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
  stock_mode: StockMode | undefined;
  stock_quantity: number | undefined;
  options: string[];
  /** Per-value configuration (price override + linked image). Stored as JSONB. */
  option_configs: OptionConfig[];
  is_archived: boolean;
  is_featured: boolean;
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
  // phone is stored on the user profile (profiles.phone), not on the address record.
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
  /** Stock status snapshotted at the time the order was placed. */
  stock_status_at_order: string | null;
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

// ── Supabase Table Update/Insert helpers ───────────────────────────────
export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at"> & {
  option_configs?: OptionConfig[];
};
export type ProductUpdate = Partial<Omit<Product, "id" | "created_at" | "updated_at">>;

export type ProfileInsert = Omit<Profile, "created_at" | "updated_at">;
export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;

export type AddressInsert = Omit<Address, "id" | "created_at">;
export type AddressUpdate = Partial<Omit<Address, "id" | "created_at">>;

export type OrderInsert = Omit<Order, "id" | "created_at" | "updated_at">;
export type OrderUpdate = Partial<Omit<Order, "id" | "created_at" | "updated_at">>;

export type OrderItemInsert = Omit<OrderItem, "id">;
export type OrderItemUpdate = Partial<Omit<OrderItem, "id">>;

export type QuoteRequestInsert = Omit<QuoteRequest, "id" | "created_at">;
export type QuoteRequestUpdate = Partial<Omit<QuoteRequest, "id" | "created_at">>;

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  active: boolean;
  created_at: string;
}

export type DiscountCodeInsert = Omit<DiscountCode, "id" | "created_at">;
export type DiscountCodeUpdate = Partial<Omit<DiscountCode, "id" | "created_at">>;

// ── Supabase Database Type Map ──────────────────────────────────────────
export interface ProductFilter {
  id: string;
  label: string;
  field: string;
  options: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductFilterInsert = Omit<ProductFilter, "id" | "created_at" | "updated_at">;
export type ProductFilterUpdate = Partial<Omit<ProductFilter, "id" | "created_at" | "updated_at">>;

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      addresses: {
        Row: Address;
        Insert: AddressInsert;
        Update: AddressUpdate;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
        Relationships: [];
      };
      quote_requests: {
        Row: QuoteRequest;
        Insert: QuoteRequestInsert;
        Update: QuoteRequestUpdate;
        Relationships: [];
      };
      discount_codes: {
        Row: DiscountCode;
        Insert: DiscountCodeInsert;
        Update: DiscountCodeUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      stock_status: StockStatus;
      stock_mode: StockMode;
      user_role: UserRole;
      order_status: OrderStatus;
      delivery_method: DeliveryMethod;
    };
  };
}

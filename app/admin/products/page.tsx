import { getProducts } from "@/lib/supabase/products";
import { createServiceRoleClient } from "@/lib/supabase/server";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const supabase = await createServiceRoleClient();

  const [products, { data: categories }, { data: productFilters }] = await Promise.all([
    getProducts(),
    supabase.from("categories").select("*"),
    supabase.from("product_filters").select("*"),
  ]);

  return (
    <AdminProductsClient
      initialProducts={products}
      categories={categories ?? []}
      productFilters={productFilters ?? []}
    />
  );
}

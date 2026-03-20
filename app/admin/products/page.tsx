import { getProducts } from "@/lib/supabase/products";
import { createServiceRoleClient } from "@/lib/supabase/server";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const supabase = await createServiceRoleClient();

  const [products, { data: categories }, { data: filterGroups }, { data: filterOptions }] =
    await Promise.all([
      getProducts(),
      supabase.from("categories").select("*").order("position"),
      supabase.from("product_filter_groups").select("*").order("position"),
      supabase.from("product_filter_options").select("*").order("position"),
    ]);

  return (
    <AdminProductsClient
      initialProducts={products}
      categories={categories ?? []}
      filterGroups={filterGroups ?? []}
      filterOptions={filterOptions ?? []}
    />
  );
}

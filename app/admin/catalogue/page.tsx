import { createServiceRoleClient } from "@/lib/supabase/server";
import AdminCatalogueClient from "./AdminCatalogueClient";

export default async function AdminCataloguePage() {
  const supabase = await createServiceRoleClient();

  const [{ data: categories }, { data: filterGroups }, { data: filterOptions }] =
    await Promise.all([
      supabase.from("categories").select("*").order("position"),
      supabase.from("product_filter_groups").select("*").order("position"),
      supabase.from("product_filter_options").select("*").order("position"),
    ]);

  return (
    <AdminCatalogueClient
      initialCategories={categories ?? []}
      initialFilterGroups={filterGroups ?? []}
      initialFilterOptions={filterOptions ?? []}
    />
  );
}

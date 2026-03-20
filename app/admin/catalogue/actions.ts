"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Categories ─────────────────────────────────────────────────────────

export async function addCategoryAction(data: {
  name: string;
  slug: string;
  image: string;
}): Promise<{ id: string; name: string; slug: string; image: string } | null> {
  const supabase = await createServiceRoleClient();
  const { data: row, error } = await supabase
    .from("categories")
    .insert(data)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return row;
}

export async function updateCategoryAction(
  id: string,
  data: { name: string; slug: string; image: string }
): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("categories").update(data).eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return true;
}

export async function deleteCategoryAction(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  revalidatePath("/products");
  return true;
}

// ── Product Filters ────────────────────────────────────────────────────

export async function addFilterGroupAction(data: {
  label: string;
}): Promise<{ id: string; label: string } | null> {
  const supabase = await createServiceRoleClient();
  const { data: row, error } = await supabase
    .from("product_filter_groups")
    .insert({ label: data.label })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  revalidatePath("/admin/catalogue");
  return row;
}

export async function deleteFilterGroupAction(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("product_filter_groups").delete().eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

export async function addFilterOptionAction(data: {
  group_id: string;
  value: string;
}): Promise<{ id: string; group_id: string; value: string } | null> {
  const supabase = await createServiceRoleClient();
  const { data: row, error } = await supabase
    .from("product_filter_options")
    .insert(data)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  revalidatePath("/admin/catalogue");
  return row;
}

export async function deleteFilterOptionAction(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("product_filter_options").delete().eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

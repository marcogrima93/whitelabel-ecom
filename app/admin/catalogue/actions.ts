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
// Schema: product_filters(id, label, options TEXT[], sort_order)

export async function addFilterGroupAction(data: {
  label: string;
}): Promise<{ id: string; label: string; options: string[] } | null> {
  const supabase = await createServiceRoleClient();
  const { data: row, error } = await supabase
    .from("product_filters")
    .insert({ label: data.label, options: [] })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  revalidatePath("/admin/catalogue");
  return row;
}

export async function updateFilterGroupAction(
  id: string,
  data: { label: string }
): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("product_filters").update(data).eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

export async function deleteFilterGroupAction(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from("product_filters").delete().eq("id", id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

export async function addFilterOptionAction(data: {
  group_id: string;
  value: string;
  current_options: string[];
}): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const newOptions = [...data.current_options, data.value];
  const { error } = await supabase
    .from("product_filters")
    .update({ options: newOptions })
    .eq("id", data.group_id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

export async function deleteFilterOptionAction(data: {
  group_id: string;
  value: string;
  current_options: string[];
}): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const newOptions = data.current_options.filter((o) => o !== data.value);
  const { error } = await supabase
    .from("product_filters")
    .update({ options: newOptions })
    .eq("id", data.group_id);
  if (error) { console.error(error); return false; }
  revalidatePath("/admin/catalogue");
  return true;
}

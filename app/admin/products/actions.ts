"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Product, ProductInsert, OptionConfig } from "@/lib/supabase/types";

export async function upsertProductAction(
  id: string | null,
  data: Omit<ProductInsert, "updated_at"> & { option_configs?: OptionConfig[] }
): Promise<{ success: boolean; error?: string; product?: Product }> {
  const supabase = await createServiceRoleClient();

  if (id) {
    // Update
    const { error } = await supabase
      .from("products")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { console.error("Error updating product:", error); return { success: false, error: error.message }; }
  } else {
    // Insert — check for slug uniqueness first
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", data.slug)
      .single();
    if (existing) return { success: false, error: `A product with slug "${data.slug}" already exists.` };

    const { data: row, error } = await supabase
      .from("products")
      .insert(data)
      .select()
      .single();
    if (error) { console.error("Error inserting product:", error); return { success: false, error: error.message }; }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true, product: row };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { success: true };
}

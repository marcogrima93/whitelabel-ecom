"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Product, ProductInsert, OptionConfig } from "@/lib/supabase/types";

export async function upsertProductAction(
  id: string | null,
  data: Omit<ProductInsert, "updated_at"> & { option_configs?: OptionConfig[] }
): Promise<{ success: boolean; error?: string; product?: Product }> {
  const supabase = await createServiceRoleClient();

  // Debug: log what actually arrives in the server action
  console.log("[v0] upsertProductAction option_configs received:", JSON.stringify(data.option_configs));
  console.log("[v0] upsertProductAction stock_mode:", data.stock_mode);

  if (id) {
    // Update
    const { error } = await supabase
      .from("products")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { console.error("Error updating product:", error); return { success: false, error: error.message }; }

    // Debug: read back what was stored
    const { data: readback } = await supabase
      .from("products")
      .select("option_configs, stock_mode, stock_quantity")
      .eq("id", id)
      .single();
    console.log("[v0] DB readback after update:", JSON.stringify(readback));
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

export async function archiveProductAction(id: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from("products")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("Error archiving product:", error); return false; }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return true;
}

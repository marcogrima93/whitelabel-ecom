"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductUpdate } from "@/lib/supabase/types";

export async function archiveProductAction(productId: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  const updateData: ProductUpdate = { is_archived: true };

  const { error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId);

  if (error) {
    console.error("Error archiving product:", error);
    return false;
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return true;
}

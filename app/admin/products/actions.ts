"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function archiveProductAction(productId: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  const { error } = await supabase
    .from("products")
    .update({ is_archived: true })
    .eq("id", productId);

  if (error) {
    console.error("Error archiving product:", error);
    return false;
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return true;
}

"use server";

import { updateOrderStatus } from "@/lib/supabase/queries";
import type { OrderStatus } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<boolean> {
  const success = await updateOrderStatus(orderId, status);
  
  if (success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
  
  return success;
}

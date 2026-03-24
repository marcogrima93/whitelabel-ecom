"use server";

import { updateOrderStatus, getOrderById } from "@/lib/supabase/queries";
import type { OrderStatus, Order, OrderItem } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<boolean> {
  const success = await updateOrderStatus(orderId, status);
  if (success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }
  return success;
}

export async function getOrderDetailAction(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  return getOrderById(orderId);
}

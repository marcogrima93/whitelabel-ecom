"use server";

import { approveWholesaleCustomer, rejectWholesaleCustomer, getCustomerById, getUserOrders } from "@/lib/supabase/queries";
import type { Profile, Order, OrderItem } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function approveWholesaleAction(customerId: string): Promise<boolean> {
  const success = await approveWholesaleCustomer(customerId);
  if (success) revalidatePath("/admin/customers");
  return success;
}

export async function rejectWholesaleAction(customerId: string): Promise<boolean> {
  const success = await rejectWholesaleCustomer(customerId);
  if (success) revalidatePath("/admin/customers");
  return success;
}

export async function getCustomerDetailAction(
  customerId: string
): Promise<{ profile: Profile; orders: (Order & { items?: OrderItem[] })[] } | null> {
  const [profile, orders] = await Promise.all([
    getCustomerById(customerId),
    getUserOrders(customerId),
  ]);
  if (!profile) return null;
  return { profile, orders };
}

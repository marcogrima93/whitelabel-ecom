"use server";

import { approveWholesaleCustomer, rejectWholesaleCustomer } from "@/lib/supabase/queries";
import { revalidatePath } from "next/cache";

export async function approveWholesaleAction(customerId: string): Promise<boolean> {
  const success = await approveWholesaleCustomer(customerId);
  
  if (success) {
    revalidatePath("/admin/customers");
  }
  
  return success;
}

export async function rejectWholesaleAction(customerId: string): Promise<boolean> {
  const success = await rejectWholesaleCustomer(customerId);
  
  if (success) {
    revalidatePath("/admin/customers");
  }
  
  return success;
}

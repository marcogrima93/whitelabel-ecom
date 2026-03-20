"use server";

import { createAddress, updateAddress, deleteAddress } from "@/lib/supabase/queries";
import type { Address } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

export async function addAddressAction(
  data: Omit<Address, "id" | "created_at">
): Promise<Address | null> {
  const address = await createAddress(data);
  
  if (address) {
    revalidatePath("/account/addresses");
  }
  
  return address;
}

export async function updateAddressAction(
  addressId: string,
  userId: string,
  updates: Partial<Address>
): Promise<boolean> {
  const success = await updateAddress(addressId, userId, updates);
  
  if (success) {
    revalidatePath("/account/addresses");
  }
  
  return success;
}

export async function deleteAddressAction(addressId: string, userId: string): Promise<boolean> {
  const success = await deleteAddress(addressId, userId);
  
  if (success) {
    revalidatePath("/account/addresses");
  }
  
  return success;
}

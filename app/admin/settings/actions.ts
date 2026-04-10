"use server";

import {
  saveSlotMatrix,
  saveBlockedDaysForMethod,
  saveBlockedDatesForMethod,
  saveAdvanceDayRules,
  type SlotMatrix,
  type FulfillmentMethod,
  type AdvanceDayRule,
} from "@/lib/supabase/settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return true;
}

export async function saveFulfillmentSlotsAction(
  matrix: SlotMatrix
): Promise<{ success: boolean; error?: string }> {
  if (!(await assertAdmin())) return { success: false, error: "Unauthorized" };

  const result = await saveSlotMatrix(matrix);
  if (!result.ok) return { success: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/api/delivery-settings");
  return { success: true };
}

export async function saveBlockedDaysAction(
  method: FulfillmentMethod,
  days: number[]
): Promise<{ success: boolean; error?: string }> {
  if (!(await assertAdmin())) return { success: false, error: "Unauthorized" };

  const result = await saveBlockedDaysForMethod(method, days);
  if (!result.ok) return { success: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/api/delivery-settings");
  return { success: true };
}

export async function saveBlockedDatesAction(
  method: FulfillmentMethod,
  dates: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!(await assertAdmin())) return { success: false, error: "Unauthorized" };

  const result = await saveBlockedDatesForMethod(method, dates);
  if (!result.ok) return { success: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/api/delivery-settings");
  return { success: true };
}

export async function saveAdvanceDaysAction(
  rules: Array<{ stock_status: string; fulfillment_method: FulfillmentMethod; advance_days: number }>
): Promise<{ success: boolean; error?: string }> {
  if (!(await assertAdmin())) return { success: false, error: "Unauthorized" };

  const result = await saveAdvanceDayRules(rules);
  if (!result.ok) return { success: false, error: result.error };

  revalidatePath("/admin/settings");
  revalidatePath("/api/delivery-settings");
  return { success: true };
}

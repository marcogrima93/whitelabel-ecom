"use server";

import { updateDeliverySettings } from "@/lib/supabase/settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDeliverySettingsAction(
  blockedDays: number[],
  blockedDates: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const ok = await updateDeliverySettings(blockedDays, blockedDates);
  if (ok) revalidatePath("/admin/settings");
  return ok ? { success: true } : { success: false, error: "Failed to save settings" };
}

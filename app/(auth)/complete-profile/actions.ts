"use server";

import { updateProfile } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function savePhone(phone: string): Promise<{ error: string | null }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expired. Please sign in again." };
  }

  const ok = await updateProfile(user.id, { phone });
  if (!ok) {
    return { error: "Failed to save your phone number. Please try again." };
  }

  return { error: null };
}

"use server";

import { updateProfile } from "@/lib/supabase/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(
  userId: string,
  updates: { name: string; phone: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const success = await updateProfile(userId, {
      name: updates.name,
      phone: updates.phone || null,
    });
    
    if (success) {
      revalidatePath("/account/details");
      return { success: true };
    }
    
    return { success: false, error: "Failed to update profile" };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updatePasswordAction(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error("Error updating password:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating password:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

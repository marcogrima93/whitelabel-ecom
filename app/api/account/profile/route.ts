import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(null);
    const profile = await getCurrentUserProfile();
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(null);
  }
}

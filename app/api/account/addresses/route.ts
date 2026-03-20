import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserAddresses } from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);
    const addresses = await getUserAddresses(user.id);
    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json([]);
  }
}

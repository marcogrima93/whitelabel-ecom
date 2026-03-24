import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/supabase/queries";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const order = await getOrderById(id);

    // Ensure the order belongs to the requesting user
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

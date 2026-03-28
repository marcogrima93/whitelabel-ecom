import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "@/lib/supabase/queries";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") return null;
  return user;
}

// GET /api/admin/discount-codes
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const codes = await getDiscountCodes();
  return NextResponse.json(codes);
}

// POST /api/admin/discount-codes
export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code, percentage, active } = await req.json();
  if (!code || !percentage) return NextResponse.json({ error: "code and percentage are required" }, { status: 400 });
  const created = await createDiscountCode({ code, percentage: Number(percentage), active: active !== false });
  if (!created) return NextResponse.json({ error: "Failed to create code" }, { status: 500 });
  return NextResponse.json(created, { status: 201 });
}

// PATCH /api/admin/discount-codes
export async function PATCH(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const ok = await updateDiscountCode(id, updates);
  if (!ok) return NextResponse.json({ error: "Failed to update code" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/discount-codes
export async function DELETE(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const ok = await deleteDiscountCode(id);
  if (!ok) return NextResponse.json({ error: "Failed to delete code" }, { status: 500 });
  return NextResponse.json({ success: true });
}

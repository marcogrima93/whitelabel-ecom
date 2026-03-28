import { NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    const discount = await validateDiscountCode(code);
    if (!discount) {
      return NextResponse.json({ error: "Invalid or inactive discount code" }, { status: 404 });
    }
    return NextResponse.json({ id: discount.id, code: discount.code, percentage: discount.percentage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

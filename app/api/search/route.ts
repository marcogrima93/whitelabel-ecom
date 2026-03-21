import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Fall back to mock data search
    const { mockProducts } = await import("@/lib/supabase/mock-data");
    const results = mockProducts
      .filter(
        (p) =>
          !p.is_archived &&
          (p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.description.toLowerCase().includes(q.toLowerCase()) ||
            p.category.toLowerCase().includes(q.toLowerCase()))
      )
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        retail_price: p.retail_price,
        images: p.images,
        stock_status: p.stock_status,
      }));
    return NextResponse.json(results);
  }

  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, category, retail_price, images, stock_status")
    .eq("is_archived", false)
    .ilike("name", `%${q}%`)
    .limit(5);

  if (error) {
    return NextResponse.json([]);
  }

  const normalised = (data ?? []).map((p: any) => {
    let imgs = p.images as unknown;
    if (!imgs) imgs = [];
    else if (typeof imgs === "string") {
      try { imgs = JSON.parse(imgs); } catch { imgs = [imgs]; }
    }
    if (!Array.isArray(imgs)) imgs = [String(imgs)];
    return {
      ...p,
      images: (imgs as unknown[])
        .map((u) => String(u).trim())
        .filter((u: string) => u.startsWith("http") || u.startsWith("/")),
    };
  });

  return NextResponse.json(normalised);
}

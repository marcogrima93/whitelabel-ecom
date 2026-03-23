import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

// TODO: Full edit form similar to /admin/products/new but pre-populated
// For now, redirect to products list
export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit: {product.name}</h1>
      <p className="text-muted-foreground">
        Product editing form — mirrors the create form with pre-populated fields.
        This is a placeholder. Wire up the full form identical to /admin/products/new
        but with default values from the product data.
      </p>
      <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );
}

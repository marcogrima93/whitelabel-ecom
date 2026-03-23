"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { slugify } from "@/modules/ecom/lib/utils";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", slug: "", description: "", short_description: "",
    price: "", compare_at_price: "", cost_price: "",
    sku: "", inventory_count: "0",
    is_active: true, is_featured: false, is_digital: false,
    seo_title: "", seo_description: "",
  });

  const updateField = (field: string, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name") updated.slug = slugify(value);
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.from("products").insert({
      name: form.name, slug: form.slug,
      description: form.description, short_description: form.short_description,
      price: parseFloat(form.price), compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      sku: form.sku || null, inventory_count: parseInt(form.inventory_count),
      is_active: form.is_active, is_featured: form.is_featured, is_digital: form.is_digital,
      seo_title: form.seo_title || null, seo_description: form.seo_description || null,
    });

    if (err) { setError(err.message); setSaving(false); return; }
    router.push("/admin/products");
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Card>
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Product Name</Label><Input value={form.name} onChange={(e) => updateField("name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Short Description</Label><Input value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={5} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pricing & Inventory</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Compare At Price</Label><Input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => updateField("compare_at_price", e.target.value)} /></div>
              <div className="space-y-2"><Label>Cost Price</Label><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => updateField("cost_price", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => updateField("sku", e.target.value)} /></div>
              <div className="space-y-2"><Label>Inventory Count</Label><Input type="number" value={form.inventory_count} onChange={(e) => updateField("inventory_count", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Options</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} /></div>
            <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} /></div>
            <div className="flex items-center justify-between"><Label>Digital Product</Label><Switch checked={form.is_digital} onCheckedChange={(v) => updateField("is_digital", v)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>SEO Title</Label><Input value={form.seo_title} onChange={(e) => updateField("seo_title", e.target.value)} /></div>
            <div className="space-y-2"><Label>SEO Description</Label><Textarea value={form.seo_description} onChange={(e) => updateField("seo_description", e.target.value)} rows={3} /></div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Product"}
        </Button>
      </form>
    </div>
  );
}

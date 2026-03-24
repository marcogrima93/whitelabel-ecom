"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Archive, Search, Package, Inbox, Loader2, X } from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { archiveProductAction, upsertProductAction } from "./actions";
import { ImageUpload } from "@/components/ui/image-upload";

interface Category { id: string; name: string; slug: string; }
interface ProductFilter { id: string; label: string; options: string[]; }

interface Props {
  initialProducts: Product[];
  categories: Category[];
  productFilters: ProductFilter[];
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  category: "",
  filter_field: "none",
  retail_price: "",
  wholesale_price: "",
  stock_status: "IN_STOCK" as Product["stock_status"],
  options: [] as string[],
  images: [] as string[],
  is_featured: false,
};

const stockBadge = (status: string) => {
  switch (status) {
    case "IN_STOCK": return <Badge variant="success">In Stock</Badge>;
    case "LOW_STOCK": return <Badge variant="warning">Low Stock</Badge>;
    case "OUT_OF_STOCK": return <Badge variant="destructive">Out of Stock</Badge>;
    default: return null;
  }
};

export default function AdminProductsClient({ initialProducts, categories, productFilters }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Product dialog ────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [optionInput, setOptionInput] = useState("");
  const [formError, setFormError] = useState("");

  const openDialog = (product?: Product) => {
    setFormError("");
    if (product) {
      setEditingProduct(product);
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        filter_field: product.filter_field || "none",
        retail_price: String(product.retail_price),
        wholesale_price: String(product.wholesale_price ?? ""),
        stock_status: product.stock_status,
        options: product.options ?? [],
        images: product.images ?? [],
        is_featured: product.is_featured ?? false,
      });
    } else {
      setEditingProduct(null);
      setForm(EMPTY_FORM);
    }
    setOptionInput("");
    setDialogOpen(true);
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const update = <K extends keyof typeof EMPTY_FORM>(k: K, v: (typeof EMPTY_FORM)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addOption = () => {
    const val = optionInput.trim();
    if (!val || form.options.includes(val)) return;
    update("options", [...form.options, val]);
    setOptionInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    startTransition(async () => {
      const payload = {
        name: form.name,
        slug: form.slug || autoSlug(form.name),
        description: form.description,
        category: form.category,
        filter_field: form.filter_field === "none" ? "" : form.filter_field,
        retail_price: parseFloat(form.retail_price) || 0,
        wholesale_price: parseFloat(form.wholesale_price) || 0,
        stock_status: form.stock_status,
        options: form.options,
        images: form.images,
        is_archived: false,
        is_featured: form.is_featured,
      };
      const result = await upsertProductAction(editingProduct?.id ?? null, payload);
      if (!result.success) {
        setFormError(result.error ?? "Failed to save product.");
        return;
      }
      if (editingProduct) {
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...p, ...payload } : p));
      } else if (result.product) {
        setProducts((prev) => [result.product!, ...prev]);
      }
      setDialogOpen(false);
    });
  };

  // ── Archive ───────────────────────────────────────────────────────
  const handleArchive = (productId: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    setArchivingId(productId);
    startTransition(async () => {
      const success = await archiveProductAction(productId);
      if (success) setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_archived: true } : p));
      setArchivingId(null);
    });
  };

  const getCategoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  // All filter options flattened for the filter_field select
  const allFilterOptions = productFilters.flatMap((g) => g.options);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat && !p.is_archived;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">{filtered.length} products</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {products.filter((p) => !p.is_archived).length === 0
                  ? "Add your first product to get started."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Product</th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Stock</th>
                    <th className="text-left p-4 font-semibold">Retail</th>
                    {siteConfig.wholesale.enabled && (
                      <th className="text-left p-4 font-semibold">Wholesale</th>
                    )}
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.filter_field}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground capitalize">{getCategoryName(product.category)}</td>
                      <td className="p-4">{stockBadge(product.stock_status)}</td>
                      <td className="p-4 font-medium">
                        {formatPrice(product.retail_price, siteConfig.currency.code, siteConfig.currency.locale)}
                      </td>
                      {siteConfig.wholesale.enabled && (
                        <td className="p-4 font-medium">
                          {formatPrice(product.wholesale_price, siteConfig.currency.code, siteConfig.currency.locale)}
                        </td>
                      )}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(product)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleArchive(product.id)}
                            disabled={archivingId === product.id}
                          >
                            {archivingId === product.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Archive className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Product Dialog ─────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{formError}</p>
              )}

              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name">Name *</Label>
                  <Input
                    id="p-name"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((p) => ({ ...p, name, slug: editingProduct ? p.slug : autoSlug(name) }));
                    }}
                    placeholder="e.g. Ribeye Steak"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-slug">Slug *</Label>
                  <Input
                    id="p-slug"
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="e.g. ribeye-steak"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              {/* Category + Filter Field */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-cat">Category *</Label>
                  <Select value={form.category} onValueChange={(v) => update("category", v)} required>
                    <SelectTrigger id="p-cat">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-filter">
                    {productFilters[0]?.label ?? "Filter"} (optional)
                  </Label>
                  <Select value={form.filter_field} onValueChange={(v) => update("filter_field", v)}>
                    <SelectTrigger id="p-filter">
                      <SelectValue placeholder="Select filter value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {allFilterOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-retail">Retail Price ({siteConfig.currency.symbol}) *</Label>
                  <Input
                    id="p-retail"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.retail_price}
                    onChange={(e) => update("retail_price", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                {siteConfig.wholesale.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="p-wholesale">Wholesale Price ({siteConfig.currency.symbol})</Label>
                    <Input
                      id="p-wholesale"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.wholesale_price}
                      onChange={(e) => update("wholesale_price", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="space-y-2">
                <Label htmlFor="p-stock">Stock Status *</Label>
                <Select value={form.stock_status} onValueChange={(v) => update("stock_status", v as Product["stock_status"])}>
                  <SelectTrigger id="p-stock">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options (e.g. weights) */}
              <div className="space-y-2">
                <Label>Options (e.g. 500g, 1kg)</Label>
                <div className="flex gap-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                    placeholder={`Add ${siteConfig.filters.optionSelector.toLowerCase()}`}
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={addOption}>Add</Button>
                </div>
                {form.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.options.map((opt) => (
                      <Badge key={opt} variant="secondary" className="gap-1 pr-1">
                        {opt}
                        <button type="button" onClick={() => update("options", form.options.filter((o) => o !== opt))} className="hover:text-destructive ml-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Images */}
              <ImageUpload
                label="Product Images"
                folder="products"
                value={form.images}
                onChange={(urls) => update("images", urls as string[])}
                multiple
              />

              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => update("is_featured", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div>
                  <p className="text-sm font-medium leading-none">Featured product</p>
                  <p className="text-xs text-muted-foreground mt-1">Shown in the homepage featured products grid (max 4 shown).</p>
                </div>
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingProduct ? "Save Changes" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

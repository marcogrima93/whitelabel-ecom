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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Archive, Search, Package, Inbox, Loader2, X, Link2, Unlink } from "lucide-react";
import type { Product, OptionConfig, StockMode } from "@/lib/supabase/types";
import { archiveProductAction, upsertProductAction } from "./actions";
import { ImageUpload } from "@/components/ui/image-upload";

interface Category { id: string; name: string; slug: string; }
interface ProductFilter { id: string; label: string; field: string; options: string[]; }

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
  filter_values: {} as Record<string, string>,
  retail_price: "",
  wholesale_price: "",
  stock_status: "IN_STOCK" as Product["stock_status"],
  stock_mode: "UNLIMITED" as StockMode,
  stock_quantity: "0",
  options: [] as string[],
  option_configs: [] as OptionConfig[],
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

/** Merge a plain string[] of option values with existing OptionConfig[],
 *  preserving existing price_override / image_url / stock_quantity and removing deleted values. */
function mergeConfigs(values: string[], existing: OptionConfig[]): OptionConfig[] {
  return values.map((v) => {
    const found = existing.find((c) => c.value === v);
    return found ?? { value: v, price_override: null, image_url: null, stock_quantity: null };
  });
}

// ── Image picker popover ──────────────────────────────────────────────────────
interface ImagePickerProps {
  images: string[];
  value: string | null;
  onChange: (url: string | null) => void;
}

function ImagePicker({ images, value, onChange }: ImagePickerProps) {
  const [open, setOpen] = useState(false);

  if (images.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">Upload images first</p>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 hover:bg-accent transition-colors"
        title={value ? "Change linked image" : "Link an image"}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-5 w-5 rounded object-cover" />
            <span className="max-w-[80px] truncate text-muted-foreground">{value.split("/").pop()}</span>
            <span
              role="button"
              aria-label="Remove image link"
              tabIndex={0}
              className="ml-0.5 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(null); setOpen(false); } }}
            >
              <X className="h-3 w-3" />
            </span>
          </>
        ) : (
          <>
            <Link2 className="h-3 w-3" />
            <span className="text-muted-foreground">Link image</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1.5 w-max max-w-xs">
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={`aspect-square rounded border-2 flex items-center justify-center transition-colors ${
              !value ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/40"
            }`}
            title="No image"
          >
            <Unlink className="h-4 w-4 text-muted-foreground" />
          </button>
          {images.map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => { onChange(img); setOpen(false); }}
              className={`aspect-square rounded border-2 overflow-hidden transition-colors ${
                value === img ? "border-primary" : "border-transparent hover:border-primary/40"
              }`}
              title={img.split("/").pop()}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      let filter_values: Record<string, string> = {};
      try {
        if (product.filter_field) filter_values = JSON.parse(product.filter_field);
      } catch { /* legacy plain text value — ignore */ }

      const options = product.options ?? [];
      const existingConfigs: OptionConfig[] = Array.isArray(product.option_configs)
        ? product.option_configs
        : [];
      const option_configs = mergeConfigs(options, existingConfigs);

      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        filter_values,
        retail_price: String(product.retail_price),
        wholesale_price: String(product.wholesale_price ?? ""),
        stock_status: product.stock_status,
        stock_mode: (product.stock_mode as StockMode) ?? "UNLIMITED",
        stock_quantity: String(product.stock_quantity ?? 0),
        options,
        option_configs,
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
    const newOptions = [...form.options, val];
    const newConfigs = mergeConfigs(newOptions, form.option_configs);
    setForm((p) => ({ ...p, options: newOptions, option_configs: newConfigs }));
    setOptionInput("");
  };

  const removeOption = (opt: string) => {
    const newOptions = form.options.filter((o) => o !== opt);
    const newConfigs = mergeConfigs(newOptions, form.option_configs);
    setForm((p) => ({ ...p, options: newOptions, option_configs: newConfigs }));
  };

  const updateConfig = (value: string, patch: Partial<Omit<OptionConfig, "value">>) => {
    setForm((p) => ({
      ...p,
      option_configs: p.option_configs.map((c) =>
        c.value === value ? { ...c, ...patch } : c
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    startTransition(async () => {
      const cleanedFilterValues = Object.fromEntries(
        Object.entries(form.filter_values).filter(([, v]) => v && v !== "__none__")
      );
      // Clean configs: strip empty price strings, keep only valid entries
      const cleanedConfigs: OptionConfig[] = form.option_configs.map((c) => ({
        value: c.value,
        price_override: c.price_override !== null && !isNaN(c.price_override) ? c.price_override : null,
        image_url: c.image_url || null,
        stock_quantity: form.stock_mode === "LIMITED" && c.stock_quantity !== null
          ? (isNaN(c.stock_quantity) ? null : c.stock_quantity)
          : null,
      }));

      const stockQuantity = parseInt(form.stock_quantity, 10) || 0;

      // When LIMITED + options exist, derive stock_status from aggregate option quantities.
      // When LIMITED + no options, derive from product-level stock_quantity.
      // When UNLIMITED, use the manual stock_status dropdown value.
      let derivedStockStatus: Product["stock_status"];
      if (form.stock_mode === "LIMITED") {
        const hasOptionStock = form.option_configs.some((c) => c.stock_quantity !== null);
        if (hasOptionStock) {
          const total = form.option_configs.reduce((sum, c) => sum + (c.stock_quantity ?? 0), 0);
          derivedStockStatus = total <= 0 ? "OUT_OF_STOCK" : total <= 2 ? "LOW_STOCK" : "IN_STOCK";
        } else {
          derivedStockStatus = stockQuantity <= 0 ? "OUT_OF_STOCK" : stockQuantity <= 2 ? "LOW_STOCK" : "IN_STOCK";
        }
      } else {
        derivedStockStatus = form.stock_status;
      }

      const payload = {
        name: form.name,
        slug: form.slug || autoSlug(form.name),
        description: form.description,
        category: form.category,
        filter_field: Object.keys(cleanedFilterValues).length > 0
          ? JSON.stringify(cleanedFilterValues)
          : "",
        retail_price: parseFloat(form.retail_price) || 0,
        wholesale_price: parseFloat(form.wholesale_price) || 0,
        stock_status: derivedStockStatus,
        stock_mode: form.stock_mode,
        stock_quantity: form.stock_mode === "LIMITED" ? stockQuantity : 0,
        options: form.options,
        option_configs: cleanedConfigs,
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
                    <th className="text-left p-4 font-semibold">Qty</th>
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
                            {product.filter_field && (() => {
                              try {
                                const vals = JSON.parse(product.filter_field) as Record<string, string>;
                                const summary = Object.values(vals).filter(Boolean).join(" · ");
                                return summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null;
                              } catch {
                                return <p className="text-xs text-muted-foreground">{product.filter_field}</p>;
                              }
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground capitalize">{getCategoryName(product.category)}</td>
                      <td className="p-4">{stockBadge(product.stock_status)}</td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {product.stock_mode === "LIMITED" ? (
                          (() => {
                            const optionStocks = (product.option_configs ?? []).filter(
                              (c: OptionConfig) => c.stock_quantity !== null
                            );
                            if (optionStocks.length > 0) {
                              const total = optionStocks.reduce(
                                (sum: number, c: OptionConfig) => sum + (c.stock_quantity ?? 0), 0
                              );
                              return (
                                <span title={optionStocks.map((c: OptionConfig) => `${c.value}: ${c.stock_quantity}`).join(", ")}>
                                  {total} <span className="text-xs opacity-60">(by option)</span>
                                </span>
                              );
                            }
                            return product.stock_quantity;
                          })()
                        ) : (
                          <span className="text-xs italic">—</span>
                        )}
                      </td>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details, images, and option values." : "Fill in the details below to create a new product."}
              </DialogDescription>
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

              {/* Category */}
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
              </div>

              {/* Dynamic filter group selects */}
              {productFilters.length > 0 && (
                <div className="space-y-3">
                  <Label>Filter Attributes</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {productFilters.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <Label htmlFor={`p-filter-${group.field}`} className="text-sm font-normal text-muted-foreground">
                          {group.label}
                        </Label>
                        <Select
                          value={form.filter_values[group.field] ?? "__none__"}
                          onValueChange={(v) =>
                            setForm((prev) => ({
                              ...prev,
                              filter_values: { ...prev.filter_values, [group.field]: v },
                            }))
                          }
                        >
                          <SelectTrigger id={`p-filter-${group.field}`}>
                            <SelectValue placeholder={`Select ${group.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {group.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Stock Mode */}
              <div className="space-y-3">
                <Label>Stock Tracking</Label>
                <div className="flex rounded-md border overflow-hidden w-fit">
                  <button
                    type="button"
                    onClick={() => update("stock_mode", "UNLIMITED")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      form.stock_mode === "UNLIMITED"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Unlimited
                  </button>
                  <button
                    type="button"
                    onClick={() => update("stock_mode", "LIMITED")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      form.stock_mode === "LIMITED"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    Limited
                  </button>
                </div>

                {form.stock_mode === "UNLIMITED" ? (
                  <div className="space-y-2">
                    <Label htmlFor="p-stock" className="text-sm font-normal text-muted-foreground">
                      Stock Status
                    </Label>
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
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="p-stock-qty" className="text-sm font-normal text-muted-foreground">
                          {form.options.length > 0 ? "Product-level Stock Quantity (fallback)" : "Stock Quantity"}
                        </Label>
                        <Input
                          id="p-stock-qty"
                          type="number"
                          min="0"
                          step="1"
                          value={form.stock_quantity}
                          onChange={(e) => update("stock_quantity", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2 pt-6">
                        <Label className="text-sm font-normal text-muted-foreground sr-only">Derived status</Label>
                        {(() => {
                          const hasOptionStock = form.option_configs.some((c) => c.stock_quantity !== null);
                          const qty = hasOptionStock
                            ? form.option_configs.reduce((sum, c) => sum + (c.stock_quantity ?? 0), 0)
                            : (parseInt(form.stock_quantity, 10) || 0);
                          if (qty <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
                          if (qty <= 2) return <Badge variant="warning">Low Stock</Badge>;
                          return <Badge variant="success">In Stock</Badge>;
                        })()}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.options.length > 0
                        ? "With options enabled, set stock per option value in the Options table below. Status is derived from the aggregate."
                        : "Status is automatically derived from quantity: 0 = Out of Stock, 1–2 = Low Stock, 3+ = In Stock."}
                    </p>
                  </div>
                )}
              </div>

              {/* Images — must come before Options so the image picker has URLs to show */}
              <ImageUpload
                label="Product Images"
                folder="products"
                value={form.images}
                onChange={(urls) => update("images", urls as string[])}
                multiple
              />

              {/* Options with per-value price override + image link */}
              <div className="space-y-3">
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

                {form.option_configs.length > 0 && (
                  <div className="rounded-md border divide-y">
                    {/* Header row */}
                    <div className={`grid ${form.stock_mode === "LIMITED" ? "grid-cols-[1fr_120px_120px_80px_28px]" : "grid-cols-[1fr_140px_140px_28px]"} gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground`}>
                      <span>Value</span>
                      <span>Price override ({siteConfig.currency.symbol})</span>
                      <span>Linked image</span>
                      {form.stock_mode === "LIMITED" && <span>Stock qty</span>}
                      <span />
                    </div>

                    {form.option_configs.map((cfg) => (
                      <div key={cfg.value} className={`grid ${form.stock_mode === "LIMITED" ? "grid-cols-[1fr_120px_120px_80px_28px]" : "grid-cols-[1fr_140px_140px_28px]"} gap-2 px-3 py-2 items-center`}>
                        {/* Value label */}
                        <span className="text-sm font-medium truncate">{cfg.value}</span>

                        {/* Price override */}
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={`Base (${form.retail_price || "0.00"})`}
                          value={cfg.price_override !== null ? String(cfg.price_override) : ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            updateConfig(cfg.value, {
                              price_override: raw === "" ? null : parseFloat(raw),
                            });
                          }}
                          className="h-7 text-xs"
                        />

                        {/* Image picker */}
                        <ImagePicker
                          images={form.images}
                          value={cfg.image_url}
                          onChange={(url) => updateConfig(cfg.value, { image_url: url })}
                        />

                        {/* Per-option stock qty (LIMITED mode only) */}
                        {form.stock_mode === "LIMITED" && (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="—"
                            value={cfg.stock_quantity !== null ? String(cfg.stock_quantity) : ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateConfig(cfg.value, {
                                stock_quantity: raw === "" ? null : parseInt(raw, 10),
                              });
                            }}
                            className="h-7 text-xs"
                          />
                        )}

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeOption(cfg.value)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove option ${cfg.value}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

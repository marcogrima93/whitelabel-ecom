"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Archive, Search, Package, Inbox, Loader2 } from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { archiveProductAction } from "./actions";

interface Category { id: string; name: string; slug: string; }
interface FilterGroup { id: string; label: string; }
interface FilterOption { id: string; group_id: string; value: string; }

interface Props {
  initialProducts: Product[];
  categories: Category[];
  filterGroups: FilterGroup[];
  filterOptions: FilterOption[];
}

const stockBadge = (status: string) => {
  switch (status) {
    case "IN_STOCK": return <Badge variant="success">In Stock</Badge>;
    case "LOW_STOCK": return <Badge variant="warning">Low Stock</Badge>;
    case "OUT_OF_STOCK": return <Badge variant="destructive">Out of Stock</Badge>;
    default: return null;
  }
};

export default function AdminProductsClient({ initialProducts, categories, filterGroups, filterOptions }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat && !p.is_archived;
  });

  const handleArchive = async (productId: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    setArchivingId(productId);
    startTransition(async () => {
      const success = await archiveProductAction(productId);
      if (success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_archived: true } : p))
        );
      }
      setArchivingId(null);
    });
  };

  const getCategoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">{filtered.length} products</p>
        </div>
        <Button>
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
                {products.length === 0
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
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
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
                      <td className="p-4 text-muted-foreground capitalize">
                        {getCategoryName(product.category)}
                      </td>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Archive, Search, Package, Inbox, Loader2 } from "lucide-react";
import type { Product } from "@/lib/supabase/types";
import { archiveProductAction } from "./actions";

const stockBadge = (status: string) => {
  switch (status) {
    case "IN_STOCK": return <Badge variant="success">In Stock</Badge>;
    case "LOW_STOCK": return <Badge variant="warning">Low Stock</Badge>;
    case "OUT_OF_STOCK": return <Badge variant="destructive">Out of Stock</Badge>;
    default: return null;
  }
};

export default function AdminProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat && !p.is_archived;
  });

  const handleArchive = async (productId: string) => {
    if (!confirm("Are you sure you want to archive this product?")) return;
    
    setArchivingId(productId);
    startTransition(async () => {
      const success = await archiveProductAction(productId);
      if (success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_archived: true } : p))
        );
      }
      setArchivingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">{filtered.length} products</p>
        </div>
        <Button>
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
            {siteConfig.categories.map((cat) => (
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
                {products.length === 0
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
                            {product.images && product.images[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
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
                      <td className="p-4 text-muted-foreground">
                        {siteConfig.categories.find((c) => c.slug === product.category)?.name || product.category}
                      </td>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/supabase/types";
import { ShoppingBag, ShoppingCart, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const isOutOfStock = product.stock_status === "OUT_OF_STOCK";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0] || "",
      selectedOption: product.options[0] || "",
      pricePerUnit: product.retail_price,
      quantity: 1,
      slug: product.slug,
    });
  };

  const stockBadge = () => {
    switch (product.stock_status) {
      case "IN_STOCK":
        return <Badge variant="success">In Stock</Badge>;
      case "LOW_STOCK":
        return <Badge variant="warning">Low Stock</Badge>;
      case "OUT_OF_STOCK":
        return <Badge variant="destructive">Out of Stock</Badge>;
    }
  };

  return (
    <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
      <div className="group relative">
        <Link href={`/products/${product.slug}`}>
          <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
            {/* Image */}
            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
              {product.images && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300" />
                </div>
              )}

              {/* Stock badge */}
              <div className="absolute top-3 left-3 z-10">
                {stockBadge()}
              </div>

              {/* Filter badge */}
              {product.filter_field && (
                <Badge variant="secondary" className="absolute top-3 right-3 z-10">
                  {product.filter_field}
                </Badge>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-10 w-10 rounded-full shadow-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    aria-label="Quick view"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {categoryName ?? product.category}
              </p>
              <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center justify-between mt-3">
                <p className="font-bold text-lg">
                  {formatPrice(product.retail_price, siteConfig.currency.code, siteConfig.currency.locale)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    / {siteConfig.filters.unit}
                  </span>
                </p>
              </div>
              <Button
                className="w-full mt-3"
                size="sm"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick View Dialog */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.filter_field}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden relative">
            {product.images && product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
          </div>
          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {stockBadge()}
            </div>
            <p className="text-2xl font-bold">
              {formatPrice(product.retail_price, siteConfig.currency.code, siteConfig.currency.locale)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {siteConfig.filters.unit}
              </span>
            </p>
            <p className="text-sm text-muted-foreground line-clamp-4">
              {product.description}
            </p>
            {product.options.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{siteConfig.filters.optionSelector}</p>
                <div className="flex flex-wrap gap-2">
                  {product.options.map((opt) => (
                    <Badge key={opt} variant="outline" className="cursor-pointer hover:bg-accent">
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={isOutOfStock} onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/products/${product.slug}`} onClick={() => setQuickViewOpen(false)}>
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

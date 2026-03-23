"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "../hooks/use-cart";
import { formatPrice, getStockStatus } from "../lib/utils";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const addItem = useCart((s) => s.addItem);
  const primaryImage = product.product_images?.find((i) => i.is_primary) || product.product_images?.[0];
  const stock = getStockStatus(product.inventory_count);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.inventory_count <= 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: primaryImage?.url || "/placeholder-product.svg",
      price: product.price,
      quantity: 1,
      sku: product.sku || undefined,
    });
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={primaryImage?.url || "/placeholder-product.svg"}
            alt={primaryImage?.alt_text || product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.compare_at_price && (
            <Badge className="absolute top-2 left-2" variant="destructive">
              Sale
            </Badge>
          )}
          <Badge
            className="absolute top-2 right-2"
            variant={stock.color === "success" ? "default" : stock.color === "warning" ? "secondary" : "destructive"}
          >
            {stock.label}
          </Badge>
        </div>
        <CardContent className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={handleAddToCart}
              disabled={product.inventory_count <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

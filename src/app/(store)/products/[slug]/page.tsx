import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getProducts } from "@/modules/ecom/lib/queries";
import { PriceDisplay } from "@/modules/ecom/components/PriceDisplay";
import { ProductGrid } from "@/modules/ecom/components/ProductGrid";
import { AddToCartSection } from "./AddToCartSection";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getStockStatus } from "@/modules/ecom/lib/utils";
import { siteConfig } from "../../../../../site.config";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || product.description?.substring(0, 160),
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const stock = getStockStatus(product.inventory_count);
  const primaryImage = product.product_images?.find((i) => i.is_primary) || product.product_images?.[0];

  // Related products
  const { products: relatedProducts } = await getProducts({
    category: product.category_id || undefined,
    limit: 4,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground mb-6">
        <a href="/" className="hover:text-foreground">Home</a>
        <span className="mx-2">/</span>
        <a href="/products" className="hover:text-foreground">Products</a>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <a href={`/products?category=${product.category_id}`} className="hover:text-foreground">
              {product.category.name}
            </a>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={primaryImage?.url || "/placeholder-product.svg"}
              alt={primaryImage?.alt_text || product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {product.product_images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.product_images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer">
                  <Image src={img.url} alt={img.alt_text || ""} fill className="object-cover" sizes="100px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant={stock.color === "success" ? "default" : stock.color === "warning" ? "secondary" : "destructive"}>
              {stock.label}
            </Badge>
            {product.sku && <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>}
          </div>

          <PriceDisplay price={product.price} compareAtPrice={product.compare_at_price} size="lg" />

          {siteConfig.tax.included && (
            <p className="text-sm text-muted-foreground mt-1">
              Price includes {siteConfig.tax.label}
            </p>
          )}

          <Separator className="my-6" />

          {product.short_description && (
            <p className="text-muted-foreground mb-6">{product.short_description}</p>
          )}

          {/* Variants + Add to Cart (client component) */}
          <AddToCartSection product={product} />

          <Separator className="my-6" />

          {/* Tabs */}
          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
              {siteConfig.features.reviews && (
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews ({product.reviews?.filter((r) => r.is_approved).length || 0})
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="mt-4 prose prose-sm max-w-none">
              <p>{product.description || "No description available."}</p>
            </TabsContent>
            <TabsContent value="shipping" className="mt-4 text-sm text-muted-foreground space-y-2">
              <p>Free shipping on orders over {siteConfig.currencySymbol}{siteConfig.shipping.freeThreshold}.</p>
              {siteConfig.shipping.rates.map((rate) => (
                <p key={rate.region}>{rate.region}: {siteConfig.currencySymbol}{rate.fee}</p>
              ))}
            </TabsContent>
            {siteConfig.features.reviews && (
              <TabsContent value="reviews" className="mt-4">
                {product.reviews?.filter((r) => r.is_approved).length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {product.reviews?.filter((r) => r.is_approved).map((review) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{review.title || "Review"}</span>
                          <span className="text-sm text-muted-foreground">{"★".repeat(review.rating)}</span>
                        </div>
                        {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.filter((p) => p.id !== product.id).length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <ProductGrid products={relatedProducts.filter((p) => p.id !== product.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

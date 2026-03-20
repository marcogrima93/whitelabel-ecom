import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { getProductBySlug, getRelatedProducts } from "@/lib/supabase/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartSection } from "@/components/products/AddToCartSection";
import { ProductCard } from "@/components/products/ProductCard";
import { ShoppingBag } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | ${siteConfig.shopName}`,
      description: product.description.slice(0, 160),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.category, product.slug, 4);
  const categoryName =
    siteConfig.categories.find((c) => c.slug === product.category)?.name || product.category;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li>/</li>
          <li>
            <Link href={`/products?category=${product.category}`} className="hover:text-foreground transition-colors">
              {categoryName}
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium line-clamp-1">{product.name}</li>
        </ol>
      </nav>

      {/* Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden flex items-center justify-center">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/20" />
          </div>
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:ring-2 ring-primary transition-all"
                >
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/20" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-muted-foreground mb-6">{product.description}</p>
          <AddToCartSection product={product} />
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

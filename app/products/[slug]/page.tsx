import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { getProductBySlug, getRelatedProducts } from "@/lib/supabase/products";
import { getCategories } from "@/lib/supabase/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ProductFilter } from "@/lib/supabase/types";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductInteractiveSection } from "@/components/products/ProductInteractiveSection";

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

  const supabase = await createServiceRoleClient();

  const [product, categories, { data: rawProductFilters }] = await Promise.all([
    getProductBySlug(slug),
    getCategories(),
    supabase.from("product_filters").select("*").order("sort_order", { ascending: true }),
  ]);
  if (!product) notFound();

  const productFilters: ProductFilter[] = rawProductFilters ?? [];

  // Parse the product's filter_field JSON and resolve human-readable label/value pairs
  let parsedFilterField: Record<string, string> = {};
  try {
    parsedFilterField = JSON.parse(product.filter_field || "{}");
  } catch {
    parsedFilterField = {};
  }

  const filterBadges: { label: string; value: string }[] = Object.entries(parsedFilterField)
    .filter(([, value]) => Boolean(value))
    .map(([field, value]) => {
      const filter = productFilters.find((f) => f.field === field);
      return { label: filter?.label ?? field, value };
    });

  const relatedProducts = await getRelatedProducts(product.category, product.slug, 4);
  const categoryName =
    categories.find((c) => c.slug === product.category)?.name || product.category;

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
      <ProductInteractiveSection product={product} filterBadges={filterBadges} />

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

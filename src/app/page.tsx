import Link from "next/link";
import { Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/modules/ecom/components/ProductGrid";
import { CategoryGrid } from "@/modules/ecom/components/CategoryGrid";
import { getFeaturedProducts, getCategories } from "@/modules/ecom/lib/queries";
import { siteConfig } from "../../site.config";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  Shield,
  RotateCcw,
};

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {siteConfig.hero.headline}
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {siteConfig.hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={siteConfig.hero.primaryCta.href}>
              <Button size="lg" className="text-lg px-8">
                {siteConfig.hero.primaryCta.text}
              </Button>
            </Link>
            <Link href={siteConfig.hero.secondaryCta.href}>
              <Button size="lg" variant="outline" className="text-lg px-8">
                {siteConfig.hero.secondaryCta.text}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Shop by Category</h2>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {/* USPs */}
      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteConfig.usps.map((usp) => {
              const Icon = iconMap[usp.icon] || Shield;
              return (
                <div key={usp.title} className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{usp.title}</h3>
                  <p className="text-sm text-muted-foreground">{usp.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link href="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}
    </div>
  );
}

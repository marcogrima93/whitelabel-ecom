import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/site.config";
import { getFeaturedProducts } from "@/lib/supabase/products";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Zap,
  Shield,
  Truck,
  Sparkles,
  Star,
  ShoppingBag,
} from "lucide-react";

// Map icon names from config to Lucide components
const iconMap: Record<string, React.ElementType> = {
  Zap,
  Shield,
  Truck,
  Sparkles,
  Star,
  ShoppingBag,
};

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(4);

  return (
    <>
      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[560px] md:min-h-[680px] flex items-center">
        {/* Background image */}
        <Image
          src={siteConfig.hero.backgroundImage}
          alt="Hero background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay — dark image gets a dark scrim, light image gets a light scrim */}
        <div
          className={
            siteConfig.hero.theme === "dark"
              ? "absolute inset-0 bg-black/55"
              : "absolute inset-0 bg-white/60"
          }
        />

        <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1
              className={`text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance ${
                siteConfig.hero.theme === "dark" ? "text-white" : "text-foreground"
              }`}
            >
              {siteConfig.hero.headline}
            </h1>
            <p
              className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto text-pretty ${
                siteConfig.hero.theme === "dark" ? "text-white/80" : "text-foreground/70"
              }`}
            >
              {siteConfig.hero.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild variant={siteConfig.hero.theme === "dark" ? "default" : "default"}>
                <Link href={siteConfig.hero.primaryCta.href}>
                  {siteConfig.hero.primaryCta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {siteConfig.wholesale.enabled && (
                <Button
                  size="xl"
                  variant="outline"
                  className={
                    siteConfig.hero.theme === "dark"
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-foreground/30 text-foreground hover:bg-foreground/10"
                  }
                  asChild
                >
                  <Link href={siteConfig.hero.secondaryCta.href}>
                    {siteConfig.hero.secondaryCta.label}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Grid ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Shop by Category</h2>
          <p className="text-muted-foreground">Browse our curated collections</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {siteConfig.categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-xl aspect-square bg-gradient-to-br from-muted to-muted/50 flex items-end"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 group-hover:from-black/70 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-20 p-4 md:p-6 w-full">
                <h3 className="text-white font-bold text-lg md:text-xl">
                  {cat.name}
                </h3>
                <span className="text-white/70 text-sm flex items-center gap-1 mt-1 group-hover:text-white transition-colors">
                  Shop now <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── USP Strip ─────────────────────────────────────────────────── */}
      <section className="bg-secondary/30 border-y">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {siteConfig.usps.map((usp, i) => {
              const Icon = iconMap[usp.icon] || Sparkles;
              return (
                <div key={i} className="flex items-start gap-4 text-center md:text-left md:flex-row flex-col items-center md:items-start">
                  <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{usp.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {usp.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-1">Featured Products</h2>
            <p className="text-muted-foreground">Handpicked just for you</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/products">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                {/* Image placeholder */}
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {product.stock_status === "LOW_STOCK" && (
                    <Badge variant="warning" className="absolute top-3 left-3">
                      Low Stock
                    </Badge>
                  )}
                  {product.stock_status === "OUT_OF_STOCK" && (
                    <Badge variant="destructive" className="absolute top-3 left-3">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {product.filter_field}
                  </p>
                  <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="font-bold text-lg mt-2">
                    {formatPrice(
                      product.retail_price,
                      siteConfig.currency.code,
                      siteConfig.currency.locale
                    )}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      / {siteConfig.filters.unit}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      {siteConfig.wholesale.enabled && (
        <section className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Wholesale & Bulk Orders
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Get competitive wholesale pricing with volume discounts.
              Apply for a wholesale account today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                variant="secondary"
                asChild
              >
                <Link href="/wholesale">Learn More</Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/wholesale/quote">Request a Quote</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

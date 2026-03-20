import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/site.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  TrendingDown,
  Users,
  Truck,
  Shield,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Wholesale",
  description: `Apply for a wholesale account at ${siteConfig.shopName}. Get competitive pricing and volume discounts.`,
};

export default function WholesalePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Wholesale Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Wholesale & Bulk Orders
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Get access to competitive wholesale pricing, volume discounts, and
            dedicated account management. Perfect for businesses, restaurants,
            and retailers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild>
              <Link href="/register">
                Apply for Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/wholesale/quote">Request a Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Why Go Wholesale?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: TrendingDown,
              title: "Volume Discounts",
              desc: `Save up to ${((1 - (siteConfig.wholesale.tiers[siteConfig.wholesale.tiers.length - 1]?.multiplier || 0.9)) * 100).toFixed(0)}% with tiered wholesale pricing. The more you order, the more you save.`,
            },
            {
              icon: Users,
              title: "Dedicated Support",
              desc: "Get a dedicated account manager who understands your business needs and can help optimise your orders.",
            },
            {
              icon: Truck,
              title: "Flexible Delivery",
              desc: "Choose your preferred delivery schedule. We offer regular delivery slots to keep your business running smoothly.",
            },
          ].map((benefit, i) => (
            <Card key={i} className="text-center border-0 shadow-sm">
              <CardContent className="pt-8 pb-6">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="bg-secondary/30 border-y py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Pricing Tiers</h2>
          <div className="max-w-2xl mx-auto">
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="grid grid-cols-3 bg-muted p-4 text-sm font-semibold">
                <span>Tier</span>
                <span>Minimum Quantity</span>
                <span>Discount</span>
              </div>
              <div className="divide-y">
                <div className="grid grid-cols-3 p-4 text-sm">
                  <span>Base Wholesale</span>
                  <span>1 unit</span>
                  <span className="text-primary font-medium">Wholesale Price</span>
                </div>
                {siteConfig.wholesale.tiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-3 p-4 text-sm">
                    <span>{tier.label}</span>
                    <span>{tier.minQty}+ units</span>
                    <span className="text-primary font-medium">
                      {((1 - tier.multiplier) * 100).toFixed(0)}% off wholesale
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Minimum order value: {siteConfig.currency.symbol}
              {siteConfig.wholesale.minOrderValue}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { step: "1", title: "Apply", desc: "Create an account and select 'Wholesale Customer' during registration." },
            { step: "2", title: "Get Approved", desc: siteConfig.wholesale.pendingMessage },
            { step: "3", title: "Start Ordering", desc: "Once approved, you'll see wholesale pricing across all products. Place orders and enjoy volume discounts." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Apply for your wholesale account today or request a custom quote for your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="secondary" asChild>
              <Link href="/register">Apply Now</Link>
            </Button>
            <Button size="xl" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/wholesale/quote">Request a Quote</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { siteConfig } from "@/site.config";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FooterProps {
  categories?: { id: string; name: string; slug: string; }[];
}

export function Footer({ categories = [] }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/50 border-t" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Shop Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{siteConfig.shopName}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {siteConfig.shopDescription}
            </p>
            {siteConfig.contact.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{siteConfig.contact.address}</span>
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                    Shop All
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {siteConfig.wholesale.enabled && (
                  <li>
                    <Link href="/wholesale" className="text-muted-foreground hover:text-foreground transition-colors">
                      Wholesale
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          {/* Column 3: Contact & Social */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              {siteConfig.contact.email && (
                <li>
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {siteConfig.contact.email}
                  </a>
                </li>
              )}
              {siteConfig.contact.phone && (
                <li>
                  <a
                    href={`tel:${siteConfig.contact.phone}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {siteConfig.contact.phone}
                  </a>
                </li>
              )}
            </ul>

            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              {siteConfig.social.facebook && (
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {siteConfig.social.instagram && (
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {siteConfig.social.twitter && (
                <a
                  href={siteConfig.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {currentYear} {siteConfig.legal.companyName || siteConfig.shopName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

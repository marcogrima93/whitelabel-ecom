"use client";

import Link from "next/link";
import { Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchBar } from "@/modules/ecom/components/SearchBar";
import { CartDrawer } from "@/modules/ecom/components/CartDrawer";
import { siteConfig } from "../../../site.config";
import { useState } from "react";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/products?category=electronics", label: "Electronics" },
  { href: "/products?category=clothing", label: "Clothing" },
  { href: "/products?category=home-garden", label: "Home" },
  { href: "/products?category=accessories", label: "Accessories" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      {/* Announcement Bar */}
      {siteConfig.announcement && (
        <div className="bg-primary text-primary-foreground text-center text-sm py-2 px-4">
          {siteConfig.announcement}
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium hover:text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="font-bold text-xl flex-shrink-0">
            {siteConfig.shopName}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search (desktop) */}
          <div className="hidden lg:block flex-1 max-w-sm mx-4">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href="/account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <CartDrawer />
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

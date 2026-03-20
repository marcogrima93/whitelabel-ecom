"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/site.config";
import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();
  const itemCount = useCartStore((s) => s.getItemCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left">{siteConfig.shopName}</SheetTitle>
                </SheetHeader>
                <nav className="mt-6" aria-label="Mobile navigation">
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href="/"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                      >
                        Home
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/products"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                      >
                        Shop All
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                    {siteConfig.categories.map((cat) => (
                      <li key={cat.slug}>
                        <Link
                          href={`/products?category=${cat.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors pl-6"
                        >
                          {cat.name}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                    {siteConfig.wholesale.enabled && (
                      <li>
                        <Link
                          href="/wholesale"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                        >
                          Wholesale
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                      >
                        My Account
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
              {siteConfig.shopName}
            </Link>
          </div>

          {/* Centre: Desktop nav + Search */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-6">
                <li>
                  <Link href="/products" className="text-sm font-medium hover:text-primary/80 transition-colors">
                    Shop All
                  </Link>
                </li>
                {siteConfig.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className="text-sm font-medium hover:text-primary/80 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {siteConfig.wholesale.enabled && (
                  <li>
                    <Link href="/wholesale" className="text-sm font-medium hover:text-primary/80 transition-colors">
                      Wholesale
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          {/* Right: Search, Account, Cart */}
          <div className="flex items-center gap-1">
            {/* Search toggle */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 sm:w-60 h-9"
                  autoFocus
                  aria-label="Search products"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Account */}
            <Button variant="ghost" size="icon" asChild aria-label="Account">
              <Link href="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>

            {/* Cart */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-fade-in">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <CartDrawer onClose={() => setCartOpen(false)} />
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

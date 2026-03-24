"use client";

// Header component — logo uses <img> (not next/image) to avoid browser Image constructor conflict
import { useState, useRef, useEffect, useCallback } from "react";
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
  Package,
  LayoutDashboard,
} from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  retail_price: number;
  images: string[];
  stock_status: string;
}

interface HeaderProps {
  categories?: { id: string; name: string; slug: string; }[];
  isAdmin?: boolean;
}

export function Header({ categories = [], isAdmin = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val), 280);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  const closeSearch = () => {
    setSearchQuery("");
    setSearchOpen(false);
    setResults([]);
    setShowDropdown(false);
  };

  const handleResultClick = (slug: string) => {
    router.push(`/products/${slug}`);
    closeSearch();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-3">
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
                      <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors">
                        Home <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                    <li>
                      <Link href="/products" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors">
                        Shop All <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.slug}>
                        <Link href={`/products?category=${cat.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors pl-6">
                          {cat.name} <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    ))}
                    {siteConfig.wholesale.enabled && (
                      <li>
                        <Link href="/wholesale" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors">
                          Wholesale <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors">
                        My Account <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                    {isAdmin && (
                      <li>
                        <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium">
                          <span className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Admin Portal</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={siteConfig.logo}
                alt={siteConfig.shopName}
                width={140}
                height={40}
                className="h-9 w-auto object-contain"
              />
              {siteConfig.logoDisplay === "logo-and-name" && (
                <span className="font-bold text-lg tracking-tight hidden sm:block">
                  {siteConfig.shopName}
                </span>
              )}
            </Link>
          </div>

          {/* Centre: Desktop nav */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-6">
                <li>
                  <Link href="/products" className="text-sm font-medium hover:text-primary/80 transition-colors">
                    Shop All
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link href={`/products?category=${cat.slug}`} className="text-sm font-medium hover:text-primary/80 transition-colors">
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
            {searchOpen ? (
              <div ref={searchRef} className="relative">
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleQueryChange}
                    className="w-40 sm:w-64 h-9"
                    autoFocus
                    aria-label="Search products"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={closeSearch} aria-label="Close search">
                    <X className="h-4 w-4" />
                  </Button>
                </form>

                {/* Quick results dropdown */}
                {showDropdown && (
                  <div
                    role="listbox"
                    className="absolute top-full right-0 mt-1 w-72 bg-background border rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    {searching && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                        Searching...
                      </div>
                    )}
                    {!searching && results.map((item) => (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={false}
                        onClick={() => handleResultClick(item.slug)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-md bg-muted flex-shrink-0 overflow-hidden relative">
                          {item.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary flex-shrink-0">
                          {siteConfig.currency.symbol}{item.retail_price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) {
                          router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                          closeSearch();
                        }
                      }}
                      className="w-full px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors text-center border-t"
                    >
                      See all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Open search">
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Account */}
            <Button variant="ghost" size="icon" asChild aria-label="Account">
              <Link href="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>

            {/* Admin portal — only shown to admins */}
            {isAdmin && (
              <Button size="sm" asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 hidden sm:flex">
                <Link href="/admin">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin
                </Link>
              </Button>
            )}

            {/* Cart */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Shopping cart">
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
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

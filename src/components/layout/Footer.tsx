import Link from "next/link";
import { siteConfig } from "../../../site.config";

const quickLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/about", label: "About Us" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{siteConfig.description}</p>
            {siteConfig.contact.address && (
              <p className="text-sm text-muted-foreground">{siteConfig.contact.address}</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Contact</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {siteConfig.contact.email && (
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-foreground">
                  {siteConfig.contact.email}
                </a>
              )}
              {siteConfig.contact.phone && (
                <a href={`tel:${siteConfig.contact.phone}`} className="hover:text-foreground">
                  {siteConfig.contact.phone}
                </a>
              )}
              <div className="flex gap-4 mt-4">
                {siteConfig.social.instagram && (
                  <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Instagram</a>
                )}
                {siteConfig.social.facebook && (
                  <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Facebook</a>
                )}
                {siteConfig.social.twitter && (
                  <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Twitter</a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

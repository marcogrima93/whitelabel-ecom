import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/site.config";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: siteConfig.shopName,
    template: `%s | ${siteConfig.shopName}`,
  },
  description: siteConfig.shopDescription,
  keywords: ["ecommerce", "shop", "online store", siteConfig.shopName],
  openGraph: {
    title: siteConfig.shopName,
    description: siteConfig.shopDescription,
    url: siteConfig.shopUrl,
    siteName: siteConfig.shopName,
    type: "website",
    locale: siteConfig.locale,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={siteConfig.locale.split("-")[0]} className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AnnouncementBar />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <CookieConsent />
      </body>
    </html>
  );
}

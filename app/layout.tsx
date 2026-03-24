import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { siteConfig } from "@/site.config";
import { getCategories } from "@/lib/supabase/queries";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  // Check if the current user is an admin for the header button
  let isAdmin = false;
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (user) {
      const serviceClient = await createServiceRoleClient();
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "ADMIN";
    }
  } catch {
    // Not logged in or profile not found — isAdmin stays false
  }

  return (
    <html lang={siteConfig.locale.split("-")[0]} className={inter.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AnnouncementBar />
        <Header categories={categories} isAdmin={isAdmin} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer categories={categories} />
        <WhatsAppButton />
        <CookieConsent />
      </body>
    </html>
  );
}

import { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.shopUrl;

  // Static routes
  const staticRoutes = [
    "",
    "/products",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/terms",
    "/privacy-policy",
    "/cookie-policy",
  ];

  // Conditionally add wholesale routes
  if (siteConfig.wholesale.enabled) {
    staticRoutes.push("/wholesale", "/wholesale/quote");
  }

  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic products — use service role client (no cookies) so sitemap stays static
  let productsMap: MetadataRoute.Sitemap = [];
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("is_archived", false);

      if (data) {
        productsMap = data.map((product: { slug: string; updated_at: string }) => ({
          url: `${baseUrl}/products/${product.slug}`,
          lastModified: new Date(product.updated_at || new Date()),
          changeFrequency: "daily" as const,
          priority: 0.9,
        }));
      }
    }
  } catch (error) {
    console.warn("Could not generate sitemap for products, falling back to static only", error);
  }

  return [...routes, ...productsMap];
}

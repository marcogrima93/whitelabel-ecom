import { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";
import { getProducts } from "@/lib/supabase/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.shopUrl;

  // Static routes
  const routes = [
    "",
    "/products",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/wholesale",
    "/wholesale/quote",
    "/terms",
    "/privacy-policy",
    "/cookie-policy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Dynamic products
  let productsMap: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productsMap = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: new Date(product.updated_at || new Date()),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.warn("Could not generate sitemap for products, falling back to static only", error);
  }

  return [...routes, ...productsMap];
}

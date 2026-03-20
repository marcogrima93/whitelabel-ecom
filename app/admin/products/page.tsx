import { getProducts } from "@/lib/supabase/products";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const products = await getProducts();
  
  return <AdminProductsClient initialProducts={products} />;
}

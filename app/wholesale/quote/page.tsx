import { getCategories } from "@/lib/supabase/queries";
import QuoteClient from "./QuoteClient";

export default async function QuotePage() {
  const categories = await getCategories();
  return <QuoteClient categories={categories} />;
}

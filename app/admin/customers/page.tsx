import { getCustomers } from "@/lib/supabase/queries";
import { siteConfig } from "@/site.config";
import AdminCustomersClient from "./AdminCustomersClient";

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  const formattedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name || "Unknown",
    email: c.email,
    role: c.role,
    wholesaleApproved: c.wholesale_approved,
    businessName: c.business_name,
    orders: c.orderCount || 0,
    joined: new Date(c.created_at).toLocaleDateString("en-GB"),
  }));

  return <AdminCustomersClient initialCustomers={formattedCustomers} showWholesale={siteConfig.wholesale.enabled} />;
}

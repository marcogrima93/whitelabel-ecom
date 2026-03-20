import { getOrders } from "@/lib/supabase/queries";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import AdminOrdersClient from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    email: order.email,
    deliveryMethod: order.delivery_method,
    date: new Date(order.created_at).toLocaleDateString("en-GB"),
    total: Number(order.total),
    status: order.status,
  }));

  return <AdminOrdersClient initialOrders={formattedOrders} />;
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/modules/ecom/lib/queries";
import { formatPrice } from "@/modules/ecom/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const order = await getOrderById(params.id);
  if (!order || order.user_id !== user.id) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Order {order.order_number}</h2>
        <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium mb-2">Order Details</h3>
          <p className="text-sm">Date: {new Date(order.created_at).toLocaleDateString()}</p>
          <p className="text-sm">Payment: <Badge variant="outline">{order.payment_status}</Badge></p>
          <p className="text-sm">Email: {order.email}</p>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-medium mb-2">Summary</h3>
          <div className="text-sm flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="text-sm flex justify-between"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
          <div className="text-sm flex justify-between"><span>Shipping</span><span>{formatPrice(order.shipping_cost)}</span></div>
          {order.discount > 0 && <div className="text-sm flex justify-between"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
          <Separator />
          <div className="font-semibold flex justify-between"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      <h3 className="font-medium mt-8 mb-4">Items</h3>
      <div className="border rounded-lg divide-y">
        {order.order_items?.map((item) => (
          <div key={item.id} className="p-4 flex justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              {item.sku && <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>}
              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
            </div>
            <p className="font-medium">{formatPrice(item.total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

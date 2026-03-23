import { notFound } from "next/navigation";
import { getOrderById } from "@/modules/ecom/lib/queries";
import { formatPrice } from "@/modules/ecom/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
        <div className="flex gap-2">
          <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>{order.payment_status}</Badge>
          <Badge variant="outline">{order.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Customer</h3>
          <p className="text-sm">{order.email}</p>
          <p className="text-sm text-muted-foreground">Placed on {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Payment</h3>
          <p className="text-sm">Subtotal: {formatPrice(order.subtotal)}</p>
          <p className="text-sm">Tax: {formatPrice(order.tax)}</p>
          <p className="text-sm">Shipping: {formatPrice(order.shipping_cost)}</p>
          <Separator className="my-2" />
          <p className="font-semibold">Total: {formatPrice(order.total)}</p>
        </div>
      </div>

      <h3 className="font-medium mb-4">Items</h3>
      <div className="border rounded-lg divide-y">
        {order.order_items?.map((item) => (
          <div key={item.id} className="p-4 flex justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity} &middot; {formatPrice(item.price)} each</p>
            </div>
            <p className="font-medium">{formatPrice(item.total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

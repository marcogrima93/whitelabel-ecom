import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Eye } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserOrders } from "@/lib/supabase/queries";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { redirect } from "next/navigation";

const statusVariant = (status: string) => {
  switch (status) {
    case "DELIVERED": return "success" as const;
    case "DISPATCHED": return "default" as const;
    case "CONFIRMED": return "secondary" as const;
    case "PENDING": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "outline" as const;
  }
};

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login?redirect=/account/orders");
  }

  const orders = await getUserOrders(user.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-4 font-semibold">Order #</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Items</th>
                  <th className="text-left p-4 font-semibold">Total</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono font-medium">{order.order_number}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4">{order.items?.length || 0}</td>
                    <td className="p-4 font-medium">
                      {formatPrice(Number(order.total), siteConfig.currency.code, siteConfig.currency.locale)}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

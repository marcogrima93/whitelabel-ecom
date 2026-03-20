import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Eye } from "lucide-react";

// Mock orders for demo
const mockOrders = [
  { id: "ORD-001", date: "2024-01-15", items: 3, total: 89.97, status: "DELIVERED" },
  { id: "ORD-002", date: "2024-01-28", items: 1, total: 34.99, status: "DISPATCHED" },
  { id: "ORD-003", date: "2024-02-10", items: 5, total: 199.95, status: "PENDING" },
];

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

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Orders</h2>

      {mockOrders.length === 0 ? (
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
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono font-medium">{order.id}</td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4">{order.items}</td>
                    <td className="p-4 font-medium">€{order.total.toFixed(2)}</td>
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

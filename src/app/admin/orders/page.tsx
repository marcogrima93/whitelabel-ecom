import Link from "next/link";
import { getAllOrders } from "@/modules/ecom/lib/queries";
import { formatPrice } from "@/modules/ecom/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{order.email}</TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{formatPrice(order.total)}</TableCell>
              <TableCell><Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>{order.payment_status}</Badge></TableCell>
              <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
              <TableCell>
                <Link href={`/admin/orders/${order.id}`}>
                  <Button variant="ghost" size="sm">View</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

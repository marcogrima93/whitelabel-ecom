import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

// Mock KPI data
const kpis = [
  { label: "Today's Orders", value: "12", icon: ShoppingCart, change: "+3 from yesterday", color: "text-blue-600" },
  { label: "Pending Orders", value: "5", icon: Package, change: "Needs attention", color: "text-amber-600" },
  { label: "Monthly Revenue", value: "€4,280", icon: DollarSign, change: "+12% vs last month", color: "text-emerald-600" },
  { label: "New Customers", value: "28", icon: Users, change: "This month", color: "text-violet-600" },
];

// Mock recent orders
const recentOrders = [
  { id: "ORD-103", customer: "Maria Borg", type: "Retail", date: "Today, 14:30", total: 67.50, status: "PENDING" },
  { id: "ORD-102", customer: "Joe Camilleri", type: "Wholesale", date: "Today, 11:15", total: 245.00, status: "CONFIRMED" },
  { id: "ORD-101", customer: "Anna Vella", type: "Retail", date: "Yesterday", total: 34.99, status: "DISPATCHED" },
  { id: "ORD-100", customer: "Mark Farrugia", type: "Retail", date: "Yesterday", total: 89.97, status: "DELIVERED" },
  { id: "ORD-099", customer: "Lisa Grech", type: "Wholesale", date: "2 days ago", total: 520.00, status: "DELIVERED" },
];

const statusVariant = (status: string) => {
  switch (status) {
    case "DELIVERED": return "success" as const;
    case "DISPATCHED": return "default" as const;
    case "CONFIRMED": return "secondary" as const;
    case "PENDING": return "warning" as const;
    default: return "outline" as const;
  }
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {kpi.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 font-semibold">Order</th>
                  <th className="text-left pb-3 font-semibold">Customer</th>
                  <th className="text-left pb-3 font-semibold">Type</th>
                  <th className="text-left pb-3 font-semibold">Date</th>
                  <th className="text-left pb-3 font-semibold">Total</th>
                  <th className="text-left pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-mono font-medium">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3">
                      <Badge variant={order.type === "Wholesale" ? "default" : "outline"}>
                        {order.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{order.date}</td>
                    <td className="py-3 font-medium">€{order.total.toFixed(2)}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

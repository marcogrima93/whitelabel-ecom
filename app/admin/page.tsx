import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { getDashboardStats, getOrders } from "@/lib/supabase/queries";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Inbox,
} from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "DELIVERED": return "success" as const;
    case "PENDING": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "outline" as const;
  }
};

function getStatusLabel(status: string, deliveryMethod: string): string {
  if (status === "DELIVERED") {
    return deliveryMethod === "COLLECTION" ? "Collected" : "Delivered";
  }
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getOrders({ limit: 5 }),
  ]);

  const kpis = [
    { 
      label: "Today's Orders", 
      value: stats.todayOrders.toString(), 
      icon: ShoppingCart, 
      change: "Orders placed today", 
      color: "text-blue-600" 
    },
    { 
      label: "Pending Orders", 
      value: stats.pendingOrders.toString(), 
      icon: Package, 
      change: stats.pendingOrders > 0 ? "Needs attention" : "All clear", 
      color: stats.pendingOrders > 0 ? "text-amber-600" : "text-emerald-600" 
    },
    { 
      label: "Monthly Revenue", 
      value: formatPrice(stats.monthlyRevenue, siteConfig.currency.code, siteConfig.currency.locale), 
      icon: DollarSign, 
      change: "This month", 
      color: "text-emerald-600" 
    },
    { 
      label: "New Customers", 
      value: stats.newCustomers.toString(), 
      icon: Users, 
      change: "This month", 
      color: "text-violet-600" 
    },
  ];

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
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Orders will appear here once customers start purchasing.
              </p>
            </div>
          ) : (
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
                      <td className="py-3 font-mono font-medium">{order.order_number}</td>
                      <td className="py-3">{order.email}</td>
                      <td className="py-3">
                        <Badge variant={order.delivery_method === "COLLECTION" ? "secondary" : "outline"}>
                          {order.delivery_method}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatRelativeDate(order.created_at)}</td>
                      <td className="py-3 font-medium">
                        {formatPrice(Number(order.total), siteConfig.currency.code, siteConfig.currency.locale)}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant(order.status)}>
                          {getStatusLabel(order.status, order.delivery_method)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

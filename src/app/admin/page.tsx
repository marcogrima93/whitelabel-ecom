import { getAdminStats } from "@/modules/ecom/lib/queries";
import { formatPrice } from "@/modules/ecom/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, DollarSign, Users } from "lucide-react";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const kpis = [
    { title: "Orders Today", value: stats.ordersToday.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { title: "Pending Orders", value: stats.pendingOrders.toString(), icon: Clock, color: "text-amber-600" },
    { title: "Total Revenue", value: formatPrice(stats.monthlyRevenue), icon: DollarSign, color: "text-green-600" },
    { title: "Total Customers", value: stats.totalCustomers.toString(), icon: Users, color: "text-purple-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

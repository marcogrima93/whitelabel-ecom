"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockOrders = [
  { id: "ORD-103", customer: "Maria Borg", email: "maria@example.com", type: "Retail", date: "2024-02-15", total: 67.50, status: "PENDING" },
  { id: "ORD-102", customer: "Joe Camilleri", email: "joe@example.com", type: "Wholesale", date: "2024-02-15", total: 245.00, status: "CONFIRMED" },
  { id: "ORD-101", customer: "Anna Vella", email: "anna@example.com", type: "Retail", date: "2024-02-14", total: 34.99, status: "DISPATCHED" },
  { id: "ORD-100", customer: "Mark Farrugia", email: "mark@example.com", type: "Retail", date: "2024-02-14", total: 89.97, status: "DELIVERED" },
  { id: "ORD-099", customer: "Lisa Grech", email: "lisa@example.com", type: "Wholesale", date: "2024-02-13", total: 520.00, status: "DELIVERED" },
  { id: "ORD-098", customer: "David Zammit", email: "david@example.com", type: "Retail", date: "2024-02-13", total: 44.99, status: "CANCELLED" },
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

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockOrders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">{filtered.length} orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="DISPATCHED">Dispatched</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Order #</th>
                  <th className="text-left p-4 font-semibold">Customer</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Total</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono font-medium">{order.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={order.type === "Wholesale" ? "default" : "outline"}>{order.type}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4 font-medium">€{order.total.toFixed(2)}</td>
                    <td className="p-4">
                      <Select defaultValue={order.status}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
        </CardContent>
      </Card>
    </div>
  );
}

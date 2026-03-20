"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Users } from "lucide-react";

const mockCustomers = [
  { id: "1", name: "Maria Borg", email: "maria@example.com", role: "RETAIL", wholesaleApproved: false, orders: 5, joined: "2024-01-15" },
  { id: "2", name: "Joe Camilleri", email: "joe@business.com", role: "WHOLESALE", wholesaleApproved: true, business: "Joe's Restaurant", orders: 12, joined: "2024-01-10" },
  { id: "3", name: "Anna Vella", email: "anna@example.com", role: "RETAIL", wholesaleApproved: false, orders: 3, joined: "2024-02-01" },
  { id: "4", name: "Mark Farrugia", email: "mark@catering.com", role: "WHOLESALE", wholesaleApproved: false, business: "Mark's Catering", orders: 0, joined: "2024-02-10" },
  { id: "5", name: "Lisa Grech", email: "lisa@hotel.com", role: "WHOLESALE", wholesaleApproved: true, business: "Grech Hotel", orders: 8, joined: "2024-01-20" },
];

export default function AdminCustomersPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockCustomers.filter((c) => {
    const matchRole = roleFilter === "all" || c.role === roleFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const pendingWholesale = mockCustomers.filter(
    (c) => c.role === "WHOLESALE" && !c.wholesaleApproved
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">{filtered.length} customers</p>
      </div>

      {/* Pending wholesale alert */}
      {pendingWholesale.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {pendingWholesale.length} wholesale application{pendingWholesale.length > 1 ? "s" : ""} pending approval
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="RETAIL">Retail</SelectItem>
            <SelectItem value="WHOLESALE">Wholesale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold">Customer</th>
                  <th className="text-left p-4 font-semibold">Role</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Orders</th>
                  <th className="text-left p-4 font-semibold">Joined</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      customer.role === "WHOLESALE" && !customer.wholesaleApproved
                        ? "bg-amber-50/50"
                        : ""
                    }`}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                        {(customer as any).business && (
                          <p className="text-xs text-primary">{(customer as any).business}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={customer.role === "WHOLESALE" ? "default" : "outline"}>
                        {customer.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {customer.role === "WHOLESALE" ? (
                        customer.wholesaleApproved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </td>
                    <td className="p-4">{customer.orders}</td>
                    <td className="p-4 text-muted-foreground">{customer.joined}</td>
                    <td className="p-4 text-right">
                      {customer.role === "WHOLESALE" && !customer.wholesaleApproved ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="default" className="h-8">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8">
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm">View</Button>
                      )}
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

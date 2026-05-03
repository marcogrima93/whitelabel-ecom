"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Users, Inbox, Loader2, Mail, Phone, Calendar, Package } from "lucide-react";
import { approveWholesaleAction, rejectWholesaleAction, getCustomerDetailAction } from "./actions";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import type { Profile, Order, OrderItem } from "@/lib/supabase/types";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  role: "RETAIL" | "WHOLESALE" | "ADMIN";
  wholesaleApproved: boolean;
  businessName: string | null;
  orders: number;
  joined: string;
}

export default function AdminCustomersClient({ 
  initialCustomers,
  showWholesale 
}: { 
  initialCustomers: CustomerRow[];
  showWholesale: boolean;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Customer detail modal
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{ profile: Profile; orders: (Order & { items?: OrderItem[] })[] } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewCustomer = async (customerId: string) => {
    setViewingId(customerId);
    const detail = await getCustomerDetailAction(customerId);
    setCustomerDetail(detail);
    setDetailOpen(true);
    setViewingId(null);
  };

  const filtered = customers.filter((c) => {
    const matchRole = roleFilter === "all" || c.role === roleFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const pendingWholesale = customers.filter(
    (c) => c.role === "WHOLESALE" && !c.wholesaleApproved
  );

  const handleApprove = async (customerId: string) => {
    setProcessingId(customerId);
    startTransition(async () => {
      const success = await approveWholesaleAction(customerId);
      if (success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, wholesaleApproved: true } : c))
        );
      }
      setProcessingId(null);
    });
  };

  const handleReject = async (customerId: string) => {
    if (!confirm("Are you sure you want to reject this wholesale application? The customer will be converted to retail.")) return;
    
    setProcessingId(customerId);
    startTransition(async () => {
      const success = await rejectWholesaleAction(customerId);
      if (success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customerId ? { ...c, role: "RETAIL" as const, wholesaleApproved: false } : c))
        );
      }
      setProcessingId(null);
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-muted-foreground">{filtered.length} customers</p>
      </div>

      {/* Pending wholesale alert */}
      {showWholesale && pendingWholesale.length > 0 && (
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
            {showWholesale && <SelectItem value="WHOLESALE">Wholesale</SelectItem>}
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {customers.length === 0
                  ? "Customers will appear here once they register."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Role</th>
                    {showWholesale && <th className="text-left p-4 font-semibold">Status</th>}
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
                        showWholesale && customer.role === "WHOLESALE" && !customer.wholesaleApproved
                          ? "bg-amber-50/50"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                          {customer.businessName && (
                            <p className="text-xs text-primary">{customer.businessName}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={customer.role === "WHOLESALE" ? "default" : customer.role === "ADMIN" ? "destructive" : "outline"}>
                          {customer.role}
                        </Badge>
                      </td>
                      {showWholesale && (
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
                      )}
                      <td className="p-4">{customer.orders}</td>
                      <td className="p-4 text-muted-foreground">{customer.joined}</td>
                      <td className="p-4 text-right">
                        {showWholesale && customer.role === "WHOLESALE" && !customer.wholesaleApproved ? (
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-8"
                              onClick={() => handleApprove(customer.id)}
                              disabled={processingId === customer.id}
                            >
                              {processingId === customer.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8"
                              onClick={() => handleReject(customer.id)}
                              disabled={processingId === customer.id}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomer(customer.id)}
                            disabled={viewingId === customer.id}
                          >
                            {viewingId === customer.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "View"
                            )}
                          </Button>
                        )}
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

      {/* Customer detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          {customerDetail && (
            <>
              <DialogHeader>
                <DialogTitle>{customerDetail.profile.name || "Customer"}</DialogTitle>
                <DialogDescription>Customer account details and order history.</DialogDescription>
              </DialogHeader>

              {/* Profile info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{customerDetail.profile.email}</span>
                </div>
                {customerDetail.profile.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{customerDetail.profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Joined {new Date(customerDetail.profile.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={customerDetail.profile.role === "WHOLESALE" ? "default" : customerDetail.profile.role === "ADMIN" ? "destructive" : "outline"}>
                    {customerDetail.profile.role}
                  </Badge>
                  {customerDetail.profile.wholesale_approved && (
                    <Badge variant="success">Approved</Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Order history */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Package className="h-4 w-4" /> Orders ({customerDetail.orders.length})
                </h4>
                {customerDetail.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {customerDetail.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div>
                          <span className="font-mono font-medium">{order.order_number}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(order.created_at).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatPrice(Number(order.total), siteConfig.currency.code, siteConfig.currency.locale)}
                          </span>
                          <Badge variant={
                            order.status === "DELIVERED" || order.status === "COLLECTED" ? "success" :
                            order.status === "CANCELLED" ? "destructive" :
                            order.status === "PENDING" ? "warning" :
                            order.status === "PAYMENT_PENDING" ? "secondary" : "outline"
                          }>
                            {order.status === "PAYMENT_PENDING" ? "Payment Pending" :
                             order.status === "PENDING" ? "Paid" :
                             order.status === "OUT_FOR_DELIVERY" ? "Out for Delivery" :
                             order.status === "READY_FOR_COLLECTION" ? "Ready for Collection" :
                             order.status === "DELIVERED" ? "Delivered" :
                             order.status === "COLLECTED" ? "Collected" :
                             order.status === "CANCELLED" ? "Cancelled" : order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  Search,
  Inbox,
  Loader2,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  FileText,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatusAction, getOrderDetailAction, resendOrderEmailAction } from "./actions";
import type { Order, OrderItem, DeliveryMethod } from "@/lib/supabase/types";

type OrderStatus = "PENDING" | "DELIVERED" | "CANCELLED";

interface OrderRow {
  id: string;
  orderNumber: string;
  email: string;
  deliveryMethod: string;
  date: string;
  total: number;
  status: OrderStatus;
}

// Returns the correct completed-status label based on fulfilment method
function getStatusLabel(status: OrderStatus, deliveryMethod: string): string {
  if (status === "DELIVERED") {
    return deliveryMethod === "COLLECTION" ? "Collected" : "Delivered";
  }
  if (status === "PENDING") return "Pending";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

const statusVariant = (status: OrderStatus) => {
  switch (status) {
    case "DELIVERED": return "success" as const;
    case "PENDING": return "warning" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "outline" as const;
  }
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Cancellation reason modal
  const [cancelTarget, setCancelTarget] = useState<{ id: string; currentRow: OrderRow } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelPending, startCancelTransition] = useTransition();

  // Resend email state
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ id: string; ok: boolean } | null>(null);

  const { code, locale } = siteConfig.currency;

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Status change ──────────────────────────────────────────────────────────

  const handleStatusChange = (orderId: string, newStatus: OrderStatus, deliveryMethod: string) => {
    if (newStatus === "CANCELLED") {
      const row = orders.find((o) => o.id === orderId);
      if (row) {
        setCancelTarget({ id: orderId, currentRow: row });
        setCancelReason("");
      }
      return;
    }
    applyStatusChange(orderId, newStatus);
  };

  const applyStatusChange = (orderId: string, newStatus: OrderStatus, reason?: string) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const success = await updateOrderStatusAction(orderId, newStatus, reason);
      if (success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
        }
      }
      setUpdatingId(null);
    });
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    startCancelTransition(async () => {
      const success = await updateOrderStatusAction(cancelTarget.id, "CANCELLED", cancelReason.trim());
      if (success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: "CANCELLED" } : o))
        );
        if (selectedOrder?.id === cancelTarget.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
        }
      }
      setCancelTarget(null);
      setCancelReason("");
    });
  };

  // ── View detail ────────────────────────────────────────────────────────────

  const handleViewOrder = async (orderId: string) => {
    setLoadingOrderId(orderId);
    const detail = await getOrderDetailAction(orderId);
    setLoadingOrderId(null);
    if (detail) {
      setSelectedOrder(detail);
      setDialogOpen(true);
      setResendResult(null);
    }
  };

  // ── Resend email ───────────────────────────────────────────────────────────

  const handleResendEmail = async (orderId: string) => {
    setResendingId(orderId);
    setResendResult(null);
    const ok = await resendOrderEmailAction(orderId);
    setResendingId(null);
    setResendResult({ id: orderId, ok });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">{filtered.length} orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="DELIVERED">Delivered / Collected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {orders.length === 0
                  ? "Orders will appear here once customers start purchasing."
                  : "Try adjusting your search or filter."}
              </p>
            </div>
          ) : (
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
                      <td className="p-4 font-mono font-medium">{order.orderNumber}</td>
                      <td className="p-4">
                        {(() => {
                          const isGuest = order.email.endsWith(" (guest)");
                          const displayEmail = isGuest
                            ? order.email.replace(/ \(guest\)$/, "")
                            : order.email;
                          return (
                            <div className="flex flex-col gap-0.5">
                              <p className="text-sm text-muted-foreground">{displayEmail}</p>
                              {isGuest && (
                                <span className="inline-flex items-center w-fit text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  guest
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <Badge variant={order.deliveryMethod === "COLLECTION" ? "secondary" : "outline"}>
                          {order.deliveryMethod}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{order.date}</td>
                      <td className="p-4 font-medium">
                        {formatPrice(order.total, code, locale)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(order.status)}>
                            {getStatusLabel(order.status, order.deliveryMethod)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              handleStatusChange(order.id, v as OrderStatus, order.deliveryMethod)
                            }
                            disabled={updatingId === order.id}
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="DELIVERED">
                                {order.deliveryMethod === "COLLECTION" ? "Collected" : "Delivered"}
                              </SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          {updatingId === order.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order.id)}
                            disabled={loadingOrderId === order.id}
                          >
                            {loadingOrderId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" /> View
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Cancellation Reason Modal ── */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling order{" "}
              <span className="font-mono font-semibold">
                {cancelTarget?.currentRow.orderNumber}
              </span>
              . This will be included in the cancellation email sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Item out of stock, payment issue, customer requested cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            {cancelReason.trim().length === 0 && (
              <p className="text-xs text-destructive">A cancellation reason is required.</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
              disabled={cancelPending}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || cancelPending}
            >
              {cancelPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Order Detail Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg">
              Order {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Placed on{" "}
              {selectedOrder &&
                new Date(selectedOrder.created_at).toLocaleDateString("en-GB", {
                  dateStyle: "long",
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-2">
              {/* Status + badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={statusVariant(selectedOrder.status as OrderStatus)}
                  className="text-sm px-3 py-1"
                >
                  {getStatusLabel(
                    selectedOrder.status as OrderStatus,
                    selectedOrder.delivery_method
                  )}
                </Badge>
                <Badge
                  variant={
                    selectedOrder.delivery_method === "COLLECTION" ? "secondary" : "outline"
                  }
                >
                  {selectedOrder.delivery_method}
                </Badge>
                {selectedOrder.stripe_payment_intent_id ? (
                  <Badge variant="outline" className="gap-1">
                    <CreditCard className="h-3 w-3" /> Card
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Banknote className="h-3 w-3" /> Cash
                  </Badge>
                )}
              </div>

              {/* Customer */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>
                  <p className="text-sm font-medium">{selectedOrder.email}</p>
                </div>
                {selectedOrder.delivery_slot && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Delivery Slot
                    </p>
                    <p className="text-sm">{selectedOrder.delivery_slot}</p>
                  </div>
                )}
              </div>

              {/* Delivery address */}
              {selectedOrder.delivery_method === "DELIVERY" &&
                selectedOrder.delivery_address && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Delivery Address
                    </p>
                    <div className="text-sm bg-muted/50 rounded-lg p-3 space-y-0.5">
                      {Object.entries(selectedOrder.delivery_address)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <p key={k}>{String(v)}</p>
                        ))}
                    </div>
                  </div>
                )}

              {/* Notes / cancellation reason */}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Order Notes
                </p>
                {selectedOrder.notes ? (
                  <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                    {selectedOrder.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No notes</p>
                )}
              </div>

              <Separator />

              {/* Order items */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Items ({selectedOrder.items.length})
                </p>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0 relative">
                      {item.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      {item.selected_option && (
                        <p className="text-xs text-muted-foreground">{item.selected_option}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">
                        {formatPrice(item.price_per_unit * item.quantity, code, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatPrice(item.price_per_unit, code, locale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(Number(selectedOrder.subtotal), code, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VAT ({(siteConfig.vatRate * 100).toFixed(0)}%
                    {siteConfig.vatIncluded ? " incl." : ""})
                  </span>
                  <span>{formatPrice(Number(selectedOrder.vat_amount), code, locale)}</span>
                </div>
                {Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{formatPrice(Number(selectedOrder.delivery_fee), code, locale)}</span>
                  </div>
                )}
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount
                      {selectedOrder.discount_code ? ` (${selectedOrder.discount_code})` : ""}
                    </span>
                    <span>
                      -{formatPrice(Number(selectedOrder.discount_amount), code, locale)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatPrice(Number(selectedOrder.total), code, locale)}</span>
                </div>
              </div>

              {/* Status updater + resend */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground shrink-0">Update status:</p>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(v) =>
                    handleStatusChange(
                      selectedOrder.id,
                      v as OrderStatus,
                      selectedOrder.delivery_method
                    )
                  }
                  disabled={!!updatingId}
                >
                  <SelectTrigger className="h-9 flex-1 min-w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="DELIVERED">
                      {selectedOrder.delivery_method === "COLLECTION" ? "Collected" : "Delivered"}
                    </SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {updatingId === selectedOrder.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => handleResendEmail(selectedOrder.id)}
                  disabled={resendingId === selectedOrder.id}
                  title="Re-send the email for this order's current status"
                >
                  {resendingId === selectedOrder.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Resend Email
                </Button>
              </div>

              {/* Resend feedback */}
              {resendResult?.id === selectedOrder.id && (
                <p
                  className={`text-xs ${
                    resendResult.ok ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {resendResult.ok
                    ? "Email sent successfully."
                    : "Failed to send email. Check server logs."}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

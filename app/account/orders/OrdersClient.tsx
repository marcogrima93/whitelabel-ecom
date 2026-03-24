"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Package, Eye, Loader2, MapPin, Calendar, CreditCard } from "lucide-react";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/supabase/types";

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

function fmt(val: number) {
  return formatPrice(val, siteConfig.currency.code, siteConfig.currency.locale);
}

interface OrdersClientProps {
  orders: (Order & { items?: OrderItem[] })[];
}

export default function OrdersClient({ orders }: OrdersClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleView = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/account/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
        setOpen(true);
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">{"You haven't placed any orders yet."}</p>
        <Button className="mt-4" asChild>
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
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
                  <td className="p-4 font-medium">{fmt(Number(order.total))}</td>
                  <td className="p-4">
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(order.id)}
                      disabled={loadingId === order.id}
                    >
                      {loadingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" /> View</>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>Order #{selectedOrder.order_number}</span>
                  <Badge variant={statusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </DialogHeader>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Items</h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-12 w-12 rounded object-cover border shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      {item.selected_option && (
                        <p className="text-xs text-muted-foreground">{item.selected_option}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{fmt(item.price_per_unit * item.quantity)}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Price breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt(Number(selectedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VAT ({(siteConfig.vatRate * 100).toFixed(0)}%{siteConfig.vatIncluded ? " incl." : ""})
                  </span>
                  <span>{fmt(Number(selectedOrder.vat_amount))}</span>
                </div>
                {Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>{fmt(Number(selectedOrder.delivery_fee))}</span>
                  </div>
                )}
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount {selectedOrder.discount_code ? `(${selectedOrder.discount_code})` : ""}</span>
                    <span>-{fmt(Number(selectedOrder.discount_amount))}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{fmt(Number(selectedOrder.total))}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                    <MapPin className="h-3.5 w-3.5" /> Fulfilment
                  </div>
                  <p className="font-medium">{selectedOrder.delivery_method === "DELIVERY" ? "Delivery" : "Collection"}</p>
                  {selectedOrder.delivery_address && (
                    <p className="text-muted-foreground leading-relaxed">
                      {Object.values(selectedOrder.delivery_address).filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {selectedOrder.delivery_slot && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                      <Calendar className="h-3.5 w-3.5" /> Slot
                    </div>
                    <p className="text-muted-foreground">{selectedOrder.delivery_slot}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                    <CreditCard className="h-3.5 w-3.5" /> Payment
                  </div>
                  <p className="text-muted-foreground">
                    {selectedOrder.stripe_payment_intent_id ? "Card (Stripe)" : "Cash"}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

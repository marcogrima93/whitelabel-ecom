"use server";

import { getOrders } from "@/lib/supabase/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function exportAllOrdersToCSV(): Promise<string> {
  const supabase = await createServiceRoleClient();
  
  // Fetch all orders with items
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(*)
    `)
    .order("created_at", { ascending: false });

  if (error || !orders) {
    throw new Error("Failed to fetch orders");
  }

  // CSV headers
  const headers = [
    "Order ID",
    "Order Number",
    "Customer Name",
    "Customer Email",
    "Order Date",
    "Items Ordered",
    "Total Value",
    "Subtotal",
    "VAT Amount",
    "Delivery Fee",
    "Discount Amount",
    "Fulfilment Method",
    "Delivery Slot",
    "Delivery Address",
    "Payment Method",
    "Order Status",
    "Discount Code",
    "Notes",
    "Stripe Payment Intent ID",
    "User ID",
  ];

  // Build CSV rows
  const rows = orders.map((order) => {
    // Format items as "Product Name (Option) x Qty, ..."
    const itemsText = (order.items || [])
      .map((item: any) => 
        `${item.product_name}${item.selected_option ? ` (${item.selected_option})` : ""} x${item.quantity}`
      )
      .join(", ");

    // Format delivery address
    const addressText = order.delivery_address
      ? Object.entries(order.delivery_address)
          .filter(([key, val]) => val && key !== "fullName" && key !== "phone" && key !== "email")
          .map(([_, val]) => val)
          .join(", ")
      : "";

    // Determine payment method
    const paymentMethod = order.stripe_payment_intent_id ? "Card" : "Cash";

    // Extract customer name from delivery_address or email prefix
    const customerName = order.delivery_address?.fullName || order.email.split("@")[0];

    return [
      order.id,
      order.order_number,
      customerName,
      order.email,
      new Date(order.created_at).toLocaleString("en-GB"),
      itemsText,
      order.total.toFixed(2),
      order.subtotal.toFixed(2),
      order.vat_amount.toFixed(2),
      order.delivery_fee.toFixed(2),
      order.discount_amount.toFixed(2),
      order.delivery_method,
      order.delivery_slot || "",
      addressText,
      paymentMethod,
      order.status,
      order.discount_code || "",
      order.notes || "",
      order.stripe_payment_intent_id || "",
      order.user_id || "",
    ];
  });

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (val: string | number) => {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV string
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  return csvContent;
}

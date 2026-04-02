"use server";

import { updateOrderStatus, updateOrderNotes, getOrderById } from "@/lib/supabase/queries";
import {
  sendOrderConfirmationEmail,
  sendFulfilmentEmail,
  sendCancellationEmail,
} from "@/lib/email";
import type { OrderStatus, Order, OrderItem } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

// ── Update status + fire email ───────────────────────────────────────────────

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  cancellationReason?: string
): Promise<boolean> {
  // For cancellation: require a reason, prepend it to the notes field
  if (status === "CANCELLED") {
    if (!cancellationReason?.trim()) return false;
    const order = await getOrderById(orderId);
    if (!order) return false;
    const reasonTag = `[Cancellation reason: ${cancellationReason.trim()}]`;
    const notes = order.notes ? `${reasonTag}\n${order.notes}` : reasonTag;
    await updateOrderNotes(orderId, notes);
  }

  const success = await updateOrderStatus(orderId, status);
  if (!success) return false;

  // Reload the full order (with updated notes) to pass to email helpers
  const order = await getOrderById(orderId);
  if (order) {
    try {
      if (status === "DELIVERED") {
        await sendFulfilmentEmail(order, order.items);
      } else if (status === "CANCELLED") {
        const reason = cancellationReason?.trim() ?? "No reason provided";
        await sendCancellationEmail(order, order.items, reason);
      }
    } catch (err) {
      console.error(`Failed to send email for status ${status}:`, err);
      // Don't fail the status update because the email errored
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return true;
}

// ── Resend email for current order status ────────────────────────────────────

export async function resendOrderEmailAction(orderId: string): Promise<boolean> {
  const order = await getOrderById(orderId);
  if (!order) return false;

  // Extract cancellation reason from notes if present
  const reasonMatch = order.notes?.match(/^\[Cancellation reason: (.+?)\]/);
  const cancellationReason = reasonMatch ? reasonMatch[1] : "No reason provided";

  try {
    switch (order.status) {
      case "PENDING":
        await sendOrderConfirmationEmail(order, order.items);
        break;
      case "DELIVERED":
        await sendFulfilmentEmail(order, order.items);
        break;
      case "CANCELLED":
        await sendCancellationEmail(order, order.items, cancellationReason);
        break;
      default:
        return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to resend email:", err);
    return false;
  }
}

// ── Read-only detail fetch ───────────────────────────────────────────────────

export async function getOrderDetailAction(
  orderId: string
): Promise<(Order & { items: OrderItem[] }) | null> {
  return getOrderById(orderId);
}

"use server";

import { updateOrderStatus, updateOrderNotes, updateOrderDeliverySlot, getOrderById } from "@/lib/supabase/queries";
import {
  sendOrderConfirmationEmail,
  sendOutForDeliveryEmail,
  sendReadyForCollectionEmail,
  sendReceiptEmail,
  sendCancellationEmail,
  sendSlotChangedEmail,
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

  const order = await getOrderById(orderId);
  if (order) {
    try {
      const items = order.items ?? [];
      const isCollection = order.delivery_method === "COLLECTION";

      switch (status) {
        case "OUT_FOR_DELIVERY":
          if (!isCollection) await sendOutForDeliveryEmail(order, items);
          break;
        case "READY_FOR_COLLECTION":
          if (isCollection) await sendReadyForCollectionEmail(order, items);
          break;
        // DELIVERED = receipt for delivery; COLLECTED = receipt for collection
        case "DELIVERED":
        case "COLLECTED":
          await sendReceiptEmail(order, items);
          break;
        case "CANCELLED": {
          const reason = cancellationReason?.trim() ?? "No reason provided";
          await sendCancellationEmail(order, items, reason);
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error(`Failed to send email for status ${status}:`, err);
      // Don't fail the status update if email errors
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

  const items = order.items ?? [];
  const reasonMatch = order.notes?.match(/^\[Cancellation reason: ([\s\S]+?)\]/);
  const cancellationReason = reasonMatch ? reasonMatch[1] : "No reason provided";

  try {
    switch (order.status) {
      case "PENDING":
        await sendOrderConfirmationEmail(order, items);
        break;
      case "OUT_FOR_DELIVERY":
        await sendOutForDeliveryEmail(order, items);
        break;
      case "READY_FOR_COLLECTION":
        await sendReadyForCollectionEmail(order, items);
        break;
      case "DELIVERED":
      case "COLLECTED":
        await sendReceiptEmail(order, items);
        break;
      case "CANCELLED":
        await sendCancellationEmail(order, items, cancellationReason);
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

// ── Update delivery / collection slot ───────────────────────────────────────

export async function updateOrderSlotAction(
  orderId: string,
  newSlot: string,
  notifyCustomer: boolean
): Promise<{ success: boolean; error?: string }> {
  const success = await updateOrderDeliverySlot(orderId, newSlot);
  if (!success) return { success: false, error: "Failed to update slot." };

  if (notifyCustomer) {
    const order = await getOrderById(orderId);
    if (order) {
      try {
        await sendSlotChangedEmail(order, newSlot);
      } catch (err) {
        console.error("Failed to send slot-changed email:", err);
        // Don't fail the slot update if email errors
      }
    }
  }

  revalidatePath("/admin/orders");
  return { success: true };
}

// ── Read-only detail fetch ───────────────────────────────────────────────────

export async function getOrderDetailAction(
  orderId: string
): Promise<(Order & { items: OrderItem[] }) | null> {
  return getOrderById(orderId);
}

// ============================================================================
// Transactional Email Helpers (Resend)
// ============================================================================
// Status pipelines:
//
//   DELIVERY:   PENDING → OUT_FOR_DELIVERY → DELIVERED → (CANCELLED)
//   COLLECTION: PENDING → READY_FOR_COLLECTION → COLLECTED → (CANCELLED)
//
// Each status change fires a dedicated email to the customer.
// Order creation (PENDING) also notifies the business owner.
// ============================================================================

import { Resend } from "resend";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/supabase/types";

async function send(payload: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — email not sent:", payload.subject);
    return;
  }
  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? siteConfig.notifications.fromEmail;
  const from = `${siteConfig.shopName} <${fromEmail}>`;
  const { data, error } = await resend.emails.send({ ...payload, from });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error(`Resend send failed: ${error.message}`);
  }
  console.log("[email] Sent ok, id:", data?.id, "subject:", payload.subject);
}

const { code, locale } = siteConfig.currency;
const fmt = (v: number) => formatPrice(v, code, locale);

// ── Shared building blocks ──────────────────────────────────────────────────

function buildItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.product_name}${
            item.selected_option
              ? ` <span style="color:#888;font-size:13px;">(${item.selected_option})</span>`
              : ""
          }</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(item.price_per_unit)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${fmt(item.line_total)}</td>
        </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;">
      <thead>
        <tr style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">
          <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e8e8e8;">Item</th>
          <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e8e8e8;">Qty</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e8e8e8;">Unit Price</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e8e8e8;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTotalsSection(order: Order): string {
  const discountRow =
    Number(order.discount_amount) > 0
      ? `<tr>
          <td style="padding:4px 0;color:#16a34a;">Discount${
            order.discount_code ? ` (${order.discount_code})` : ""
          }</td>
          <td style="padding:4px 0;text-align:right;color:#16a34a;">-${fmt(Number(order.discount_amount))}</td>
        </tr>`
      : "";

  const deliveryRow =
    Number(order.delivery_fee) > 0
      ? `<tr>
          <td style="padding:4px 0;color:#555;">Delivery</td>
          <td style="padding:4px 0;text-align:right;">${fmt(Number(order.delivery_fee))}</td>
        </tr>`
      : "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:16px;max-width:320px;margin-left:auto;">
      <tbody>
        <tr>
          <td style="padding:4px 0;color:#555;">Subtotal</td>
          <td style="padding:4px 0;text-align:right;">${fmt(Number(order.subtotal))}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">VAT (${(siteConfig.vatRate * 100).toFixed(0)}%${
            siteConfig.vatIncluded ? " incl." : ""
          })</td>
          <td style="padding:4px 0;text-align:right;">${fmt(Number(order.vat_amount))}</td>
        </tr>
        ${deliveryRow}
        ${discountRow}
        <tr style="border-top:2px solid #e8e8e8;">
          <td style="padding:10px 0 4px;font-weight:700;font-size:16px;">Total</td>
          <td style="padding:10px 0 4px;text-align:right;font-weight:700;font-size:16px;">${fmt(Number(order.total))}</td>
        </tr>
      </tbody>
    </table>`;
}

function buildFulfilmentSection(order: Order): string {
  if (order.delivery_method === "COLLECTION") {
    return `
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">
        <p style="margin:0 0 4px;font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Collection Address</p>
        <p style="margin:0;">${siteConfig.delivery.pickupAddress}</p>
      </div>`;
  }

  const addressLines = order.delivery_address
    ? Object.values(order.delivery_address).filter(Boolean).join(", ")
    : "";

  return `
    <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-top:16px;font-size:14px;">
      <p style="margin:0 0 4px;font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Delivery Address</p>
      <p style="margin:0;">${addressLines}</p>
      ${order.delivery_slot ? `<p style="margin:4px 0 0;color:#555;">Slot: ${order.delivery_slot}</p>` : ""}
    </div>`;
}

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#111;padding:28px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${siteConfig.shopName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f8f8f8;border-top:1px solid #ebebeb;font-size:12px;color:#888;text-align:center;">
              ${siteConfig.shopName} &mdash; ${siteConfig.contact.address}<br>
              ${siteConfig.contact.email} &bull; ${siteConfig.contact.phone}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── 1. Order Confirmation — PENDING (customer + owner) ───────────────────────

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const isCollection = order.delivery_method === "COLLECTION";
  const fulfilmentLabel = isCollection ? "Collection" : "Delivery";

  const customerHtml = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Order Confirmed</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Thanks for your order! Here&apos;s your invoice.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Fulfilment</td>
        <td style="text-align:right;padding-top:4px;">${fulfilmentLabel}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      We&apos;ll be in touch with an update soon. Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  const ownerHtml = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">New Order Received</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">A new order has been placed on ${siteConfig.shopName}.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Customer</td>
        <td style="text-align:right;padding-top:4px;">${order.email.replace(/ \(guest\)$/, "")}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Fulfilment</td>
        <td style="text-align:right;padding-top:4px;">${fulfilmentLabel}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}
  `);

  const ownerEmail = siteConfig.notifications.ownerEmail;
  const customerEmail = order.email.replace(/ \(guest\)$/, "");

  await Promise.all([
    await send({
    to: customerEmail,
    subject: `Order Confirmed – ${order.order_number} | ${siteConfig.shopName}`,
    html: customerHtml,
  }),
  send({
    to: ownerEmail,
    subject: `New Order: ${order.order_number} – ${customerEmail}`,
    html: ownerHtml,
  }),
  ]);
}

// ── 1b. Payment Pending (Mollie open/pending — e.g. bank transfer) ───────────

export async function sendPaymentPendingEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Payment Pending</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">
      We&apos;ve received your order and are waiting to confirm your payment.
      Some payment methods (such as bank transfers) can take a few business days to settle.
      We will email you as soon as we receive your payment and begin processing your order.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Status</td>
        <td style="text-align:right;padding-top:4px;color:#f59e0b;font-weight:600;">Payment Pending</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}

    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 16px;margin-top:24px;">
      <p style="margin:0;font-size:14px;color:#92400e;">
        <strong>No action needed from you.</strong> Your order is reserved while we await payment confirmation.
        If payment is not received, the order will be automatically cancelled and you will be notified.
      </p>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  const ownerHtml = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">New Order — Payment Pending</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">
      A new order has been placed on ${siteConfig.shopName} but payment has not yet settled.
      The order is reserved until payment is confirmed.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Customer</td>
        <td style="text-align:right;padding-top:4px;">${order.email.replace(/ \(guest\)$/, "")}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
  `);

  const ownerEmail = siteConfig.notifications.ownerEmail;
  const customerEmail = order.email.replace(/ \(guest\)$/, "");

  await Promise.all([
    send({
      to: customerEmail,
      subject: `Order Received — Payment Pending – ${order.order_number} | ${siteConfig.shopName}`,
      html,
    }),
    send({
      to: ownerEmail,
      subject: `New Order (Payment Pending): ${order.order_number} – ${customerEmail}`,
      html: ownerHtml,
    }),
  ]);
}

// ── 1c. Payment Confirmed (Mollie paid/authorized — after PAYMENT_PENDING) ───

export async function sendPaymentConfirmedEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const isCollection = order.delivery_method === "COLLECTION";
  const fulfilmentLabel = isCollection ? "Collection" : "Delivery";

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Payment Confirmed — Order Processing</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">
      Great news! We&apos;ve received your payment and your order is now being processed.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Fulfilment</td>
        <td style="text-align:right;padding-top:4px;">${fulfilmentLabel}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      We&apos;ll be in touch with an update on your ${fulfilmentLabel.toLowerCase()} soon. Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Payment Confirmed – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 1d. Payment Failed/Expired/Cancelled by Mollie ───────────────────────────

export type MollieFailureReason = "canceled" | "expired" | "failed";

export async function sendPaymentFailedEmail(
  order: Order,
  items: OrderItem[],
  reason: MollieFailureReason
): Promise<void> {
  const headingMap: Record<MollieFailureReason, string> = {
    canceled: "Payment Cancelled",
    expired:  "Payment Expired",
    failed:   "Payment Failed",
  };
  const bodyMap: Record<MollieFailureReason, string> = {
    canceled: "You cancelled the payment before it was completed. Your order has not been charged and has been automatically cancelled.",
    expired:  "Your payment session expired before the payment was completed. Your order has been automatically cancelled. No charge was made.",
    failed:   "Unfortunately your payment could not be processed. Your order has been automatically cancelled. No charge was made.",
  };
  const ctaMap: Record<MollieFailureReason, string> = {
    canceled: "If you&apos;d like to place a new order, please visit our store.",
    expired:  "If you&apos;d like to try again, please return to our store and place a new order.",
    failed:   "Please try again with a different payment method or contact your bank if the issue persists.",
  };

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">${headingMap[reason]}</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">${bodyMap[reason]}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      ${ctaMap[reason]} Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `${headingMap[reason]} – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 2. Out for Delivery — delivery orders only ───────────────────────────────

export async function sendOutForDeliveryEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const addressLines = order.delivery_address
    ? Object.values(order.delivery_address).filter(Boolean).join(", ")
    : "";

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Your Order Is On Its Way</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Your order is out for delivery. Expect it shortly!</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Delivering to</td>
        <td style="text-align:right;padding-top:4px;">${addressLines}</td>
      </tr>
      ${order.delivery_slot ? `<tr><td style="color:#555;padding-top:4px;">Slot</td><td style="text-align:right;padding-top:4px;">${order.delivery_slot}</td></tr>` : ""}
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Please ensure someone is available to receive your order. Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Your order is out for delivery – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 3. Ready for Collection — collection orders only ─────────────────────────

export async function sendReadyForCollectionEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Your Order Is Ready for Collection</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">
      Great news — your order is packed and ready. Please come collect it at your earliest convenience.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Collection Address</td>
        <td style="text-align:right;padding-top:4px;">${siteConfig.delivery.pickupAddress}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Please bring this confirmation with you. Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Your order is ready for collection – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 4. Receipt — DELIVERED (delivery) or COLLECTED (collection) ──────────────

export async function sendReceiptEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const isCollection = order.delivery_method === "COLLECTION";
  const heading = isCollection ? "Order Collected" : "Order Delivered";
  const body = isCollection
    ? "Thank you for collecting your order. Here&apos;s your receipt."
    : "Your order has been delivered. Here&apos;s your receipt.";
  const subject = isCollection
    ? `Your order has been collected – ${order.order_number}`
    : `Your order has been delivered – ${order.order_number}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">${heading}</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">${body}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Status</td>
        <td style="text-align:right;padding-top:4px;color:#16a34a;font-weight:600;">
          ${isCollection ? "Collected" : "Delivered"}
        </td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Thank you for shopping with ${siteConfig.shopName}. Questions? Contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `${siteConfig.shopName} – ${subject}`,
    html,
  });
}

// ── 5. Delivery/Collection slot updated by admin ─────────────────────────────

export async function sendSlotChangedEmail(
  order: Order,
  newSlot: string
): Promise<void> {
  const isCollection = order.delivery_method === "COLLECTION";
  const label = isCollection ? "Collection" : "Delivery";

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Your ${label} Slot Has Changed</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">
      We&apos;ve updated the ${label.toLowerCase()} slot for your order. Please see the new details below.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:8px;font-weight:600;">New ${label} Slot</td>
        <td style="text-align:right;padding-top:8px;font-weight:600;">${newSlot}</td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      If you have any questions, please contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Your ${label.toLowerCase()} slot has been updated – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 6. Cancellation — CANCELLED ─────────────────────────────────────���────────

export async function sendCancellationEmail(
  order: Order,
  items: OrderItem[],
  reason: string
): Promise<void> {
  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Order Cancelled</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">We&apos;re sorry, your order has been cancelled.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
    </table>

    <div style="background:#fff3f3;border-left:4px solid #dc2626;border-radius:4px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-weight:600;font-size:13px;color:#dc2626;text-transform:uppercase;letter-spacing:.05em;">Cancellation Reason</p>
      <p style="margin:0;font-size:14px;">${reason}</p>
    </div>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      If you believe this is an error or have questions, please contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await send({
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Order Cancelled – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

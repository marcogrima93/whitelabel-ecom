// ============================================================================
// Transactional Email Helpers (Resend)
// ============================================================================
// Three email types mirror the three valid order statuses:
//   1. Order Confirmation  — sent when order is created (PENDING)
//   2. Fulfilment          — sent when status → DELIVERED (wording adapts to delivery_method)
//   3. Cancellation        — sent when status → CANCELLED (includes reason)
// ============================================================================

import { Resend } from "resend";
import { siteConfig } from "@/site.config";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/supabase/types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address — uses ADMIN_EMAIL env var; falls back to a safe onboarding default.
const FROM_ADDRESS = process.env.ADMIN_EMAIL
  ? `${siteConfig.shopName} <${process.env.ADMIN_EMAIL}>`
  : `${siteConfig.shopName} <onboarding@resend.dev>`;

const { code, locale } = siteConfig.currency;
const fmt = (v: number) => formatPrice(v, code, locale);

// ── Shared helpers ──────────────────────────────────────────────────────────

function buildItemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.product_name}${item.selected_option ? ` <span style="color:#888;font-size:13px;">(${item.selected_option})</span>` : ""}</td>
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
          <td style="padding:4px 0;color:#16a34a;">Discount${order.discount_code ? ` (${order.discount_code})` : ""}</td>
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
          <td style="padding:4px 0;color:#555;">VAT (${(siteConfig.vatRate * 100).toFixed(0)}%${siteConfig.vatIncluded ? " incl." : ""})</td>
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
        <p style="margin:0 0 4px;font-weight:600;color:#555;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Collection</p>
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
          <!-- Header -->
          <tr>
            <td style="background:#111;padding:28px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${siteConfig.shopName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
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

// ── 1. Order Confirmation (PENDING) ──────────────────────────────────────────

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const fulfilmentMethod =
    order.delivery_method === "COLLECTION" ? "Collection" : "Delivery";

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">Order Confirmed</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">Thanks for your order! Here&apos;s your invoice.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Fulfilment Method</td>
        <td style="text-align:right;padding-top:4px;">${fulfilmentMethod}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      We&apos;ll be in touch shortly. If you have any questions, reply to this email or contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Order Confirmation – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

// ── 2. Fulfilment (DELIVERED / COLLECTED) ────────────────────────────────────

export async function sendFulfilmentEmail(
  order: Order,
  items: OrderItem[]
): Promise<void> {
  const isCollection = order.delivery_method === "COLLECTION";
  const actionLabel = isCollection ? "ready for collection" : "on its way";
  const headingLabel = isCollection ? "Ready for Collection" : "Order Delivered";
  const bodyLabel = isCollection
    ? "Your order is ready for collection. Please bring this confirmation with you."
    : "Great news — your order has been delivered.";
  const subjectLabel = isCollection
    ? `Your order is ready for collection – ${order.order_number}`
    : `Your order has been delivered – ${order.order_number}`;

  const html = baseTemplate(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;">${headingLabel}</h1>
    <p style="margin:0 0 24px;color:#555;font-size:15px;">${bodyLabel}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="color:#555;">Order Number</td>
        <td style="text-align:right;font-family:monospace;font-weight:600;">${order.order_number}</td>
      </tr>
      <tr>
        <td style="color:#555;padding-top:4px;">Status</td>
        <td style="text-align:right;padding-top:4px;color:#16a34a;font-weight:600;">${isCollection ? "Ready for Collection" : "Delivered"}</td>
      </tr>
    </table>

    ${buildItemsTable(items)}
    ${buildTotalsSection(order)}
    ${buildFulfilmentSection(order)}

    <p style="margin:24px 0 0;font-size:14px;color:#555;">
      Thank you for shopping with us. If you have any questions, contact us at
      <a href="mailto:${siteConfig.contact.email}" style="color:#111;">${siteConfig.contact.email}</a>.
    </p>
  `);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `${siteConfig.shopName} – ${subjectLabel}`,
    html,
  });
}

// ── 3. Cancellation (CANCELLED) ──────────────────────────────────────────────

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

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: order.email.replace(/ \(guest\)$/, ""),
    subject: `Order Cancelled – ${order.order_number} | ${siteConfig.shopName}`,
    html,
  });
}

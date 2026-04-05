/**
 * Stripe Gateway Module
 * ──────────────────────
 * Self-contained server-side Stripe integration.
 * Required env vars:
 *   - STRIPE_SECRET_KEY
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *
 * UI: components/checkout/StripeForm.tsx
 *
 * To add a new gateway: copy this file, implement createPaymentIntent() and
 * export the env vars list for registration in lib/payments/registry.ts.
 */

import Stripe from "stripe";
import { siteConfig } from "@/site.config";

export const STRIPE_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

/** Lazy singleton — only initialised when Stripe is actually used */
let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

export interface CreateStripePaymentIntentParams {
  total: number;
  customerEmail: string;
  orderNumber: string;
  isGuest: boolean;
  userId?: string;
  itemCount: number;
}

export interface StripePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Creates a Stripe PaymentIntent and returns the client secret.
 * Throws if Stripe is not configured.
 */
export async function createStripePaymentIntent(
  params: CreateStripePaymentIntentParams
): Promise<StripePaymentIntentResult> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(params.total * 100),
    currency: siteConfig.currency.code.toLowerCase(),
    receipt_email: params.customerEmail,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderNumber: params.orderNumber,
      customerEmail: params.customerEmail,
      isGuest: params.isGuest ? "true" : "false",
      userId: params.userId || "",
      itemCount: params.itemCount.toString(),
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return a client secret.");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Cancels a Stripe PaymentIntent. Used for order-creation rollback.
 */
export async function cancelStripePaymentIntent(
  paymentIntentId: string
): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe) return;
  await stripe.paymentIntents.cancel(paymentIntentId);
}

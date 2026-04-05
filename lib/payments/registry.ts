/**
 * Payment Gateway Registry
 * ────────────────────────
 * This is the single source of truth for all payment gateway metadata.
 * To add a new gateway:
 *   1. Create a module at lib/payments/gateways/<name>.ts
 *   2. Add its entry to GATEWAY_REGISTRY below
 *   3. Add it to site.config.ts → payments with enabled: false
 *   4. Add its API handler case in app/api/checkout/route.ts
 */

import { siteConfig } from "@/site.config";
import { CreditCard, Banknote, type LucideIcon } from "lucide-react";

export type GatewayId = keyof typeof siteConfig.payments;

export interface GatewayDefinition {
  id: GatewayId;
  /** Human-readable name shown in checkout UI */
  label: string;
  /** Short description shown below the label in checkout UI */
  description: string;
  /** Lucide icon component */
  Icon: LucideIcon;
  /** List of required environment variable names (used for validation) */
  envVars: string[];
}

/**
 * Registry of all supported payment gateways.
 * Order here controls the display order in checkout.
 *
 * NOTE: Add new gateway entries here after creating the module file.
 */
export const GATEWAY_REGISTRY: GatewayDefinition[] = [
  {
    id: "stripe",
    label: "Card / Online",
    description: "Pay securely via Stripe",
    Icon: CreditCard,
    envVars: [
      "STRIPE_SECRET_KEY",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ],
  },
  {
    id: "cashOnDelivery",
    // Label is intentionally generic — the checkout UI overrides it based on delivery type
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    Icon: Banknote,
    envVars: [],
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay with your PayPal account",
    Icon: CreditCard,
    envVars: [
      "PAYPAL_CLIENT_ID",
      "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
      "PAYPAL_CLIENT_SECRET",
    ],
  },
  {
    id: "revolut",
    label: "Revolut Pay",
    description: "Pay with Revolut",
    Icon: CreditCard,
    envVars: ["REVOLUT_API_KEY", "NEXT_PUBLIC_REVOLUT_PUBLIC_ID"],
  },
  {
    id: "trustPayments",
    label: "Trust Payments",
    description: "Pay securely via Trust Payments",
    Icon: CreditCard,
    envVars: [
      "TRUST_PAYMENTS_SITE_REFERENCE",
      "TRUST_PAYMENTS_USERNAME",
      "TRUST_PAYMENTS_PASSWORD",
    ],
  },
  {
    id: "bov",
    label: "Bank of Valletta",
    description: "Pay via BOV internet banking",
    Icon: CreditCard,
    envVars: ["BOV_MERCHANT_ID", "BOV_API_KEY", "BOV_SECRET"],
  },
  {
    id: "skrill",
    label: "Skrill",
    description: "Pay with your Skrill wallet",
    Icon: CreditCard,
    envVars: ["SKRILL_MERCHANT_EMAIL", "SKRILL_SECRET_WORD"],
  },
  {
    id: "mollie",
    label: "Mollie",
    description: "Pay securely via Mollie",
    Icon: CreditCard,
    envVars: ["MOLLIE_API_KEY"],
  },
  {
    id: "fondy",
    label: "Fondy",
    description: "Pay securely via Fondy",
    Icon: CreditCard,
    envVars: ["FONDY_MERCHANT_ID", "FONDY_SECRET_KEY"],
  },
  {
    id: "myPos",
    label: "myPOS",
    description: "Pay via myPOS",
    Icon: CreditCard,
    envVars: ["MYPOS_STORE_ID", "MYPOS_CLIENT_ID", "MYPOS_API_PASSWORD"],
  },
  {
    id: "sumUp",
    label: "SumUp",
    description: "Pay via SumUp",
    Icon: CreditCard,
    envVars: ["SUMUP_CLIENT_ID", "SUMUP_CLIENT_SECRET", "SUMUP_MERCHANT_CODE"],
  },
];

const MAX_ENABLED_GATEWAYS = 3;

/**
 * Returns the list of enabled gateways in registry display order.
 * Throws if more than MAX_ENABLED_GATEWAYS are enabled in site.config.ts.
 */
export function getEnabledGateways(): GatewayDefinition[] {
  const payments = siteConfig.payments as Record<string, { enabled: boolean }>;

  const enabled = GATEWAY_REGISTRY.filter((g) => payments[g.id]?.enabled === true);

  if (enabled.length > MAX_ENABLED_GATEWAYS) {
    throw new Error(
      `[payments] Too many gateways enabled (${enabled.length}). ` +
        `Maximum is ${MAX_ENABLED_GATEWAYS}. ` +
        `Currently enabled: ${enabled.map((g) => g.id).join(", ")}. ` +
        `Disable some in site.config.ts → payments.`
    );
  }

  return enabled;
}

/**
 * Validates that all required environment variables are present for each
 * currently-enabled gateway. Only runs checks for enabled gateways — disabled
 * gateways with missing env vars will never cause an error.
 *
 * Logs a warning per missing variable; does not throw (allows the app to start
 * so the developer can see the full list of missing vars at once).
 */
export function validateEnabledGatewayEnvVars(): void {
  // Only run on the server — process.env is not available client-side
  if (typeof window !== "undefined") return;

  const enabled = getEnabledGateways();

  for (const gateway of enabled) {
    for (const envVar of gateway.envVars) {
      if (!process.env[envVar]) {
        console.warn(
          `[payments] Missing env var "${envVar}" required by enabled gateway "${gateway.id}". ` +
            `Set it in your .env.local or Vercel environment variables.`
        );
      }
    }
  }
}

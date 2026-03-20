import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.shopName}.`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-GB")}
      </p>

      <h2>1. Information We Collect</h2>
      <p>
        We collect information that you manually provide us when creating an account,
        placing an order, or contacting us. This includes your name, email address,
        phone number, shipping and billing addresses, and payment details.
      </p>
      
      <h2>2. How We Use Your Information</h2>
      <p>
        We use the information we collect to:
      </p>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Communicate with you regarding your orders or queries</li>
        <li>Improve our website and services</li>
        <li>Send promotional materials (only if you have opted in)</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal data. We only share your data with trusted
        third parties necessary for fulfilling our services (e.g., Stripe for
        secure payments, courier services for delivery).
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We keep your personal information only for as long as is necessary for the
        purposes set out in this privacy policy, and to comply with our legal
        obligations.
      </p>

      <h2>5. Your Rights (GDPR)</h2>
      <p>
        You have the right to access, update, or delete the personal information we
        hold about you. If you would like to exercise any of these rights, please
        contact us at <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
      </p>
    </div>
  );
}

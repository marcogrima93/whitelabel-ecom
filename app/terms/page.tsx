import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: `Terms and conditions for ${siteConfig.shopName}.`,
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-GB")}
      </p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to {siteConfig.shopName}. These Terms and Conditions govern your
        use of our website and services. By accessing or using our website, you
        agree to be bound by these terms.
      </p>

      <h2>2. Business Information</h2>
      <p>
        This website is operated by <strong>{siteConfig.legal.companyName || siteConfig.shopName}</strong>.
        {siteConfig.legal.vatNumber && <><br />VAT Registration Number: {siteConfig.legal.vatNumber}</>}
        {siteConfig.legal.registrationNumber && <><br />Company Registration: {siteConfig.legal.registrationNumber}</>}
      </p>

      <h2>3. Products & Pricing</h2>
      <p>
        All prices are listed in {siteConfig.currency.code}. Prices and availability
        are subject to change without notice. We make every effort to display
        products accurately, but we cannot guarantee that your device's display
        will accurately reflect the true colour or size of the products.
      </p>

      <h2>4. Orders & Payment</h2>
      <p>
        By placing an order, you are offering to purchase a product subject to
        these terms. All orders are subject to availability and confirmation of
        the order price.
      </p>

      <h2>5. Shipping & Delivery</h2>
      <p>
        We aim to dispatch all orders promptly. Delivery times are estimates and
        are not guaranteed. We are not responsible for delays caused by customs
        or our courier partners.
      </p>

      <h2>6. Returns & Refunds</h2>
      <p>
        If you are not entirely satisfied with your purchase, please contact us
        within 14 days of receiving your item to arrange a return.
      </p>

      <h2>7. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at{" "}
        <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
      </p>
    </div>
  );
}

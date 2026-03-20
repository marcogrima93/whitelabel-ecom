import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Cookie policy for ${siteConfig.shopName}.`,
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <p className="text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString("en-GB")}
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files that are stored on your device when you visit a website.
        They are widely used to make websites work more efficiently and to provide information
        to the owners of the site.
      </p>

      <h2>How we use cookies</h2>
      <p>We use cookies for the following purposes:</p>
      <ul>
        <li>
          <strong>Essential Cookies:</strong> These are strictly necessary for the website
          to function. They include cookies that enable you to log into secure areas,
          use a shopping cart, or make use of e-billing services.
        </li>
        <li>
          <strong>Analytical/Performance Cookies:</strong> These allow us to recognise and
          count the number of visitors and to see how visitors move around our website
          when they are using it.
        </li>
        <li>
          <strong>Functionality Cookies:</strong> These are used to recognise you when you
          return to our website and remember your preferences (like dismissing the cookie banner).
        </li>
      </ul>

      <h2>Managing Cookies</h2>
      <p>
        Most web browsers allow some control of most cookies through the browser settings.
        To find out more about cookies, including how to see what cookies have been set,
        visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a>.
      </p>
    </div>
  );
}

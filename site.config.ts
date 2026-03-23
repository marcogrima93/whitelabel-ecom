export const siteConfig = {
  name: "[STORE_NAME]",
  description: "[STORE_DESCRIPTION]",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  logo: "/logo.svg",
  currency: "EUR",
  currencySymbol: "€",
  locale: "en",
  tax: {
    rate: 0.18,
    label: "VAT",
    included: true,
  },
  contact: {
    email: "[EMAIL]",
    phone: "[PHONE]",
    address: "[ADDRESS]",
    whatsapp: "[WHATSAPP]",
  },
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
  },
  shipping: {
    freeThreshold: 80,
    rates: [
      { region: "Malta", fee: 5 },
      { region: "Gozo", fee: 10 },
    ],
  },
  features: {
    reviews: true,
    wishlist: false,
    blog: false,
    guestCheckout: true,
    discountCodes: true,
  },
  announcement: "[ANNOUNCEMENT_TEXT]",
  hero: {
    headline: "[HERO_HEADLINE]",
    subheadline: "[HERO_SUBHEADLINE]",
    primaryCta: { text: "Shop Now", href: "/products" },
    secondaryCta: { text: "Learn More", href: "/about" },
  },
  usps: [
    { icon: "Truck", title: "Free Shipping", description: "On orders over €80" },
    { icon: "Shield", title: "Secure Payments", description: "Stripe powered checkout" },
    { icon: "RotateCcw", title: "Easy Returns", description: "30-day return policy" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

// ============================================================================
// WHITE-LABEL SITE CONFIGURATION
// ============================================================================
// Edit this file to customise the store for each client.
// All placeholder values from the template are centralised here.
// ============================================================================

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  // ── Branding ──────────────────────────────────────────────────────────
  shopName: "Meat Drop Malta",
  shopDescription: "Premium meats & poultry, expertly butchered and delivered fresh.",
  shopUrl: "https://meatdrop.mt",
  logo: "/logo.svg", // Place in /public

  // ── Locale & Currency ─────────────────────────────────────────────────
  currency: {
    code: "EUR",
    symbol: "€",
    locale: "en-MT",
  },
  vatRate: 0.18, // 18%
  locale: "en-MT",

  // ── Theme (shadcn CSS variables – HSL values) ─────────────────────────
  theme: {
    primary: "222.2 47.4% 11.2%",
    primaryForeground: "210 40% 98%",
    accent: "210 40% 96.1%",
    accentForeground: "222.2 47.4% 11.2%",
    radius: "0.75rem",
  },

  // ── Navigation & Categories ───────────────────────────────────────────
  categories: [
    { name: "Beef", slug: "beef", image: "/images/categories/beef.jpg" },
    { name: "Pork", slug: "pork", image: "/images/categories/pork.jpg" },
    { name: "Poultry", slug: "poultry", image: "/images/categories/poultry.jpg" },
    { name: "Lamb", slug: "lamb", image: "/images/categories/lamb.jpg" },
  ],

  // ── Product Filters ───────────────────────────────────────────────────
  filters: {
    secondary: {
      label: "Cut",
      options: ["Steak", "Chops", "Mince", "Whole", "Sausages"],
    },
    unit: "kg", // e.g. "kg", "piece", "pack"
    optionSelector: "Weight", // e.g. "Weight", "Size", "Colour"
  },

  // ── Homepage ──────────────────────────────────────────────────────────
  hero: {
    headline: "Premium Quality Meats",
    subheadline: "Responsibly sourced, expertly butchered, and delivered fresh to your door.",
    primaryCta: { label: "Shop Prime Cuts", href: "/products" },
    secondaryCta: { label: "Restaurant Wholesale", href: "/wholesale" },
    backgroundImage: "/images/hero-bg.jpg",
  },

  announcement: {
    enabled: true,
    text: "Free refrigerated delivery on orders over €80!",
  },

  usps: [
    { icon: "Zap", title: "Farm Fresh", description: "Sourced directly from trusted local farms" },
    { icon: "Shield", title: "Expertly Butchered", description: "Prepared fresh daily by master butchers" },
    { icon: "Truck", title: "Cold Chain Delivery", description: "Delivered in refrigerated vans for maximum freshness" },
  ],

  // ── Delivery ──────────────────────────────────────────────────────────
  delivery: {
    regions: [
      { name: "Region 1", fee: 5 },
      { name: "Region 2", fee: 10 },
    ],
    freeThreshold: 80, // Free delivery over this amount
    slots: [
      { label: "Morning 8–12", value: "morning" },
      { label: "Afternoon 12–5", value: "afternoon" },
    ],
    pickupAddress: "123 Main Street, Your City",
  },

  // ── Wholesale ─────────────────────────────────────────────────────────
  // Set to false to run as a retail-only store (hides all wholesale features)
  wholesale: {
    enabled: false,
    minOrderValue: 150,
    tiers: [
      { minQty: 10, multiplier: 0.95, label: "Tier 1 (10+ units)" },
      { minQty: 25, multiplier: 0.90, label: "Tier 2 (25+ units)" },
    ],
    pendingMessage: "Your wholesale account will be reviewed within 24 hours.",
  },

  // ── Contact & Social ──────────────────────────────────────────────────
  whatsapp: {
    enabled: false,
    number: "",
  },

  contact: {
    email: "hello@yourstore.com",
    phone: "+1 234 567 890",
    address: "123 Main Street, Your City",
  },

  social: {
    facebook: "",
    instagram: "",
    twitter: "",
  },

  // ── Legal / GDPR ─────────────────────────────────────────────────────
  legal: {
    companyName: "Your Company Ltd",
    vatNumber: "",
    registrationNumber: "",
  },

  // ── Product Detail Page Accordion Tabs ────────────────────────────────
  productAccordionTabs: [
    { title: "Description", key: "description" },
    { title: "Shipping Info", key: "shipping" },
    { title: "Returns", key: "returns" },
  ],

  // ── Auth Labels ───────────────────────────────────────────────────────
  auth: {
    retailLabel: "Retail Customer",
    wholesaleLabel: "Wholesale / Business Customer",
  },
} as const;

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
  // "logo-only"       = just the logo image in the header
  // "logo-and-name"   = logo image (left) + shop name text (right)
  logoDisplay: "logo-and-name" as "logo-only" | "logo-and-name",

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
  // Categories are managed in the Admin Portal → Catalogue section and stored in the DB.

  // ── Product Filters ───────────────────────────────────────────────────
  // Filter groups and options are managed in Admin Portal → Catalogue section.
  // unit and optionSelector are store-level display labels used across the UI.
  filters: {
    unit: "kg", // e.g. "kg", "piece", "pack" — shown as "€12.50 / kg"
    optionSelector: "Weight", // e.g. "Weight", "Size", "Colour" — labels the variant picker
  },

  // ── Homepage ──────────────────────────────────────────────────────────
  hero: {
    headline: "Premium Quality Meats",
    subheadline: "Responsibly sourced, expertly butchered, and delivered fresh to your door.",
    primaryCta: { label: "Shop Prime Cuts", href: "/products" },
    secondaryCta: { label: "Restaurant Wholesale", href: "/wholesale" },
    backgroundImage: "/images/hero-bg.jpg",
    // "dark" = dark/moody image → light text & buttons
    // "light" = light/bright image → dark text & buttons
    theme: "dark",
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
    // Malta & Gozo towns with individual delivery fees (EUR)
    towns: [
      // Malta – Central
      { name: "Birkirkara", fee: 3 },
      { name: "Gżira", fee: 3 },
      { name: "Hamrun", fee: 3 },
      { name: "Msida", fee: 3 },
      { name: "Pietà", fee: 3 },
      { name: "Santa Venera", fee: 3 },
      { name: "Tal-Pietà", fee: 3 },
      // Malta – Northern
      { name: "Bugibba", fee: 4 },
      { name: "Mellieħa", fee: 5 },
      { name: "Mġarr", fee: 5 },
      { name: "Mosta", fee: 4 },
      { name: "Naxxar", fee: 4 },
      { name: "Pembroke", fee: 4 },
      { name: "Qawra", fee: 4 },
      { name: "St Paul's Bay", fee: 4 },
      // Malta – Southern
      { name: "Birżebbuġa", fee: 5 },
      { name: "Fgura", fee: 4 },
      { name: "Gudja", fee: 4 },
      { name: "Luqa", fee: 4 },
      { name: "Marsa", fee: 3 },
      { name: "Marsaskala", fee: 5 },
      { name: "Marsaxlokk", fee: 5 },
      { name: "Qrendi", fee: 5 },
      { name: "Safi", fee: 5 },
      { name: "Żabbar", fee: 4 },
      { name: "Żejtun", fee: 5 },
      { name: "Żurrieq", fee: 5 },
      // Malta – Eastern
      { name: "Kalkara", fee: 4 },
      { name: "Paola", fee: 3 },
      { name: "San Ġwann", fee: 3 },
      { name: "Swieqi", fee: 4 },
      { name: "Tarxien", fee: 4 },
      // Valletta & Harbour
      { name: "Floriana", fee: 3 },
      { name: "Senglea", fee: 4 },
      { name: "Three Cities", fee: 4 },
      { name: "Valletta", fee: 3 },
      // Malta – North-West
      { name: "Attard", fee: 4 },
      { name: "Balzan", fee: 3 },
      { name: "Dingli", fee: 5 },
      { name: "Lija", fee: 3 },
      { name: "Mdina", fee: 4 },
      { name: "Rabat", fee: 4 },
      { name: "Siġġiewi", fee: 5 },
      // Gozo
      { name: "Fontana", fee: 8 },
      { name: "Għajnsielem", fee: 8 },
      { name: "Għarb", fee: 9 },
      { name: "Għasri", fee: 9 },
      { name: "Kerċem", fee: 9 },
      { name: "Marsalforn", fee: 8 },
      { name: "Munxar", fee: 9 },
      { name: "Nadur", fee: 8 },
      { name: "Qala", fee: 9 },
      { name: "Rabat (Gozo)", fee: 8 },
      { name: "San Lawrenz", fee: 9 },
      { name: "Sannat", fee: 9 },
      { name: "Victoria", fee: 8 },
      { name: "Xlendi", fee: 9 },
      { name: "Xagħra", fee: 8 },
      { name: "Żebbuġ (Gozo)", fee: 9 },
      // Comino
      { name: "Comino", fee: 15 },
    ],
    freeThreshold: 80, // Free delivery over this amount
    slots: [
      { label: "Morning 8–12", value: "morning" },
      { label: "Afternoon 12–5", value: "afternoon" },
    ],
    pickupAddress: "Triq Andrea Bogdan, Ħaż-Żebbuġ, ZBG306",
  },

  // ── Payments ──────────────────────────────────────────────────────────
  payments: {
    stripe: {
      enabled: true, // Set to false to hide Stripe card payment option
    },
    cashOnDelivery: {
      enabled: true,  // Set to true to offer cash on delivery / cash on collection
      label: "Cash on Delivery / Collection", // Shown to the customer
      description: "Pay with cash when your order arrives or when you collect.",
    },
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

  // ── Contact & Social ──────────────────────────────────��───────────────
  whatsapp: {
    enabled: true,
    number: "+35699999999",
  },

  contact: {
    email: "hello@meatdrop.mt",
    phone: "+356 9999 9999",
    address: "Triq Andrea Bogdan, Ħaż-Żebbuġ, ZBG306",
  },

  social: {
    facebook: "",
    instagram: "",
    twitter: "",
  },

  // ── Legal / GDPR ─────────────────────────────────────────────────────
  legal: {
    companyName: "Meat Drop Malta",
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

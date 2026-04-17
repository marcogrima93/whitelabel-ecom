// ============================================================================
// WHITE-LABEL SITE CONFIGURATION
// ============================================================================
// Edit this file to customise the store for each client.
// All placeholder values from the template are centralised here.
// ============================================================================

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  // ── Branding ──────────────────────────────────────────────────────────
  shopName: "CHILL Clothing Malta",
  shopDescription: "New and Preloved Clothing.",
  shopUrl: "https://chill.mt",
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
  // true  = prices in DB already include VAT (Malta standard — show "inc. VAT" on receipts)
  // false = prices in DB are ex-VAT and VAT is added on top at checkout
  vatIncluded: true,
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
    unit: "piece", // e.g. "kg", "piece", "pack" — shown as "€12.50 / kg"
    optionSelector: "Size", // e.g. "Weight", "Size", "Colour" — labels the variant picker
  },

  // ── Homepage ──────────────────────────────────────────────────────────
  hero: {
    headline: "Chill Streetwear & Style",
    subheadline: "Carefully curated, new and preloved clothing for everyday comfort and expression.",
    primaryCta: { label: "Shop Clothing", href: "/products" },
    secondaryCta: { label: "Secondhand Selection", href: "/secondhand" },
    backgroundImage: "/images/hero-bg.jpg",
    // "dark" = dark/moody image → light text & buttons
    // "light" = light/bright image → dark text & buttons
    theme: "dark",
  },

  announcement: {
    enabled: true,
    text: "Free delivery on orders over €80!",
  },

  usps: [
    { icon: "Zap", title: "Curated Style", description: "Picked for quality, comfort, and individuality" },
    { icon: "Shield", title: "Sustainable Fashion", description: "Mix of new and preloved pieces to reduce waste" },
    { icon: "Truck", title: "Fast Delivery", description: "Reliable shipping across Malta and Gozo" },
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
    pickupAddress: "Trejqet ir-Rummien, Ħal-Għaxaq, GXQ 1210",
  },

  // ── Payments ──────────────────────────────────────────────────────────
  // Maximum 3 gateways may be enabled at once. Enabling more will throw a
  // config-level error at startup. To add a new gateway: create a module in
  // lib/payments/gateways/<name>.ts, add it here, and register it in
  // lib/payments/registry.ts.
  payments: {
    stripe: {
      enabled: true, // Required env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
    },
    cashOnDelivery: {
      enabled: false, // No env vars required
    },
    paypal: {
      enabled: true, // Required env vars: PAYPAL_CLIENT_ID, NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE (sandbox|live)
    },
    revolut: {
      enabled: false, // Required env vars: REVOLUT_API_KEY, NEXT_PUBLIC_REVOLUT_PUBLIC_ID
    },
    trustPayments: {
      enabled: false, // Required env vars: TRUST_PAYMENTS_SITE_REFERENCE, TRUST_PAYMENTS_USERNAME, TRUST_PAYMENTS_PASSWORD
    },
    bov: {
      enabled: false, // Required env vars: BOV_MERCHANT_ID, BOV_API_KEY, BOV_SECRET
    },
    skrill: {
      enabled: false, // Required env vars: SKRILL_MERCHANT_EMAIL, SKRILL_SECRET_WORD
    },
    mollie: {
      enabled: false, // Required env vars: MOLLIE_API_KEY
    },
    fondy: {
      enabled: false, // Required env vars: FONDY_MERCHANT_ID, FONDY_SECRET_KEY
    },
    myPos: {
      enabled: false, // Required env vars: MYPOS_STORE_ID, MYPOS_CLIENT_ID, MYPOS_API_PASSWORD
    },
    sumUp: {
      enabled: false, // Required env vars: SUMUP_CLIENT_ID, SUMUP_CLIENT_SECRET, SUMUP_MERCHANT_CODE
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

  // ── Contact & Social ──────────────────────────────────  ───────────────
  // ── Notifications & Transactional Email ──────────────────────────────
  notifications: {
    // Address used as the "From" on all transactional emails.
    // Must be a verified sender in your Resend account.
    // Can be overridden at deploy-time with the RESEND_FROM_EMAIL env var.
    fromEmail: "orders@limitbreakit.com",
    // Business owner address that receives a copy of every new order.
    ownerEmail: "marco@limitbreakit.com",
  },

  whatsapp: {
    enabled: true,
    number: "+35679052165",
  },

  contact: {
    email: "hello@chill.mt",
    phone: "+356 7905 2165",
    address: "Trejqet ir-Rummien, Ħal-Għaxaq, GXQ 1210",
  },

  social: {
    facebook: "",
    instagram: "",
    twitter: "",
  },

  // ── Legal / GDPR ─────────────────────────────────────────────────────
  legal: {
    companyName: "CHILL Clothing Malta",
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
    // ── Google OAuth ───────────────────────────────────────────────────
    // Toggle Google sign-in per deployment without touching component code.
    // Required steps to activate:
    //   1. Enable the Google provider in Supabase Dashboard → Authentication → Providers.
    //   2. Add your Google OAuth Client ID and Secret in the Supabase Google provider settings.
    //   3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env vars.
    //   4. Add the Supabase callback URL (https://<project>.supabase.co/auth/v1/callback)
    //      to your Google Cloud Console → Authorised redirect URIs.
    //   5. Add your site's /auth/callback URL to Supabase → Authentication → URL Configuration
    //      → Redirect URLs (e.g. https://your-domain.com/auth/callback).
    // Note: If a user already registered with email/password using the same Google email,
    // Supabase will link the accounts automatically (no duplicate records created),
    // provided "Email provider" has "Confirm email" disabled OR the email is already confirmed.
    googleAuth: {
      enabled: true,
    },
  },

  // ── Guest Checkout ────────────────────────────────────────────────────
  // true  = show "Continue as Guest" on the checkout auth page (default)
  // false = force users to register or log in before checking out
  allowGuestCheckout: false,
} as const;

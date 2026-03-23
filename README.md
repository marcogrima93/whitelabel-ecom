# White-Label Ecommerce Platform

A fully white-label, modular ecommerce template built with **Next.js 14**, **Supabase**, **Stripe**, **Tailwind CSS**, and **shadcn/ui**. Designed for deployment on **Vercel**.

Built to replicate Shopify/Squarespace ecommerce functionality while remaining fully custom and brandable per client.

## Features

### Storefront
- **Product Catalog** — Grid layout with filters (category, price, stock), search, sort, and pagination
- **Product Detail Pages** — Image gallery, variants, quantity selector, tabs (description/shipping/reviews)
- **Shopping Cart** — Zustand-powered with localStorage persistence, slide-out drawer + full page
- **Stripe Checkout** — Redirect to Stripe-hosted checkout (PCI compliant out of the box)
- **Guest Checkout** — No account required to purchase
- **Discount Codes** — Percentage and fixed-amount codes with validation
- **SEO** — Dynamic metadata, OG tags on every page

### Customer Accounts
- **Auth** — Email/password via Supabase Auth (login, register, forgot password)
- **Order History** — View past orders with full detail
- **Saved Addresses** — CRUD addresses for faster checkout
- **Profile Settings** — Update name, phone

### Admin Panel (`/admin`)
- **Dashboard** — KPIs (orders today, pending, revenue, customers)
- **Product Management** — Create, list, edit products with pricing, inventory, SEO fields
- **Order Management** — View orders, payment status, fulfillment status
- **Customer List** — View all registered customers
- **Categories** — View/manage product categories
- **Discount Codes** — View active promo codes with usage stats
- **CMS Pages** — View/manage static content pages
- **Settings** — Site configuration reference

### Architecture
- **Modular ecom module** — All ecommerce code lives under `src/modules/ecom/` for easy extraction
- **White-label config** — Single `site.config.ts` controls all branding (name, colors, currency, etc.)
- **Supabase RLS** — Row Level Security on every table
- **Type-safe** — Full TypeScript types for all database tables

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe Checkout Sessions |
| Cart State | Zustand (localStorage) |
| Email | Resend (transactional) |
| Deployment | Vercel |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/marcogrima93/whitelabel-ecom.git
cd whitelabel-ecom
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. Then run `supabase/seed.sql` for sample data
4. Copy your project URL and keys from **Settings > API**

### 3. Set Up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Copy your test keys from the Stripe Dashboard
3. Set up a webhook endpoint pointing to `https://your-domain.com/api/webhooks/stripe`
4. Subscribe to `checkout.session.completed` and `payment_intent.payment_failed` events

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`.

### 5. Customize Branding

Edit `site.config.ts` to set your store name, currency, tax rate, shipping rates, and more.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Project Structure

```
├── site.config.ts              # White-label configuration
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Full DB schema + RLS + triggers
│   └── seed.sql                    # Sample data
├── src/
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── (store)/            # Storefront routes
│   │   │   ├── products/       # Catalog + detail pages
│   │   │   ├── cart/           # Full cart page
│   │   │   └── checkout/       # Stripe checkout + success
│   │   ├── (auth)/             # Login, register, forgot password
│   │   ├── account/            # Customer dashboard
│   │   ├── admin/              # Admin panel (protected)
│   │   ├── (pages)/[slug]/     # Dynamic CMS pages
│   │   └── api/
│   │       ├── checkout/       # Create Stripe session
│   │       └── webhooks/stripe/ # Stripe webhook handler
│   ├── modules/ecom/           # Modular ecommerce module
│   │   ├── components/         # ProductCard, CartDrawer, etc.
│   │   ├── hooks/              # useCart (Zustand)
│   │   ├── lib/                # queries, stripe, utils
│   │   └── types.ts
│   ├── components/
│   │   ├── layout/             # Header, Footer
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/supabase/           # Client, server, admin, middleware
│   └── types/database.ts       # Supabase type definitions
└── public/
    └── placeholder-product.svg
```

## Making It Your Own

### For a New Client Site

1. Fork or clone this repo
2. Edit `site.config.ts` with the client's branding
3. Update Tailwind theme colors in `tailwind.config.ts` and `globals.css`
4. Create a new Supabase project and run the migration
5. Set up Stripe and environment variables
6. Deploy to Vercel

### Removing the Ecom Module

The ecommerce functionality is contained in `src/modules/ecom/`. To retrofit this into a non-ecom site:

1. Delete `src/modules/ecom/`
2. Remove ecom-related routes from `src/app/(store)/`
3. Remove CartDrawer from Header
4. Keep the layout, auth, admin, and CMS components

## Environment Variables

| Variable | Description |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for emails |
| `NEXT_PUBLIC_SITE_URL` | Your site's public URL |
| `ADMIN_EMAIL` | Email for the first admin user |

## Extending

- **Rich text editor**: Integrate Tiptap or Lexical for CMS page editing
- **Image upload**: Wire Supabase Storage upload in the product form
- **Email templates**: Build templates with React Email + Resend
- **Analytics**: Add Recharts charts to the admin dashboard
- **Search**: Upgrade to Supabase full-text search or Algolia
- **i18n**: Add next-intl for multi-language support

## License

MIT — Use freely for client projects.

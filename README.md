# Shopping by Jitesh - Luxury E-Commerce Platform Foundation

"Shopping by Jitesh" is a modern, high-performance, premium e-commerce web platform built with Next.js (App Router), TypeScript, Tailwind CSS v4, and a dual-service architecture (TiDB Cloud SQL for core relational data, and Supabase for authentication & media storage).

---

## 🚀 Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 (`@theme` design tokens in `src/app/globals.css`), Lucide Icons
- **Primary Database**: TiDB Cloud (Relational MySQL-compatible SQL DB Engine)
- **Auxiliary Services**: Supabase (Auth session management & File Storage Buckets for product assets)
- **State Management**: React Context (`CartContext`, `WishlistContext`, `ToastContext`) with `localStorage` persistence
- **Deployment Target**: Vercel

---

## 📁 Architecture & Folder Structure

```
Shopping By Jitesh/
├── db/
│   └── schema.sql              # Normalized SQL database architecture (17 tables)
├── public/                     # Static media & brand assets
├── src/
│   ├── app/                    # Next.js App Router Page Shells
│   │   ├── account/            # User account sub-routes (orders, addresses, profile)
│   │   ├── admin/              # Admin dashboard & management sub-routes
│   │   ├── category/[slug]/    # Category collection page
│   │   ├── checkout/           # Step-by-step express checkout
│   │   ├── products/           # Catalog listing & product detail shells
│   │   ├── search/             # Search results page
│   │   ├── wishlist/           # Saved wishlist page
│   │   ├── cart/               # Shopping bag management
│   │   ├── login/              # Authentication modal / form shell
│   │   ├── globals.css         # Tailwind v4 theme configuration & brand tokens
│   │   └── layout.tsx          # Root layout with Toast, Cart & Wishlist providers
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Input, Badge, Card, Modal, Toast, Skeleton)
│   │   ├── layout/             # Top Header, Announcement Bar, Footer, CartDrawer, MobileNav
│   │   └── features/           # ProductCard, ProductGrid, TrustBadges
│   ├── context/                # Client state managers (Cart, Wishlist, Toast)
│   ├── lib/                    # Env configuration & security validator (`env.ts`)
│   ├── services/               # Decoupled data services & mock catalog data
│   └── types/                  # Strict TypeScript domain interfaces (`index.ts`)
├── .env.example                # Environment variables template
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Architecture (TiDB Cloud vs Supabase)

### 1. TiDB Cloud (Primary Relational Database)
TiDB Cloud serves as the single source of truth for all relational e-commerce transactional data:
- `users`: User profiles, email verification, role management (`customer`, `admin`, `staff`)
- `categories`: Hierarchical product taxonomy with parent-child relationships
- `products`: Product catalog master records with pricing, SKU, average rating, tags
- `product_images`: Multi-image gallery relationships with primary display order
- `product_variants`: Attribute modifiers (color, size, storage)
- `inventory`: Stock reservation & warehouse tracking
- `carts` & `cart_items`: Cart persistence across guest & customer sessions
- `wishlists` & `wishlist_items`: User saved items
- `addresses`: Multi-address book (home, work, other)
- `orders` & `order_items`: Order records, financial totals, status tracking
- `payments`: Financial payment logs & transaction references
- `reviews`: Product reviews with rating constraints (1-5) and verified purchase flags
- `coupons`: Percentage & fixed discount voucher validation
- `notifications`: User notification delivery channel

*Full DDL script is located at [`db/schema.sql`](file:///p:/IDE/Antigravity/Shopping%20By%20Jitesh/db/schema.sql).*

### 2. Supabase (Auxiliary Services Only)
- **Supabase Auth**: OAuth & JWT session handling
- **Supabase Storage**: CDN-backed image bucket hosting for product images and avatars

---

## 🔒 Environment Variables Configuration

Copy `.env.example` to `.env.local` for local execution:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# TiDB Cloud Database Connection
TIDB_HOST="gateway01.ap-south-1.prod.aws.tidbcloud.com"
TIDB_PORT="4000"
TIDB_USER="your_tidb_username"
TIDB_PASSWORD="your_tidb_password"
TIDB_DATABASE="shopping_by_jitesh"
TIDB_SSL="true"

# Supabase Auxiliary Services
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
```

---

## 🛠️ Development & Verification Commands

```bash
# Start local development server
npm run dev

# Run strict TypeScript type checks
npm run type-check

# Run ESLint check
npm run lint

# Build Next.js production bundle
npm run build

# Start production server
npm run start
```

---

## 📜 Deployment Strategy

1. Connect the GitHub repository to **Vercel**.
2. Configure environment variables in Vercel settings.
3. Next.js App Router static optimization automatically builds server components.

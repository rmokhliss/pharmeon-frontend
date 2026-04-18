# Pharmeon Frontend — CLAUDE.md

## Stack
- **Framework:** Next.js 16 App Router
- **UI:** React 19, Tailwind CSS 4 (PostCSS config only — no tailwind.config.js)
- **Language:** TypeScript strict mode
- **PWA:** next-pwa configured

## Auth Architecture

Two parallel auth systems — never mix them:

| System | Token key | User key | Helper |
|--------|-----------|----------|--------|
| Admin | `admin_token` | — | `adminFetch()` from `lib/admin-auth.ts` |
| Client Portal | `portail_token` | `portail_user` | `portailFetch()` from `lib/portail-auth.ts` |

## Role System

Client portal users have a `role` field: `CLIENT_PUBLIC` \| `PRO`

- **PRO** (PHARMACIE/PARA): sees `wholesale_price`, admin-approved before access
- **CLIENT_PUBLIC**: sees `retail_price` only, auto-approved on register
- The API returns a `price` field already computed for the user's role

## API Proxy

All API calls go through `/api/*` → proxied to backend via `next.config.ts`.
**Never call backend URL directly.** Use `adminFetch()` / `portailFetch()` wrappers.

## Directory Structure

```
app/
  ├─ admin/login/        # Admin login page
  ├─ dashboard/          # Admin dashboard + analytics overview
  ├─ products/           # Product CRUD (admin)
  ├─ commandes/          # Order management + price override (admin)
  ├─ clients/            # Client list + PRO approval (admin)
  ├─ fournisseurs/       # Supplier management (admin)
  ├─ purchase-orders/    # BC Fournisseur management (admin)
  ├─ adjustments/        # Stock adjustment vouchers (admin)
  ├─ analytics/          # Full profitability analytics (admin)
  ├─ stock/              # Stock history log (admin)
  └─ portail/
      ├─ page.tsx          # Client login
      ├─ catalogue/        # Role-aware product catalog
      └─ commandes/        # Order tracking with status timeline
components/
  NavBar.tsx, ProductCard.tsx, ProductModal.tsx, Logo.tsx
lib/
  admin-auth.ts, portail-auth.ts
```

## Component Patterns

- `"use client"` at top of every interactive component
- `useState` + `useEffect` for all data fetching
- Auth guard in `useEffect`: redirect if no token
- Inline type definitions at top of file
- **Color system:**
  - Body: `bg-slate-900`
  - Cards: `bg-slate-800 border border-slate-700`
  - Status badges: `yellow`=pending, `blue`=validated, `indigo`=in-progress, `emerald`=done, `red`=error
  - Prices: `text-indigo-400` (retail), `text-purple-400` (wholesale/PRO)
- Forms: `bg-slate-900` inputs inside `bg-slate-800` modals
- All currency: `value.toFixed(2) + " MAD"`

## New Pages Checklist

1. Add `"use client"` at top
2. Redirect to `/admin/login` or `/portail` in `useEffect` if no token
3. Use `adminFetch<T>()` / `portailFetch<T>()` instead of raw `fetch()`
4. NavBar auto-renders on admin paths — no need to include manually
5. Export a single default component per file

## Key API Endpoints

| Feature | Endpoint |
|---------|----------|
| Products (role-aware) | `GET /api/products` |
| Purchase Orders | `GET/POST /api/purchase-orders` |
| PO Status | `PATCH /api/purchase-orders/:id/statut` |
| Order Status | `PATCH /api/commandes/:id/statut` |
| Price Override | `PATCH /api/commandes/:id/items/:itemId/price` |
| Delivery Notes | `GET /api/delivery-notes/commande/:id` |
| Invoices | `GET /api/invoices/commande/:id` |
| Adjustments | `GET/POST /api/adjustments` |
| Analytics | `GET /api/analytics/dashboard` |
| Client Approval | `PATCH /api/clients/:id/approve` |

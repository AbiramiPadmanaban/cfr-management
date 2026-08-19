# Next.js Rendering Handbook

Developer guide for rendering in Next.js (App Router, enterprise-safe). Use this before implementing any new page.

**Source**: Next.js Rendering Handbook (SolidPro-ready). Rendering is a **security decision**, not only a performance choice.

---

## 1. Introduction: What Is Rendering?

In Next.js, **rendering** defines:

- **Where** HTML is generated (server, build, edge, browser)
- **When** it is generated (per request, at build, on revalidate)
- **How** it reaches the user (static, dynamic, client-hydrated)

This affects:

- Security boundaries
- Tenant isolation
- Data visibility
- Performance
- Caching behavior

For enterprise SaaS (e.g. multi-tenant ERP), rendering choices directly impact **tenant isolation** and **data visibility**. Treat them as security decisions.

---

## 2. Master Rendering Decision (Read Before Coding)

Every new page must pass through this decision **before** implementation.

| If the page is…                        | Prefer                  |
| -------------------------------------- | ----------------------- |
| Public and static                      | **SSG**                 |
| Public but changes over time           | **ISR**                 |
| Depends on user, tenant, or auth       | **SSR**                 |
| Purely interactive UI (no auth/tenant) | **CSR** components only |

**Rule**: If unsure at any step → **default to SSR**. SSR is safe; static mistakes can be silent and dangerous (e.g. cross-tenant leakage).

---

## 3. Overview of Rendering Types

| Rendering type | Where HTML is generated | Typical use                           |
| -------------- | ----------------------- | ------------------------------------- |
| **SSR**        | Server, per request     | Authenticated / tenant pages          |
| **CSR**        | Browser                 | Interactive UI                        |
| **SSG**        | Build time              | Marketing, public static pages        |
| **ISR**        | Build + revalidation    | Public dynamic content                |
| **Edge**       | Before rendering        | Auth & tenant validation (middleware) |

Each strategy has strict usage rules below.

---

## 4. Server-Side Rendering (SSR)

### What SSR means

- HTML is generated **on every request**
- Code runs on the **server**
- Full access to: cookies, headers, tenant context, authentication state

SSR is the **default** for product / dashboard pages in multi-tenant apps.

### Example

```tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getExecutionContext();
  const data = await getDashboardData(context.tenantId);
  return <Dashboard data={data} />;
}
```

### When to use SSR

- Authenticated pages
- Tenant-aware dashboards
- Role-based UI
- Secure data access
- Any page using cookies or headers

**Key rule**: If **tenant data** is involved, **SSR is mandatory**.

---

## 5. Security-Critical Rendering Rule

Before choosing any **non-SSR** strategy, validate:

- **Tenant data must never be statically generated**
- **Tenant data must never be cached**
- **Tenant context only exists on the server**

Any violation can cause **cross-tenant data leakage**. When in doubt, use SSR.

---

## 6. Static Site Generation (SSG)

### What SSG means

- HTML is generated **at build time**
- Same content served to all users
- **No** access to cookies or headers

### Example

```tsx
export default function PricingPage() {
  return <Pricing />;
}
```

### When to use SSG

- Marketing pages
- Pricing
- About pages
- Public landing pages

### When NOT to use SSG

- Logged-in pages
- Product UI
- Tenant-specific content

---

## 7. Incremental Static Regeneration (ISR)

### What ISR means

- Page is **statically generated**
- Regenerated in the background at a **fixed interval** (e.g. `revalidate` seconds)

### Example

```tsx
export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublicPosts();
  return <Blog posts={posts} />;
}
```

### ISR safety: hard rules

**Do NOT use ISR** if the page:

- Uses **cookies**
- Uses **headers**
- Uses **tenant data**
- Requires **authentication**

**ISR is public-content only.**

---

## 8. Client-Side Rendering (CSR)

### What CSR means

- Initial HTML is minimal
- Browser fetches data and renders UI
- Runs **after** page load (e.g. `"use client"` components)

### Example

```tsx
"use client";

export function TogglePanel() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>Toggle</button>;
}
```

### When to use CSR

- Interactive UI (toggles, modals, forms)
- Charts and graphs
- Drag-and-drop
- Local state handling

### When NOT to use CSR

- Authentication
- Authorization
- Tenant resolution
- Secure data fetching

---

## 9. Client vs Server Components

Use this **before** marking a component as client-side (`"use client"`).

### Golden rules

| Need                        | Use                                        |
| --------------------------- | ------------------------------------------ |
| Data fetching               | **Server Component**                       |
| Interaction (events, state) | **Client Component**                       |
| Both                        | **Split** into server (data) + client (UI) |

**Correct pattern**: SSR page (or layout) fetches data; pass data as props into small Client Components for interactivity (e.g. dashboard with CSR widgets).

---

## 10. Pages vs Components Rendering Rules

- **Pages** decide: SSR vs SSG vs ISR (and `dynamic`, `revalidate`, etc.).
- **Components** decide: Server vs Client (`"use client"` or default server).
- **Do not mix** these responsibilities (e.g. don’t let a “page” be a client component that fetches tenant data).

---

## 11. Edge Middleware (proxy / middleware)

Edge runs **before** rendering begins.

### Edge is used for

- Tenant resolution
- Product resolution
- Authentication gating
- Early request rejection

### Edge is NOT used for

- Business logic
- Data fetching
- UI rendering

**Mental model**: Edge decides **who** enters; server decides **what** they see; client decides **how** it feels. This order must not be reversed.

---

## 12. Final Fallback Rule

When unsure:

| Situation                           | Use                |
| ----------------------------------- | ------------------ |
| User logged in                      | **SSR**            |
| User not logged in + public content | **SSG** or **ISR** |
| Unsure                              | **SSR**            |

**SSR is safe.** Static mistakes (SSG/ISR with tenant or auth) are silent and dangerous.

---

## 13. Common Beginner Mistakes

| Mistake                                   | Correct approach                         |
| ----------------------------------------- | ---------------------------------------- |
| CSR page for dashboard                    | **SSR** page + **CSR** widgets           |
| ISR for logged-in pages                   | **SSR**                                  |
| Fetching data in client (for auth/tenant) | Fetch on **server**                      |
| Using cookies in ISR                      | **Stop**; use SSR                        |
| Random rendering choices                  | Follow the **decision flow** (Section 2) |

---

## 14. Final Mental Model

```
Edge   → decides who enters
Server → decides what they see
Client → decides how it feels
```

This order must **never** be reversed.

---

## Quick reference

- **Tenant / auth / cookies / headers** → **SSR**
- **Public, static** → **SSG**
- **Public, time-based refresh** → **ISR** (no cookies/tenant/auth)
- **Interactive UI only** → **CSR** components inside server-rendered pages
- **Unsure** → **SSR**

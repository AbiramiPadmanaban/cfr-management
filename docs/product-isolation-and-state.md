# Product Isolation and State

How to enforce product/tenant isolation, where and how to use Prisma, and when to use hooks, Context, or Redux Toolkit.

---

## 1. Product (tenant) isolation

### What it means

- **Product isolation** (or **tenant isolation**): Data and UI are scoped per product/tenant. One tenant must never see or affect another tenant’s data.
- This is a **security and correctness** requirement. Rendering and data access must enforce it.

### Where it is enforced

| Layer                             | Role                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **proxy.ts** (Next.js 16+) / Edge | Resolve tenant (e.g. from subdomain, header, or auth). Reject or redirect before rendering if tenant cannot be determined.                                 |
| **server/tenancy/**               | Provide tenant context for the request: `getTenantId()`, `requireTenant()`, tenant guard. Used by app and modules on the server.                           |
| **server/auth/**                  | Auth and RBAC; often combined with tenancy (user belongs to a tenant).                                                                                     |
| **SSR**                           | Tenant-dependent pages **must** use SSR. Never use SSG or ISR for tenant-specific content. See [Next.js Rendering Handbook](nextjs-rendering-handbook.md). |
| **Data access**                   | Every query that returns tenant-scoped data must filter by tenant (e.g. `where: { tenantId }`).                                                            |

### Rules

- **Tenant context only on the server.** Resolve tenant in proxy/middleware or in server components/layouts; pass tenant id into use cases or handlers. Do not trust the client for tenant id when reading or writing data.
- **No cross-tenant data.** Never return data from one tenant to another. Always scope repositories and queries by `tenantId` (or equivalent) in **modules/\*/infrastructure**.
- **No static/cached tenant data.** Do not use SSG or ISR for pages that show tenant data. Do not cache tenant data in a way that can be shared across tenants.
- **Client-only usage of tenant:** If the client needs tenant id for display or non-sensitive logic (e.g. labels), pass it from the server (e.g. via layout or a small Context filled from server). The client must not be the source of truth for which tenant’s data to fetch; the server must enforce it.

### Flow

1. Request arrives → **proxy** resolves tenant (and auth if needed); reject if invalid.
2. **App** route (page/layout) runs on server; gets tenant from **server/tenancy** (e.g. `getTenantId()` or `requireTenant()`).
3. **Presentation** (handler or server action) receives tenant (or gets it again from server/tenancy) and passes it to **application** use cases.
4. **Application** use cases pass tenant id to **repositories** (via interface).
5. **Infrastructure** (Prisma repos) always add `tenantId` to `where` (or equivalent) so queries are tenant-scoped.

See [server/tenancy/](../server/tenancy/) and [Next.js Rendering Handbook](nextjs-rendering-handbook.md).

---

## 2. How to use Prisma

### Where Prisma is allowed

| Location                               | Allowed? | Use                                                                                                 |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| **lib/prisma.ts**                      | Yes      | Singleton Prisma client instance. Import this in infrastructure only.                               |
| **modules/<name>/infrastructure/**     | Yes      | Repository implementations, mappers. Use `prisma` from lib; implement domain repository interfaces. |
| **prisma/** (schema, migrations, seed) | Yes      | Schema and migrations only; no application logic.                                                   |
| **app/**                               | No       | Never import Prisma or `@prisma/client`.                                                            |
| **modules/\*/domain**                  | No       | No Prisma; only interfaces (e.g. `JobRepository`).                                                  |
| **modules/\*/application**             | No       | No Prisma; use repository interfaces.                                                               |
| **modules/\*/presentation**            | No       | No Prisma; call application use cases.                                                              |

### How to use it

1. **Singleton**: Use the client from **lib/prisma.ts** (e.g. `import { prisma } from '@/lib/prisma'`) only inside **modules/\*/infrastructure**.
2. **Repositories**: In **modules/<name>/infrastructure/**, create classes that implement domain repository interfaces (e.g. `PrismaJobRepository implements JobRepository`). Inside these classes, use `prisma` to run queries and mutations.
3. **Mappers**: Convert between Prisma models and domain entities in **modules/<name>/infrastructure/mappers/** (e.g. `job.mapper.ts`). Repositories use mappers so domain stays free of DB shapes.
4. **Tenant scoping**: In multi-tenant modules, every query that returns tenant-scoped data must include the tenant (e.g. `where: { tenantId }`). Pass `tenantId` from the use case into the repository method; do not read it from global state inside the repo.
5. **No Prisma in app or presentation**: Pages, API routes, server actions, and view components must not import `prisma` or `@prisma/client`. They call application use cases (or presentation handlers that call use cases); use cases use repository interfaces; only infrastructure implements those with Prisma.

See [Folder architecture](folder-architecture.md) and [Dos and don'ts](dos-and-donts.md).

---

## 3. Hooks, Context, and Redux Toolkit

### When to use what

| Need                                                                | Prefer                                                                                                  | Avoid                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Local component state** (toggle, form field)                      | `useState`, `useReducer`                                                                                | Context or Redux for single-component state                         |
| **Shared client state** (theme, sidebar open, selected tab)         | React **Context** or **Redux Toolkit**                                                                  | Prop drilling if tree is deep                                       |
| **Auth / tenant id for client** (read-only, from server)            | **Context** (value set from server in layout) or small **hooks** that read it                           | Storing in Redux unless you need it everywhere with complex updates |
| **Server state** (API/data from backend)                            | **Server Components** + fetch, or **server actions**; if client needs it, **TanStack Query** or **SWR** | Putting all server data in Redux by default                         |
| **Complex global client state** (many slices, devtools, middleware) | **Redux Toolkit**                                                                                       | Context for very large or frequently updated state                  |
| **Reusable logic** (form logic, keyboard nav)                       | Custom **hooks** in **hooks/** or in **modules/<name>/presentation/hooks/**                             | Duplicating logic across components                                 |

### Hooks

- **Where**: Shared hooks in **hooks/** (e.g. `useAuth`, `useTenantId`). Module-specific hooks in **modules/<name>/presentation/hooks/** if they are only used by that module.
- **Use for**: Local state (`useState`, `useReducer`), reusable logic (custom hooks), reading Context, wrapping server actions or data fetching.
- **Naming**: Prefix with `use` (e.g. `useAuth`, `useJobForm`). See [Naming conventions](naming-conventions.md).
- **Rule**: Hooks that need tenant or auth should read from server-provided Context or from props/layout; they must not be the source of tenant id for data access (server enforces that).

### Context

- **Use for**: Passing auth user (read-only), tenant/product id (read-only), theme, sidebar state, or other shared client state that does not need middleware or time-travel.
- **Where**: Provide at **app** or **dashboard** layout level (e.g. `<AuthProvider>`, `<TenantProvider>`). Values can be set from server (e.g. layout fetches user/tenant and passes to provider) or from client (e.g. theme).
- **Product/tenant**: Prefer resolving tenant on the server and passing it into a provider (e.g. layout gets `tenantId` from **server/tenancy**, passes to `<TenantProvider value={tenantId}>`). Client components then use `useContext(TenantContext)` or `useTenantId()` only for display or non-sensitive logic; never use client-provided tenant id to decide what data the server fetches.
- **When to avoid**: Don’t use Context for high-frequency updates or very large state (consider Redux or splitting contexts). Don’t put full server-state cache in Context; use a data-fetching library or Server Components instead.

### Redux Toolkit

- **Use for**: Complex global client state, many slices, need for devtools or middleware (e.g. logging, persistence). Optional; introduce only when Context or local state is insufficient.
- **Where**: If used, put the store and slices in a dedicated folder (e.g. **lib/store/** or **store/**). Wrap the app in the provider at root layout (e.g. `<Provider store={store}>`).
- **When to choose vs Context**: Prefer **Context** for simple shared state (auth, tenant id, theme). Use **Redux Toolkit** when you have multiple slices, complex updates, or need Redux devtools/middleware.
- **Server state**: Prefer Server Components and server actions for data. If the client needs to cache or refetch API data, use **TanStack Query** or **SWR** rather than Redux unless you have a specific need (e.g. offline, cross-page cache). If you do put server data in Redux, keep it clearly separated (e.g. a dedicated slice) and still enforce tenant isolation on the server.

### Summary

- **Local state** → `useState` / `useReducer`.
- **Simple shared client state** (auth, tenant id, theme) → **Context** (values from server where relevant).
- **Reusable logic** → **hooks** in **hooks/** or **modules/<name>/presentation/hooks/**.
- **Complex global client state** → **Redux Toolkit** (optional).
- **Server state / API data** → **Server Components** + fetch or **server actions**; client cache/refetch → **TanStack Query** or **SWR**; use Redux for server state only when justified.

See [Folder architecture](folder-architecture.md) (hooks/, components/) and [Dos and don'ts](dos-and-donts.md).

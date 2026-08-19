# Developer Guide

Practical guide for developers building the Istana ERP app: workflow, patterns, tooling, and environment.

---

## Understanding the Architecture

Istana ERP implements a **5-layer enterprise architecture** via **4-layer Domain-Driven Design (DDD)**:

| Enterprise Layer   | DDD Layer          | Your Daily Work                                                            |
| ------------------ | ------------------ | -------------------------------------------------------------------------- |
| **Client**         | N/A                | Edit pages in `app/`, add components to `components/`                      |
| **Delivery**       | Presentation (API) | Create API routes in `app/api/`, handlers in `modules/*/presentation/api/` |
| **Application**    | Application        | Write use cases in `modules/*/application/`                                |
| **Domain**         | Domain             | Define entities in `modules/*/domain/`                                     |
| **Infrastructure** | Infrastructure     | Implement repos in `modules/*/infrastructure/`                             |

**Key Principle**: Dependencies flow **inward and downward**:

```
Client → Delivery → Application → Domain ← Infrastructure
```

**What This Means**:

- ✅ Client can import Delivery (call API handlers from Server Components)
- ✅ Delivery can import Application (handlers call use cases)
- ✅ Application can import Domain (use cases use entities and repository interfaces)
- ✅ Infrastructure can import Domain (repos implement domain interfaces)
- ❌ Domain CANNOT import Infrastructure (no Prisma in domain)
- ❌ Application CANNOT import Infrastructure (use repository interfaces)
- ❌ Anyone CANNOT skip layers (Client calling Infrastructure directly)

**Read More**: See [enterprise-architecture.md](enterprise-architecture.md) for complete details.

---

## Path aliases

Imports use the `@/` alias pointing at the **project root** (see [tsconfig.json](../tsconfig.json)).

| Alias | Resolves to          | Example                                                                  |
| ----- | -------------------- | ------------------------------------------------------------------------ |
| `@/*` | `./*` (project root) | `@/lib/logger`, `@/modules/production/application/createJob`, `@/config` |

Use `@/` for app and module code; avoid deep relative paths like `../../../lib`.

---

## Types and the types/ folder

**Keep types in a separate folder** and **import** them into the component or function that uses them. Do not define shared types inline in components or functions.

### Where to put types

| Kind                                                                                                  | Location                   | Import from                                                                      |
| ----------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| **App-wide / cross-module** (API response shapes, shared props, DTOs used by app or multiple modules) | **types/**                 | `@/types` or `@/types/index`                                                     |
| **Module-domain** (entities, repository interfaces, value objects for one module)                     | **modules/<name>/domain/** | Within the module or from the module’s public API (e.g. `@/modules/auth/domain`) |

- **types/** at project root: use **types/index.ts** as the main entry (re-export or define types there), or **types/<name>.ts** (e.g. `types/api.ts`, `types/forms.ts`) and import from `@/types/<name>`.
- Components and functions **import** types; they do not define shared types in the same file when that type is reused elsewhere.

### Import examples

```ts
// In a component or server action — import from types/
import type { LoginFormState, ApiError } from "@/types";

// From a named types file
import type { JobFilters } from "@/types/jobs";
```

See [Dos and don'ts — Types: keep in a separate folder](dos-and-donts.md#types-keep-in-a-separate-folder).

---

## Environment and configuration

### Required env vars

- **`DATABASE_URL`** — Used by Prisma (e.g. `file:./prisma/dev.db` for SQLite, or your DB URL).
- **`NODE_ENV`** — Set by Next.js (`development` / `production`); override only if needed.

Add others as the app grows (e.g. auth secrets, external APIs) and expose them via [env.ts](../env.ts) so they are validated in one place. Do not read `process.env` directly in modules; use **config/** or **env.ts**.

### Local setup

1. Copy or create a `.env` file at project root (see [.gitignore](../.gitignore); `.env` is ignored).
2. Set `DATABASE_URL` (and any other vars required by [env.ts](../env.ts)).
3. Run `npm install`, then `npm run dev`.

---

## Prisma workflow

- **Schema folder**: prisma/ � multi-file schema (e.g. [schema.prisma](../prisma/schema.prisma), [auth/auth.prisma](../prisma/auth/auth.prisma), [workflow/workflow.prisma](../prisma/workflow/workflow.prisma)).
- **Migrations**: After changing the schema, run `npx prisma migrate dev` (or `prisma migrate deploy` in CI).
- **Generate client**: `npx prisma generate` (often run automatically by migrate or postinstall).
- **Seed**: [prisma/seed.ts](../prisma/seed.ts). Run with `npx prisma db seed` (if configured in package.json).

**Rule**: Only **modules/\*/infrastructure** and **lib/prisma.ts** (singleton) use the Prisma client. Never import `@prisma/client` or `prisma` in **app/** or in **modules/\*/domain** or **modules/\*/application**. For tenant-scoped queries and full usage patterns, see [Product isolation and state](product-isolation-and-state.md). See also [Folder architecture](folder-architecture.md) and [Dos and don'ts](dos-and-donts.md).

---

## Tailwind 4 (CSS-first)

- **Global CSS**: [app/globals.css](../app/globals.css). Entry: `@import "tailwindcss";`.
- **Theme**: Use the `@theme { }` block in that file (or in [styles/global.css](../styles/global.css) if you move global styles there) for design tokens (colors, fonts, breakpoints).
- **Config**: There is no `tailwind.config.js`; Tailwind 4 uses CSS-first configuration. PostCSS is configured in [postcss.config.mjs](../postcss.config.mjs) with `@tailwindcss/postcss`.

Use Tailwind utility classes in components; keep global overrides and theme in the single global CSS file.

---

## API route pattern

**app/** API routes only **orchestrate**; they do not contain business logic or Prisma.

1. **Define the route** in `app/api/<module>/.../route.ts` (e.g. `app/api/production/jobs/route.ts`).
2. **Parse the request** (e.g. `req.json()` for POST), validate/build a DTO.
3. **Call the handler** from `modules/<module>/presentation/api/` (e.g. `createJobHandler(dto)`).
4. **Return the response** (e.g. `Response.json(result)` or error status).

Handler implementations live in **modules/<name>/presentation/api/handlers.ts** (or split by resource). Handlers call **application** use cases and return serializable results. See [Folder architecture](folder-architecture.md).

---

## Server actions pattern

- **Location**: `modules/<name>/presentation/server-actions/` (e.g. `createJob.action.ts`).
- **Directive**: Top of file: `"use server"`.
- **Role**: Parse input (e.g. form data), optionally validate, call the **application** use case, return result or throw.
- **Usage**: Import and call from **app/** pages/layouts or from **module presentation** views. Do not call use cases or Prisma directly from app; go through server actions or API handlers.

See [Dos and don'ts](dos-and-donts.md) and [Folder architecture](folder-architecture.md).

---

## Adding a new page (app route)

1. **Choose rendering**: Use [Next.js Rendering Handbook](nextjs-rendering-handbook.md). Tenant/auth/cookies → SSR; public static → SSG; etc. Default to SSR if unsure.
2. **Add the route** under **app/** (e.g. `app/(dashboard)/production/jobs/page.tsx`). Keep the page thin: fetch data via server component or server action, render components.
3. **Data**: Fetch in the server component (or layout), or call a server action from a client component. Do not put use-case or repository logic in **app/**; call **modules/\*/presentation** (handlers or server actions).
4. **UI**: Compose from small components. Put module-specific components in **modules/<name>/presentation/views/**; shared ones in **components/**.

---

## Adding a new API route

1. Add `app/api/<module>/<resource>/route.ts` (or nested path as needed).
2. Export `GET`, `POST`, etc. Parse request, build DTO, call handler from `modules/<module>/presentation/api/`.
3. Implement the handler in `modules/<module>/presentation/api/handlers.ts` (or a dedicated file); handler calls application use cases and returns JSON-friendly data.

---

## Adding a new module

1. **Create the layer folders** under `modules/<name>/`: `domain/`, `application/`, `infrastructure/`, `presentation/`.
2. **Domain**: Add entities, value objects, repository interfaces, and rules (no Prisma, no Next, no UI). See [Naming conventions](naming-conventions.md).
3. **Application**: Add use cases, DTOs, and services; use domain and repository interfaces only.
4. **Infrastructure**: Add Prisma repository implementations and mappers; implement domain repository interfaces.
5. **Presentation**: Add API handlers, server actions, and view components; call application use cases only.
6. **App wiring**: Add a page under `app/(dashboard)/<name>/` (or the right route group) and, if needed, `app/api/<name>/.../route.ts` that delegate to the new module’s presentation layer.

Use existing modules (e.g. **production**) as a reference. See [Folder architecture](folder-architecture.md) and [Modules overview](modules/README.md).

---

## Request flow (5-layer architecture)

### API Request Flow

**When a user makes an API call** (e.g., `POST /api/production/items`):

1. **CLIENT LAYER**:
   - Browser sends request to Next.js
   - Example: `fetch('/api/production/items', { method: 'POST', body: JSON.stringify(data) })`

2. **DELIVERY ENTRY POINT**:
   - `app/api/production/items/route.ts` receives HTTP request
   - Validates authentication (`requireSessionForApi()`)
   - Parses request body/params

3. **DELIVERY IMPLEMENTATION**:
   - Calls `modules/production/presentation/api/handlers/create-item-handler.ts`
   - Handler validates input (Zod schema)
   - Handler calls application use case

4. **APPLICATION LAYER**:
   - Use case in `modules/production/application/create-item.ts`
   - Orchestrates business workflow
   - Uses repository interfaces from domain

5. **DOMAIN LAYER**:
   - Entities and interfaces in `modules/production/domain/`
   - Business rules applied
   - Repository interface defines contract

6. **INFRASTRUCTURE LAYER**:
   - Repository implementation in `modules/production/infrastructure/item.prisma-repo.ts`
   - Queries Prisma
   - Maps database models to domain entities

7. **RESPONSE FLOWS BACK**:
   - Infrastructure → Application → Delivery → Client
   - Each layer returns data to the calling layer

**Visual Flow**:

```
Browser (CLIENT)
  ↓ HTTP POST
app/api/production/items/route.ts (DELIVERY ENTRY)
  ↓ call handler
modules/production/presentation/api/handlers/create-item-handler.ts (DELIVERY IMPL)
  ↓ call use case
modules/production/application/create-item.ts (APPLICATION)
  ↓ use repository interface
modules/production/domain/ItemRepository.ts (DOMAIN - interface)
  ↑ implements interface
modules/production/infrastructure/item.prisma-repo.ts (INFRASTRUCTURE)
  ↓ query
Prisma → PostgreSQL
```

### Page Load Flow (SSR)

**When a user navigates to a page** (e.g., `/dashboard/production/items`):

1. **CLIENT**: Browser requests page
2. **SERVER COMPONENT**: `app/(dashboard)/production/items/page.tsx` (async function)
3. **DELIVERY**: Server component calls presentation handlers directly (e.g., `listItemsHandler()`)
4. **APPLICATION**: Handlers call use cases
5. **INFRASTRUCTURE**: Use cases call repositories
6. **RENDER**: Server component passes data as props to client components

**Visual Flow**:

```
Browser requests page (CLIENT)
  ↓
app/(dashboard)/production/items/page.tsx (CLIENT - Server Component)
  ↓ await listItemsHandler()
modules/production/presentation/api/handlers/list-items-handler.ts (DELIVERY)
  ↓ call use case
modules/production/application/list-items.ts (APPLICATION)
  ↓ use repository
modules/production/infrastructure/item.prisma-repo.ts (INFRASTRUCTURE)
  ↓
Prisma → PostgreSQL
  ↓
HTML rendered with data → Browser
```

### Server Action Flow

**When a user submits a form** (e.g., create production item form):

1. **CLIENT**: `<form action={createItemAction}>`
2. **DELIVERY**: `modules/production/presentation/server-actions/create-item.action.ts`
   - Parse formData
   - Validate input (Zod)
   - Call application use case
3. **APPLICATION**: `modules/production/application/create-item.ts`
4. **INFRASTRUCTURE**: Repository implementation
5. **REVALIDATE**: `revalidatePath()` triggers Server Component re-render
6. **CLIENT**: Page automatically refreshes with new data

**Key Rules**:

- ❌ Do NOT skip layers (Client → Infrastructure)
- ❌ Do NOT call Prisma from app/, domain/, or application/
- ✅ Always flow through layers: Client → Delivery → Application → Domain ← Infrastructure

See [Enterprise Architecture Guide](./enterprise-architecture.md) for complete layer details.

---

## Testing

The project does not yet prescribe a specific testing framework. When you add tests:

- **Unit**: Domain and application logic (use cases, rules) are good candidates; keep them framework-agnostic.
- **Integration**: Test API routes and server actions with real or mocked use cases/repositories.
- **E2E**: Use the app routes as entry points; follow the same rendering and auth rules as production.

Place tests next to the code (e.g. `*.test.ts`, `*.spec.ts`) or in a dedicated `**/__tests__/` or `**/*.test/` structure; align with [Folder architecture](folder-architecture.md) (e.g. no Prisma in domain tests; mock repositories in application tests).

---

## Quick checklist for new work

- [ ] Rendering: SSR for tenant/auth/cookies; SSG/ISR only for public content ([Next.js Rendering Handbook](nextjs-rendering-handbook.md)).
- [ ] No business logic or Prisma in **app/**; delegate to module presentation.
- [ ] Component-based UI; no monolithic components ([Dos and don'ts](dos-and-donts.md)).
- [ ] No `any`; use explicit types or `unknown` + type guards.
- [ ] **Types in types/**: define shared types in **types/** and import them in components/functions ([Dos and don'ts — Types](dos-and-donts.md#types-keep-in-a-separate-folder)).
- [ ] New module? All four layers; app route and API route point at presentation only.
- [ ] Env vars via **env.ts** / **config**; Prisma only in infrastructure and **lib/prisma.ts**.

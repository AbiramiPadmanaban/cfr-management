# Folder Architecture

Root-level structure and responsibilities. All application code lives at **project root** (no `src/`).

**Architecture principles** (see [Dos and don'ts](dos-and-donts.md)):

- **Component-based, no monoliths** — UI and features are built from small, single-responsibility components; monolithic pages or components are prohibited.
- **No `any`** — The TypeScript `any` type is strictly prohibited; use explicit types, interfaces, or `unknown` with type guards.

---

## Root layout

```
istana/
├── app/                 # Next.js App Router (UI + routing only)
├── modules/             # Business domains (ERP modules)
├── lib/                 # Shared infrastructure utilities
├── prisma/              # Prisma schema and migrations
├── server/              # Server-only cross-cutting logic
├── types/               # Global TypeScript types
├── config/              # App and environment configuration
├── hooks/               # Shared React hooks
├── components/          # Shared UI components
├── styles/              # Global styles
├── docs/                # Project documentation
├── middleware.ts        # (Next.js: use proxy.ts in Next 16+)
├── proxy.ts             # Next.js 16+ request proxy
└── env.ts               # Validated environment variables
```

---

## app/ — Routing layer (Client + Delivery Entry Points)

**Role**: Thin, declarative routing. No business logic, no Prisma, no direct DB access.

| Path                                            | Purpose                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `app/layout.tsx`                                | Root layout (required; html, body, global CSS)                                 |
| `app/page.tsx`                                  | Home page                                                                      |
| `app/error.tsx`, `loading.tsx`, `not-found.tsx` | Global error, loading, 404                                                     |
| `app/(auth)/`                                   | Auth route group (login, logout)                                               |
| `app/(dashboard)/`                              | Dashboard group: layout + module routes (production, finance, inventory, hrms) |
| `app/api/<module>/`                             | **Delivery Layer**: API routes (HTTP entry points)                             |

**Rule**: Routes map to modules; API route handlers delegate to `modules/<name>/presentation/api/` or server actions.

---

## app/api/ — Delivery Layer (HTTP Entry Points)

**Role**: HTTP request handling and routing. This is the entry point for all API requests.

**Structure**:

```
app/api/
├── <module>/
│   ├── route.ts              # GET, POST handlers
│   ├── [id]/
│   │   └── route.ts          # GET, PUT, DELETE with params
│   └── [id]/complete/
│       └── route.ts          # Custom actions
```

**Responsibilities**:

- ✅ Parse HTTP requests (body, query params, headers)
- ✅ Validate authentication (requireSessionForApi)
- ✅ Delegate to presentation handlers (`modules/*/presentation/api/`)
- ✅ Format HTTP responses (JSON, status codes)
- ✅ Handle errors with proper HTTP status

**Rules**:

- ❌ MUST be thin (no business logic)
- ❌ MUST NOT import infrastructure or use Prisma
- ❌ MUST NOT contain domain logic
- ✅ MUST delegate to `modules/*/presentation/api/` handlers

**Example**:

```typescript
// app/api/production/items/route.ts (DELIVERY ENTRY)
import { NextRequest, NextResponse } from "next/server";
import { requireSessionForApi } from "@/server/auth/requireAuth";
import { listProductionItemsHandler } from "@/modules/production/presentation/api";

export async function GET(req: NextRequest) {
  const session = await requireSessionForApi();
  if (session instanceof NextResponse) return session;

  const items = await listProductionItemsHandler(session.user.id); // Calls PRESENTATION
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireSessionForApi();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const item = await createProductionItemHandler(body, session.user.id);
  return NextResponse.json(item, { status: 201 });
}
```

### Relationship to Presentation Layer

The Delivery layer (`app/api/`) is the **HTTP entry point** that delegates to the Presentation layer implementation (`modules/*/presentation/api/`):

- **app/api/**: Thin routing, auth validation, HTTP request/response handling
- **modules/\*/presentation/api/**: Handler implementation, caching, use case orchestration

**Flow**:

```
HTTP Request
  ↓
app/api/<module>/route.ts (Delivery Entry)
  ↓
modules/<module>/presentation/api/handlers/*.ts (Delivery Implementation)
  ↓
modules/<module>/application/*.ts (Application/Use Cases)
  ↓
modules/<module>/infrastructure/*.ts (Infrastructure/Persistence)
```

---

## modules/ — Business domains

**Role**: Heart of the system. Each ERP module is self-contained with four layers.

### Per-module structure

```
modules/<name>/
├── domain/          # Pure business logic (entities, value objects, repository interfaces, rules)
├── application/     # Use cases, DTOs, services
├── infrastructure/  # Prisma repos, mappers (Prisma lives only here)
└── presentation/    # API handlers, server actions, views
```

### modules/\*/presentation — Presentation & Delivery Implementation

**Role**: Two aspects:

1. **Delivery Implementation** (server-side): API handlers, server actions
2. **View/UI** (client-side): Module-specific components, hooks

**Structure**:

```
modules/<name>/presentation/
├── api/              # Server-side handlers (Delivery implementation)
│   ├── handlers/     # Individual handler files
│   └── index.ts      # Barrel export (40+ exports in production)
├── server-actions/   # Next.js server actions (Delivery implementation)
├── components/       # Module-specific UI (View aspect)
├── hooks/            # Module-specific React hooks (View aspect)
└── views/            # Page-level components (View aspect)
```

**API Handlers** (Delivery implementation):

- ✅ Wrapped with `React.cache()` for request deduplication
- ✅ Instantiate infrastructure (repositories, services)
- ✅ Inject dependencies into application use cases (Dependency Injection)
- ✅ Call application use cases
- ✅ Return serializable data
- ✅ Called by `app/api/` routes OR directly from Server Components

**Server Actions** (Delivery implementation):

- ✅ Top-of-file `"use server"` directive
- ✅ Form submission handlers
- ✅ Validate input, call application use cases
- ✅ Used in client components

**Components** (View aspect):

- ✅ Module-specific UI components
- ❌ Never exported outside the module
- ✅ Can import from `components/shared/`

**Rules**:

- ✅ Handlers MUST use `React.cache()` if called multiple times
- ✅ Handlers CAN import infrastructure for dependency injection
- ❌ Handlers MUST NOT contain business logic
- ❌ UI Components MUST NOT import infrastructure

**Example Handler** (with Dependency Injection):

```typescript
// modules/production/presentation/api/handlers/list-items-handler.ts
import { cache } from "react";
import { ListProductionItemsUseCase } from "@/modules/production/application/list-items";
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/production-item.prisma-repo";

export const listProductionItemsHandler = cache(async (userId: string) => {
  // Presentation layer does dependency injection
  const repository = new PrismaProductionItemRepository();
  const useCase = new ListProductionItemsUseCase(repository);

  return await useCase.execute({ userId });
});
```

**Example Server Action**:

```typescript
// modules/production/presentation/server-actions/create-item.action.ts
"use server";

import { requireSession } from "@/server/auth/requireAuth";
import { CreateProductionItemUseCase } from "@/modules/production/application/create-item";
import { revalidatePath } from "next/cache";

export async function createProductionItemAction(formData: FormData) {
  const session = await requireSession();
  if (!session) throw new Error("Unauthorized");

  const useCase = new CreateProductionItemUseCase();
  const item = await useCase.execute({
    name: formData.get("name") as string,
    quantity: Number(formData.get("quantity")),
  });

  revalidatePath("/dashboard/production/items");
  return { success: true, item };
}
```

### Layer responsibilities

| Layer              | Contains                                               | Must not contain      |
| ------------------ | ------------------------------------------------------ | --------------------- |
| **domain**         | Entities, value objects, repository interfaces, rules  | Prisma, Next.js, UI   |
| **application**    | Use cases, DTOs, services; workflow logic              | Prisma, UI components |
| **infrastructure** | Prisma repository implementations, mappers             | Business rules        |
| **presentation**   | API handlers (cached), server actions, view components | Direct Prisma usage   |

### Module list

- `production` — Manufacturing / jobs / work orders / BOM
- `finance` — Finance
- `inventory` — Inventory
- `hrms` — Human resources
- `shared` — Shared domain or cross-module types/utilities

---

## lib/ — Shared infrastructure

**Role**: Utilities used across modules and app. Singleton Prisma client lives here; only infrastructure repos should use it.

| Typical files | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| `prisma.ts`   | Singleton Prisma client (used by module infrastructure only) |
| `logger.ts`   | Logging                                                      |
| `date.ts`     | Date helpers                                                 |
| `cache.ts`    | Caching utilities                                            |
| `errors.ts`   | Custom error classes                                         |

---

## server/ — Cross-module server logic

**Role**: Auth, tenancy, audit, events — not tied to a single module.

| Path              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `server/auth/`    | Permissions, RBAC                          |
| `server/tenancy/` | Tenant context, tenant guard               |
| `server/audit/`   | Audit logger                               |
| `server/events/`  | Domain events / cross-module orchestration |

---

## prisma/ — Database layer

**Role**: Global schema, migrations, seed. Only **infrastructure** code imports Prisma Client.

- `schema.prisma` — Data model
- `migrations/` — Migration history
- `seed/` — Seed script(s)

---

## types/, config/, hooks/, components/, styles/

| Folder          | Role                                                   |
| --------------- | ------------------------------------------------------ |
| **types/**      | Global TypeScript types and interfaces                 |
| **config/**     | App and env configuration (e.g. reading from `env.ts`) |
| **hooks/**      | Shared React hooks                                     |
| **components/** | Shared UI components (not module-specific)             |
| **styles/**     | Global CSS (e.g. Tailwind entry, `@theme`)             |

### Two-tier component rule

Every component belongs to exactly one tier:

```
components/ui/         → shadcn/Radix primitives only. No business logic. No data fetching.
components/shared/     → Reusable cross-module display components (e.g. EntityPageHeader, SectionCard).
                         Props-only: no direct API calls, no global state.
modules/*/presentation/components/
                       → Domain components. Belong to one module. Never imported by another module.
```

**Never** place a module-specific component (e.g. `QuotationHeader`, `WorkflowList`) inside `components/` at root level — it must live inside its module's `presentation/components/`.

### Barrel export expectations

- `lib/index.ts` — barrel re-exporting all public utilities from `lib/`
- `server/index.ts` — barrel re-exporting all public cross-cutting server functions from `server/`
- `types/index.ts` — barrel re-exporting all type files from `types/`
- `components/index.ts` — barrel re-exporting shared root-level components

---

## Root files

| File       | Role                                            |
| ---------- | ----------------------------------------------- |
| `proxy.ts` | Next.js 16+ request proxy (stub or real config) |
| `env.ts`   | Validated environment variables                 |

---

## Dependency direction and flow

### Dependency Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│                  (app/, components/)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ can import ↓
┌──────────────────────────▼──────────────────────────────────┐
│                  DELIVERY LAYER                              │
│        (app/api/, modules/*/presentation/api/)              │
└──────────────────────────┬──────────────────────────────────┘
                           │ can import ↓
┌──────────────────────────▼──────────────────────────────────┐
│                APPLICATION LAYER                             │
│              (modules/*/application/)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ can import ↓
┌──────────────────────────▼──────────────────────────────────┐
│                   DOMAIN LAYER                               │
│                (modules/*/domain/)                           │
│         (defines interfaces, contracts)                      │
└──────────────────────────▲──────────────────────────────────┘
                           │ implements ↑
┌──────────────────────────┴──────────────────────────────────┐
│               INFRASTRUCTURE LAYER                           │
│       (modules/*/infrastructure/, lib/prisma.ts)            │
└─────────────────────────────────────────────────────────────┘

Cross-Cutting:
┌─────────────────────────────────────────────────────────────┐
│         server/ (auth, tenancy, audit, events)              │
│         lib/ (utilities, cache, email, errors)              │
│         → Can be imported by any layer                       │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules

**Allowed**:

- **app/** → calls **modules/\*/presentation** (handlers, server actions); uses **server/** and **lib/**
- **modules/\*/presentation** → calls **modules/\*/application**, imports **modules/\*/domain**; uses **server/** and **lib/**
- **modules/\*/application** → uses **modules/\*/domain** (entities, repository interfaces); never infrastructure directly
- **modules/\*/infrastructure** → implements **modules/\*/domain** repository interfaces; uses **lib/prisma** and **prisma/schema**
- **server/** → can be used by app and modules for auth, tenancy, audit, events
- **lib/** → can be used by infrastructure for prisma, utilities, cache

**Forbidden**:

- ❌ **app/** cannot import **infrastructure**, **domain**, or **application**
- ❌ **modules/\*/presentation** cannot import **infrastructure**
- ❌ **modules/\*/application** cannot import **infrastructure** or **presentation**
- ❌ **modules/\*/domain** cannot import any other layer (pure types/interfaces only)
- ❌ **modules/\*/infrastructure** cannot import **application** or **presentation**

### Prisma Isolation

Prisma (`@prisma/client`) is **ONLY** imported in:

- ✅ `lib/prisma.ts` (singleton Prisma client)
- ✅ `modules/*/infrastructure/*.prisma-repo.ts` (repository implementations)

Prisma is **NEVER** imported in:

- ❌ `app/`
- ❌ `modules/*/domain`
- ❌ `modules/*/application`
- ❌ `modules/*/presentation`

### Example Import Paths

**✅ Valid imports**:

```typescript
// app/api/production/items/route.ts
import { listProductionItemsHandler } from "@/modules/production/presentation/api";
import { requireSessionForApi } from "@/server/auth/requireAuth";

// modules/production/presentation/api/handlers/list-items-handler.ts
import { ListProductionItemsUseCase } from "@/modules/production/application/list-items";
import { cache } from "react";

// modules/production/application/list-items.ts
import { ProductionItemRepository } from "@/modules/production/domain/ProductionItemRepository";
import { eventBus } from "@/server/events/event-bus";

// modules/production/infrastructure/production-item.prisma-repo.ts
import { ProductionItemRepository } from "@/modules/production/domain/ProductionItemRepository";
import { prisma } from "@/lib/prisma";
```

**❌ Invalid imports**:

```typescript
// app/api/production/items/route.ts
import { prisma } from "@/lib/prisma"; // ❌ API routes cannot import Prisma
import { ProductionItem } from "@/modules/production/domain/ProductionItem"; // ❌ Skip layers

// modules/production/application/list-items.ts
import { prisma } from "@/lib/prisma"; // ❌ Application cannot import infrastructure
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/..."; // ❌

// modules/production/domain/ProductionItem.ts
import { auditLog } from "@/server/audit/auditLog"; // ❌ Domain must be pure
```

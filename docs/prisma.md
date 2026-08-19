# Prisma (Istana ERP)

Prisma is the single source of truth for the database schema in Istana ERP. This document explains **how Prisma is configured**, **how multi-file schemas work in Prisma 7**, and **how to work with it safely in this project**.

---

## 1. Where Prisma lives

- **Config**: `prisma.config.ts`
- **Schema folder**: `prisma/` (multi-file schema)
- **Client singleton**: `lib/prisma.ts`
- **Migrations**: `prisma/migrations/`
- **Seed**: `prisma/seed.ts` and helper seed scripts in `prisma/`

Only **`modules/<name>/infrastructure/`** and **`lib/prisma.ts`** import and use Prisma Client. Never import `@prisma/client` or `prisma` in:

- `app/` (pages, layouts, API routes)
- `modules/*/domain/`
- `modules/*/application/`

See also:

- [Folder architecture](folder-architecture.md)
- [Product isolation and state](product-isolation-and-state.md)
- [Dos and don'ts](dos-and-donts.md#prisma-and-data-access)

---

## 2. Prisma 7 config (prisma.config.ts)

Istana uses Prisma 7’s **config file** and **schema folder** support:

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Treat the entire prisma directory as the schema folder.
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npm run db:seed",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

Key points:

- **`schema: "prisma"`** tells Prisma to recursively load **all `*.prisma` files** under `prisma/` as one logical schema.
- **Datasource URL** (`DATABASE_URL`) is configured **in `prisma.config.ts`**, not in `schema.prisma` anymore (Prisma 7 requirement).
- Migrations and seed are wired through the `migrations` block; CLI commands reuse this configuration.

---

## 3. Multi-file Prisma schema

The schema is **split by domain** but treated as a single schema by Prisma:

```text
prisma/
├── migrations/
├── auth/
│   └── auth.prisma           # User, Role, tokens, rate-limit, etc.
├── workflow/
│   └── workflow.prisma       # Workflow, steps, approvals, ReferenceContext
└── schema.prisma             # generator, datasource, remaining models
```

Rules:

- `schema.prisma` (with the `generator` + `datasource`) must be at the **same level** as `migrations/`.
- Additional `.prisma` files can live in subfolders (e.g. `auth/`, `workflow/`, later `inventory/`, `production/`, etc.).
- Prisma combines all of them when you run any CLI command:
  - `npx prisma format`
  - `npx prisma generate`
  - `npx prisma migrate dev`
  - `npx prisma db push`

You do **not** import between `.prisma` files; all models and enums share a single namespace.

---

## 4. Prisma commands you should use

From the project root:

```bash
# Format all Prisma schema files (multi-file)
npx prisma format

# Generate Prisma Client
npx prisma generate

# Dev migration (adds a new migration + updates DB and client)
npx prisma migrate dev --name <describe_change>

# Quick dev sync when you only changed the schema and don't need migrations
npx prisma db push

# Seed database
npx prisma db seed

# Prisma Studio (v7; uses prisma.config.ts)
npx prisma studio --config ./prisma.config.ts
```

CI and local `npm run ci` will also indirectly validate the schema via `tsc` (through the generated client) and the build.

---

## 5. Making schema changes (workflow)

1. **Locate the correct schema file** in `prisma/`:
   - Auth: `prisma/auth/auth.prisma`
   - Workflow: `prisma/workflow/workflow.prisma`
   - Other domains: currently in `prisma/schema.prisma` until they are split out.
2. **Edit or add models/enums** in the appropriate file.
3. Run:
   - `npx prisma format`
   - `npx prisma generate`
4. For production-ready changes, also create a migration:

   ```bash
   npx prisma migrate dev --name <describe_change>
   ```

5. If needed, update seed logic in `prisma/seed.ts` and related scripts.

---

## 6. Where NOT to use Prisma

To keep architecture clean and avoid cross-cutting issues:

- Never call Prisma Client from:
  - `app/` (including API routes)
  - React components (server or client)
  - `modules/*/domain/` or `modules/*/application/`
- Always go through:
  - `lib/prisma.ts` (singleton client)
  - Repository implementations in `modules/<name>/infrastructure/*.prisma-repo.ts`
  - Application use cases + presentation layer (API handlers or server actions)

This matches:

- [Folder architecture](folder-architecture.md#prisma--database-layer)
- [Dos and don'ts](dos-and-donts.md#prisma-and-data-access)

# Dos and Don'ts

Rules and anti-patterns for the Istana ERP codebase. Follow these to keep the architecture clean and scalable.

---

## Component-based architecture (no monoliths)

### Do

- Build the UI and features from **small, single-responsibility components**.
- Compose pages and views from components; each component does one thing (layout, list, form, button, etc.).
- Keep components **focused**: one concern per file; split when a component grows beyond a clear responsibility.
- Prefer **many small components** over few large ones; reuse and test at component level.
- Keep **presentation** (views) in modules as component trees, not single monolithic files.

### Don't

- Don’t build **monolithic** pages or components (e.g. one giant file that does routing, layout, data, and all UI).
- Don’t put unrelated UI or logic in one component; split by responsibility.
- Don’t duplicate component trees when you can extract shared pieces into **components/** or module presentation.

**Rule**: Architecture is **always component-based**; monoliths are prohibited.

---

## TypeScript: no `any`

### Do

- Use **explicit types** for function parameters, return values, and public APIs (interfaces, types, generics).
- Keep shared types in **types/** and import them into components and functions (see [Types: keep in a separate folder](#types-keep-in-a-separate-folder)).
- Use **generics** when types vary (e.g. `Repository<T>`, `Result<T, E>`); avoid escaping to `any`.
- Rely on **type inference** only where the type is obvious (e.g. local variables); still avoid `any`.

### Don't

- **Do not use `any`.** It is **strictly prohibited** in the codebase.
- Don’t use `any` to “fix” type errors; fix the types (add interfaces, narrow types, or use `unknown` and narrow).
- Don’t use `// @ts-ignore` or `as any` to bypass type checking; resolve the underlying type issue.

**Rule**: **Any** types are **strictly prohibited**. Use `unknown` with type guards if the type is truly dynamic; otherwise define proper types.

---

## Types: keep in a separate folder

### Do

- **Keep types in the types/ folder** at project root. Use **types/index.ts** (or **types/\*.ts** by concern) as the place for shared TypeScript types and interfaces.
- **Import types** from **types/** into the component or function that uses them (e.g. `import type { FooProps } from "@/types"`).
- Put **global or cross-module** types in **types/** (e.g. API response shapes, shared props, app-wide DTOs).
- Put **module-domain** types (entities, repository interfaces, value objects) in **modules/<name>/domain/** and import them within that module or from the module’s public API.
- Re-export from **types/index.ts** for a single entry point, or use **types/<name>.ts** and import from `@/types/<name>` as needed.

### Don't

- Don’t **inline** complex object shapes in component props or function signatures; define them in **types/** (or module domain) and import.
- Don’t **duplicate** type definitions across files; define once in **types/** or module domain and import.
- Don’t keep shared types only in the same file as the component or function when that type is reused elsewhere; move it to **types/** and import it in each place.

**Rule**: **Types live in a separate folder** (**types/** for app-wide/shared types; **modules/\*/domain** for domain types). Components and functions **import** those types; they do not define shared types inline.

---

## Structure

### Do

- Keep all application code at **project root** (standard Next.js app structure; no `src/`).
- Put every new feature that has business logic inside the right **module** (production, finance, inventory, hrms, or shared).
- Use the four layers inside modules: **domain**, **application**, **infrastructure**, **presentation**.
- Keep **app/** thin: only routing, layouts, and delegation to module presentation (handlers, server actions).
- Mirror API routes to modules: `app/api/production/*` → `modules/production/presentation/api/`.
- Use **route groups** for layout segments: `(auth)`, `(dashboard)`.

### Don't

- Don't use a `src/` directory; keep the default Next.js root-level layout.
- Don't put business logic in **app/** (no use cases, no domain rules, no repository calls in pages or API routes).
- Don't create feature folders or “pages” that mix UI and domain; use **modules/** and their presentation layer.
- Don't add new root-level folders that duplicate the role of existing ones (e.g. no `services/` at root — use **modules/\*/application** or **server/**).

---

## Prisma and data access

### Do

- Keep **Prisma** only in:
  - **lib/prisma.ts** (singleton client),
  - **modules/<name>/infrastructure/** (repository implementations, mappers).
- Implement **repository interfaces** defined in **domain** inside **infrastructure** (e.g. `PrismaJobRepository`).
- Keep **prisma/** at root for schema, migrations, and seed only.

### Don't

- Don't import Prisma or `@prisma/client` in **app/** (pages, layouts, API route handlers).
- Don't import Prisma in **modules/\*/domain** or **modules/\*/application** (use interfaces only).
- Don't call `prisma.*` from UI components or server actions directly; go through application use cases and repositories.

---

## App router (app/)

### Do

- Use **layout.tsx**, **page.tsx**, **loading.tsx**, **error.tsx**, **not-found.tsx** as per Next.js conventions.
- In API routes, parse the request, build a DTO, then call a **module presentation handler** or **server action**.
- Use **server actions** in `modules/<name>/presentation/server-actions/` and call them from app or from module views.

### Don't

- Don't put use-case logic, validation rules, or repository calls inside **app/** files.
- Don't import from **modules/\*/domain** or **modules/\*/infrastructure** in app; only from **presentation** (or **server/** for auth/tenancy/audit).
- Don't use Prisma in **app/api/** route handlers.

---

## Modules

### Do

- Keep **domain** pure: entities, value objects, repository interfaces, rules; no framework or DB imports.
- Keep **application** use cases orchestrating domain and repositories (via interfaces); no Prisma, no UI.
- Keep **infrastructure** as the only place that implements repositories and uses Prisma/mappers.
- Keep **presentation** as the boundary: API handlers, server actions, views that call application use cases.

### Don't

- Don't skip layers (e.g. UI calling infrastructure or Prisma directly).
- Don't put UI components that belong to a module outside that module’s **presentation** (e.g. don’t put “JobList” in **components/** if it’s production-specific — put it in **modules/production/presentation/views/**).
- Don't share domain entities by importing from one module’s domain into another’s domain; use **shared** or application-level contracts (DTOs, events).

---

## Layer Boundaries (5-Layer Architecture)

### Do

- **Respect layer boundaries**: Client → Delivery → Application → Domain ← Infrastructure
- **Use dependency inversion**: Application depends on Domain repository **interfaces**, Infrastructure **implements** them
- **Presentation does dependency injection**: Presentation layer instantiates infrastructure and injects into application
- **Keep delivery thin**: `app/api/` routes should parse → validate → call handler → return response
- **Wrap handlers with cache()**: All `modules/*/presentation/api/` handlers should use `React.cache()` for deduplication
- **Pass data as props**: Server Components fetch data, pass to Client Components via `initialData` props
- **Use repository interfaces in application layer**: Never import infrastructure from application
- **Define contracts in domain**: Repository interfaces, entity types, business rules in domain
- **Map database models to domain entities**: Infrastructure repos should transform Prisma models to domain types

### Don't

- **Don't skip layers**: Client components should NEVER call Infrastructure directly
- **Don't import upward**: Domain cannot import Application, Infrastructure, or Presentation
- **Don't import @prisma/client outside infrastructure**: Only `lib/prisma.ts` and `modules/*/infrastructure/` can import Prisma
- **Don't put business logic in delivery**: `app/api/` routes and handlers should orchestrate, not implement logic
- **Don't call Prisma from Client Components**: All Prisma calls MUST be in Infrastructure layer
- **Don't use `any` types**: Use `unknown` with type guards if type is truly dynamic
- **Don't ignore architecture verification failures**: If scripts flag violations, fix them before merging

### Common Violations and Fixes

| Violation                                     | Why It's Bad                            | Fix                                    |
| --------------------------------------------- | --------------------------------------- | -------------------------------------- |
| **Importing Prisma in Application**           | Breaks layer separation, tight coupling | Use repository interface from Domain   |
| **Business logic in API routes**              | Hard to test, violates SRP              | Move to Application use case           |
| **Client component with useEffect fetch**     | Slow, waterfall, bad UX                 | Server Component with SSR              |
| **Domain importing Infrastructure**           | Circular dependency risk                | Use dependency inversion               |
| **Skipping Application layer**                | Tight coupling to infrastructure        | Always use use cases for orchestration |
| **No cache() on handlers**                    | Duplicate queries in single request     | Wrap with `cache(async () => {...})`   |
| **app/api/ with Prisma import**               | Violates delivery layer rules           | Delegate to presentation handler       |
| **Application importing Infrastructure repo** | Violates dependency inversion           | Use domain repository interface        |

**Examples**:

```typescript
// ❌ BAD: Application importing Infrastructure
// modules/production/application/list-items.ts
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/item.prisma-repo";

export async function listItems() {
  const repo = new PrismaProductionItemRepository(); // ❌ Direct infrastructure import
  return await repo.findMany();
}

// ✅ GOOD: Application using Domain interface
// modules/production/application/list-items.ts
import { ProductionItemRepository } from "@/modules/production/domain/ItemRepository";

export class ListItemsUseCase {
  constructor(private repo: ProductionItemRepository) {} // ✅ Interface from domain

  async execute() {
    return await this.repo.findMany({ take: 100 });
  }
}

// Presentation instantiates infrastructure
// modules/production/presentation/api/handlers/list-items-handler.ts
import { cache } from "react";
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/item.prisma-repo";

export const listItemsHandler = cache(async () => {
  const useCase = new ListItemsUseCase(new PrismaProductionItemRepository());
  return await useCase.execute();
});
```

```typescript
// ❌ BAD: Business logic in API route
// app/api/production/items/route.ts
export async function GET() {
  const items = await prisma.productionItem.findMany(); // ❌ Prisma in delivery

  // ❌ Business logic in delivery layer
  const enriched = items.map((item) => ({
    ...item,
    progressPercent: (item.completedQty / item.quantity) * 100,
  }));

  return Response.json(enriched);
}

// ✅ GOOD: Thin delivery, logic in application
// app/api/production/items/route.ts
export async function GET() {
  const items = await listProductionItemsHandler(); // ✅ Delegate to handler
  return Response.json(items);
}

// modules/production/application/list-items.ts
export class ListItemsUseCase {
  async execute() {
    const items = await this.repo.findMany({ take: 100 });

    // ✅ Business logic in application
    return items.map((item) => ({
      ...item,
      progressPercent: (item.completedQty / item.quantity) * 100,
    }));
  }
}
```

```typescript
// ❌ BAD: Client component fetching in useEffect
"use client";
export function ItemsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/items').then(res => res.json()).then(setItems); // ❌ Waterfall
  }, []);

  return <ItemsTable items={items} />;
}

// ✅ GOOD: Server Component with SSR
export default async function ItemsPage() {
  const items = await listItemsHandler(); // ✅ SSR, no waterfall
  return <ItemsClient initialItems={items} />;
}

"use client";
export function ItemsClient({ initialItems }) {
  const [items, setItems] = useState(initialItems); // ✅ Hydrate with SSR data
  return <ItemsTable items={items} />;
}
```

**See also**:

- [Enterprise Architecture Guide](./enterprise-architecture.md) - Complete layer documentation
- [Folder Architecture](./folder-architecture.md) - Layer structure and dependency rules
- [Data Handling Guide](./data-handling-guide.md) - Layer-specific data patterns

---

## Naming and files

### Do

- Follow [naming-conventions.md](naming-conventions.md): kebab-case for folders, URL segments, and file names in **lib/**, **components/**, **hooks/**, **types/**, **config/**; PascalCase for domain entities; camelCase for services/use cases/actions inside **modules/**.
- Use descriptive names: `createJob.action.ts`, `JobRepository.ts`, `job.prisma-repo.ts`.
- Keep **Next.js** file names as-is: `layout.tsx`, `page.tsx`, `route.ts`.

### Don't

- Don’t use `src/` or rename core Next.js files to something else.
- Don’t mix naming styles (e.g. snake_case for new files/folders).
- Don’t use generic names at root (e.g. `utils/`, `helpers/`) when the code belongs in **lib/** or a **module**.

---

## Cross-cutting (server/, lib/, config/, types/)

### Do

- Use **server/** for auth (permissions, RBAC), tenancy (context, guard), audit (logger), and domain events.
- Use **lib/** for shared infra: logger, cache, date helpers, errors, Prisma singleton.
- Use **config/** and **env.ts** for environment and app configuration.
- Use **types/** for shared TypeScript types: define types there and **import** them into components and functions (see [Types: keep in a separate folder](#types-keep-in-a-separate-folder)).

### Don't

- Don’t put module-specific logic in **server/**; keep it in the owning module.
- Don’t put business rules in **lib/**; those belong in **modules/\*/domain** or **application**.
- Don’t scatter env access; centralize in **env.ts** and **config/**.
- Don’t define shared types inline in components or functions; keep them in **types/** (or module domain) and import.

---

## Zero TypeScript and ESLint suppression

### Never do

- **Never** use `@ts-ignore` — fix the underlying type error.
- **Never** use `@ts-nocheck` — fix the file's type issues.
- **Never** use `@ts-expect-error` — fix the root cause; do not paper over it.
- **Never** use `as any` or `: any` — use `unknown` + a type guard.
- **Never** use `eslint-disable` (inline or block) — fix the code instead.

These patterns are **blocked by CI**. A PR that contains any suppression comment will not merge.

### Do

- Fix the root type error — add a missing interface, narrow a union, use `unknown` + type guard.
- If a third-party library type is wrong, open an issue upstream and use a type-safe workaround (`unknown` + guard) in the meantime.
- If a lint rule flags something you believe is a false positive, discuss it with the team; if warranted, adjust the ESLint **config** rather than suppress inline.

---

## Summary

| Do                                                                    | Don't                                |
| --------------------------------------------------------------------- | ------------------------------------ |
| **Component-based**: small, single-responsibility components          | Monolithic pages or components       |
| **No `any`**: explicit types, interfaces, generics                    | Use `any` (strictly prohibited)      |
| **Types in types/**: define in types/, import in components/functions | Inline or duplicate shared types     |
| Root-level app structure (no src/)                                    | Use src/                             |
| Business logic only in modules                                        | Business logic in app/               |
| Prisma only in lib + module infrastructure                            | Prisma in app/ or domain/application |
| app/ only routes and delegates                                        | Use cases or Prisma in app/          |
| Four layers per module                                                | Skip layers or mix concerns          |
| Follow naming conventions                                             | Inconsistent or wrong case           |
| server/ for cross-cutting only                                        | Module-specific logic in server/     |

When in doubt, ask: “Is this routing?” → app/. “Is this business logic?” → modules/. “Is this shared infra or cross-cutting?” → lib/ or server/.

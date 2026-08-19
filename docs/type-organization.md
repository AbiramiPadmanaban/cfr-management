# Type Organization

Standards for where TypeScript types and interfaces are defined and how they are imported.

---

## Where types live

| Location                 | Contains                                                                             | Example                                                 |
| ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `types/<domain>.ts`      | Shared types used by two or more modules or by `app/`                                | `types/workspace.ts`, `types/audit.ts`                  |
| `types/index.ts`         | Barrel re-export of all `types/*.ts` files                                           | `export type { WorkspaceId } from "./workspace"`        |
| `modules/<name>/domain/` | Types scoped to one module's domain layer (entities, value objects, repo interfaces) | `modules/quotation/domain/Quotation.ts`                 |
| Inline in component file | Props interfaces used only inside that one file                                      | `interface QuotationHeaderProps { … }` (still exported) |

---

## Rules

### All shared types live in `types/`

- Any interface or type alias used by two or more files outside a single module belongs in `types/<domain>.ts`.
- Re-export it via `types/index.ts` so consumers can `import type { Foo } from "@/types"`.

### Module-domain types stay in `modules/<name>/domain/`

- Entity types, value object types, repository interface types, and domain-specific enums.
- These are **not** re-exported from `types/index.ts`.
- Other modules must not import directly from `modules/<name>/domain/`; use DTOs or events instead.

### Component-file-only types may stay inline

- Props interfaces (`<ComponentName>Props`) used exclusively inside one component file.
- Even inline interfaces must be **named** and **exported** (never anonymous inline objects).

### `lib/` and `server/` must NOT define exported interfaces

- `lib/` files expose utilities (functions, constants). If a function's parameter or return type is a shared interface, move that interface to `types/` and import it.
- `server/` files expose server-side utilities. Same rule applies.

---

## Zero `any`

- `any` is strictly prohibited everywhere (enforced by ESLint `no-explicit-any: error`).
- If a third-party library uses `any` or has a wrong type, cast through `unknown` and use a type guard:

```ts
// Bad
const data = someLib.getData() as any;

// Good
const raw: unknown = someLib.getData();
if (isMyExpectedShape(raw)) {
  // use raw safely
}
```

- Open a GitHub issue for the upstream library if its types are genuinely wrong.

---

## `types/index.ts` barrel

`types/index.ts` is the single entry point for all shared types. Keep it updated whenever you add a new `types/*.ts` file.

```ts
// types/index.ts example
export type {
  WorkspaceId,
  WorkspaceItem,
  NavItem,
  NavGroup,
  WorkspaceNavConfig,
} from "./workspace";
export type { AuditLogEntry } from "./audit";
export type { ApprovalDetailData } from "./approval";
export type { UploadedFile } from "./file";
export type { POPdfData } from "./pdf";
export type { RateLimitAction } from "./rate-limit";
export type { SendMailOptions } from "./email";
export type { Permission } from "./permission";
```

---

## Anti-patterns

| Anti-pattern                                                | Fix                                                      |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `interface Foo {}` defined inside `lib/foo.ts` and exported | Move to `types/foo.ts`, import in `lib/foo.ts`           |
| Same interface defined in two files                         | Define once in `types/`, import in both                  |
| `as any` to work around a type mismatch                     | Fix the type or use `unknown` + guard                    |
| Re-exporting a hook from `types/`                           | Move the hook to `hooks/`; types files export only types |
| Anonymous inline prop type `({ x }: { x: string })`         | Define `interface Props { x: string }` and export it     |

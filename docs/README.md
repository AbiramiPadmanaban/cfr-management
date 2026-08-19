# Istana ERP — Documentation

Project standards and architecture for the Istana ERP codebase.

## Contents

| Document                                                      | Description                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [Developer guide](developer-guide.md)                         | **Start here** — Workflow, path aliases, env, Prisma, Tailwind, API/server-action patterns, adding pages/modules, testing |
| [Product isolation and state](product-isolation-and-state.md) | Product/tenant isolation, where and how to use Prisma, when to use hooks / Context / Redux Toolkit                        |
| [shadcn/ui](shadcn-ui.md)                                     | UI components: setup, `components/ui/`, using the shadcn MCP in Cursor, rules                                             |
| [Naming conventions](naming-conventions.md)                   | File, folder, variable, and type naming standards                                                                         |
| [Folder architecture](folder-architecture.md)                 | Root-level structure, layer roles, and module layout                                                                      |
| [Dos and don'ts](dos-and-donts.md)                            | Rules, anti-patterns, and best practices                                                                                  |
| [Next.js Rendering Handbook](nextjs-rendering-handbook.md)    | Rendering strategies (SSR, SSG, ISR, CSR, Edge), when to use each, and security rules                                     |
| [Error handling](error-handling.md)                           | Standardized errors: AppError, API responses, server actions, client helpers, ERROR_MESSAGES                              |
| **Module docs**                                               |                                                                                                                           |
| [Modules overview](modules/README.md)                         | Index of all business modules and links to their detailed documentation                                                   |

## Quick reference

- **Component-based, no monoliths** — Architecture is always component-based; small, single-responsibility components only.
- **No `any`** — The `any` type is strictly prohibited; use explicit types, interfaces, or `unknown` with type guards.
- **Product/tenant isolation** — Tenant context on server only; scope all tenant data by tenant; SSR for tenant pages. See [Product isolation and state](product-isolation-and-state.md).
- **Prisma** — Only in `modules/<name>/infrastructure/` and `lib/prisma.ts` (singleton); tenant-scope all queries. See [Product isolation and state](product-isolation-and-state.md).
- **State** — Local state → hooks; shared client state → Context or Redux Toolkit; server state → Server Components / server actions or TanStack Query/SWR. See [Product isolation and state](product-isolation-and-state.md).
- **shadcn/ui** — Shared UI primitives live in **`components/ui/`**; use the shadcn MCP in Cursor to list/add components. See [shadcn/ui](shadcn-ui.md).
- **No `src/`** — Use the standard Next.js app structure; all app code lives at project root.
- **app/** — Routing and layout only; no business logic, no Prisma.
- **modules/** — Business logic lives here; each module has domain, application, infrastructure, presentation.
- **Auth** — Session + refresh token (rotation), rate limiting (signup, resend, password reset, login), email verification. See [Auth](modules/auth/README.md).
- **Errors** — Use `AppError` (and subclasses) on the server; return `ApiErrorResponse` from APIs; use `getErrorMessage` / `getFieldErrors` on the client. See [Error handling](error-handling.md).

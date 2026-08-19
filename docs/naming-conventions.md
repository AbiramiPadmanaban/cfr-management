# Naming Conventions

Standard naming for files, folders, variables, and types across the Istana ERP project.

## Files and folders

### Case

- **Folders**: `kebab-case` (e.g. `tenant-context`, `server-actions`).
- **Files**: `kebab-case` for file names in **lib/**, **components/**, **hooks/**, **types/**, **config/** and for **modules/\*/application/** and **modules/\*/presentation/** (e.g. `create-job.ts`, `login.action.ts`, `session-cookie.ts`); `PascalCase` for domain entities in **modules/\*/domain/** (e.g. `Job.ts`, `User.ts`); DTOs in application may be `PascalCaseDTO.ts`.
- **Next.js conventions**: Keep framework names as-is — `layout.tsx`, `page.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

### Route segments (app/)

- Use **kebab-case** for URL segments: `app/(dashboard)/production/`, `app/api/work-orders/`.
- Route groups use parentheses and kebab-case: `(auth)`, `(dashboard)`.

### Modules

- **Module names**: kebab-case, singular, one word where possible — `production`, `finance`, `inventory`, `hrms`, `shared`, or multi-word e.g. `user-management`.
- **Layer folders** (inside each module): `domain`, `application`, `infrastructure`, `presentation`.

### Domain layer (modules/\*/domain/)

- **Entities**: `PascalCase.ts` — e.g. `Job.ts`, `WorkOrder.ts`, `BOM.ts`.
- **Value objects**: `PascalCase.ts` — e.g. `JobStatus.ts`, `Quantity.ts`.
- **Repository interfaces**: `PascalCaseRepository.ts` — e.g. `JobRepository.ts`.
- **Rules**: `kebab-case.ts` — e.g. `job-rules.ts`, `password-rules.ts`.

### Application layer (modules/\*/application/)

- **Use cases / services**: `kebab-case.ts` — e.g. `create-job.ts`, `login.ts`, `get-session.ts`, `password-rules.ts`.
- **DTOs**: `PascalCaseDTO.ts` — e.g. `CreateJobDTO.ts` (or `kebab-case-dto.ts`).

### Infrastructure layer (modules/\*/infrastructure/)

- **Prisma repos**: `kebab-case.prisma-repo.ts` — e.g. `job.prisma-repo.ts`, `bom.prisma-repo.ts`.
- **Mappers**: `kebab-case.mapper.ts` — e.g. `job.mapper.ts`.

### Presentation layer (modules/\*/presentation/)

- **API handlers**: `handlers.ts` (or split by resource).
- **Server actions**: `kebab-case.action.ts` — e.g. `create-job.action.ts`, `login.action.ts`.
- **Helpers**: `kebab-case.ts` — e.g. `session-cookie.ts`.
- **Views**: `PascalCaseView.tsx` — e.g. `JobListView.tsx`.

### Root-level folders

- **lib/**: Shared infra; files in kebab-case — `prisma.ts`, `logger.ts`, `date.ts`, `cache.ts`, `errors.ts`, `rate-limit.ts`, `workspace-config.ts`. Must have `lib/index.ts` barrel re-exporting all public utilities.
- **server/**: Cross-cutting; subfolders in kebab-case — `auth/`, `tenancy/`, `audit/`, `events/`. Must have `server/index.ts` barrel re-exporting all public cross-cutting functions.
- **types/**: Global types; `index.ts` or descriptive names in kebab-case (e.g. `types/workspace.ts`, `types/audit.ts`). `types/index.ts` must barrel-re-export all domain type files.
- **config/**: Config modules; `index.ts` or descriptive names in kebab-case.
- **components/**: Shared UI; component files in kebab-case (e.g. `dashboard-shell.tsx`, `password-strength-meter.tsx`). Must have `components/index.ts` barrel. Barrel export files must always be named `index.ts` (never `exports.ts`).
- **hooks/**: Shared hooks; kebab-case (e.g. `use-mobile.ts`).
- **styles/**: `global.css` or kebab-case for other stylesheets.

### Suppression rules (hard ban)

The following patterns are **strictly prohibited** in any `.ts` or `.tsx` file. Violation blocks PR in CI:

- `@ts-ignore`
- `@ts-nocheck`
- `@ts-expect-error`
- `: any` or `as any`
- `eslint-disable` (inline or block)

If a third-party type is incorrect, use `unknown` + a type guard. Never suppress — fix the root type.

---

## Variables and functions

- **Variables / parameters**: `camelCase`.
- **Constants**: `UPPER_SNAKE_CASE` for true constants; otherwise `camelCase`.
- **Functions**: `camelCase` — e.g. `createJob`, `validateQuantity`.
- **React components**: `PascalCase`.
- **Custom hooks**: Prefix with `use` — `useAuth`, `useTenant`.

---

## Types and interfaces

- **Interfaces**: `PascalCase` — e.g. `CreateJobDTO`, `JobRepository`.
- **Types**: `PascalCase` — e.g. `JobStatus`, `Quantity`.
- **Generic parameters**: Single capital letter or `PascalCase` — e.g. `T`, `TEntity`.
- **No `any`**: The `any` type is **strictly prohibited**; use explicit types or `unknown` with type guards. See [Dos and don'ts](dos-and-donts.md).

---

## Summary table

| Kind                                          | Convention                | Example                                                 |
| --------------------------------------------- | ------------------------- | ------------------------------------------------------- |
| Route segment                                 | kebab-case                | `work-orders`                                           |
| Entity file (modules/domain)                  | PascalCase                | `Job.ts`, `User.ts`                                     |
| Component file (components/)                  | kebab-case                | `dashboard-shell.tsx`, `nav-user.tsx`                   |
| Lib / hooks / types / config file             | kebab-case                | `rate-limit.ts`, `use-mobile.ts`, `workspace-config.ts` |
| Service / use case file (modules/application) | kebab-case                | `create-job.ts`, `login.ts`                             |
| Server action file (modules/presentation)     | kebab-case + .action      | `create-job.action.ts`, `login.action.ts`               |
| Prisma repo file                              | kebab-case + .prisma-repo | `job.prisma-repo.ts`                                    |
| Folder (general)                              | kebab-case                | `server-actions`, `tenant-context`                      |
| Module name                                   | kebab-case, singular      | `production`, `finance`, `user-management`              |
| React component                               | PascalCase                | `JobListView`                                           |
| Hook (function name)                          | use + PascalCase          | `useAuth`                                               |

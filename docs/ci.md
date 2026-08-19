# CI — Code quality and standards

GitHub Actions workflow runs on push and pull requests to `main` and `master`. Standards: see [README](README.md) and [naming-conventions](naming-conventions.md).

## What runs in CI

| Job                          | Command                              | Purpose                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lint**                     | `npm run lint`                       | ESLint (Next.js + Prettier)                                                                                                                                                                                                                                                |
| **TypeScript**               | `npm run typecheck`                  | `tsc --noEmit`                                                                                                                                                                                                                                                             |
| **Naming**                   | `node scripts/check-naming.js`       | [naming-conventions](naming-conventions.md): no `src/`, app route segments kebab-case, components/ lib/ hooks/ types/ config/ kebab-case, modules structure and layer file patterns, suppression patterns blocked (`@ts-ignore`, `any`, `eslint-disable`)                  |
| **Architecture & rendering** | `node scripts/check-architecture.js` | Guardrails from [developer-guide](developer-guide.md), [folder-architecture](folder-architecture.md), and [nextjs-rendering-handbook](nextjs-rendering-handbook.md): no `"use client"` in `page.tsx`, and no Prisma/domain imports in `app/` or module domain/application. |
| **Format**                   | `npm run format:check`               | Prettier (no write)                                                                                                                                                                                                                                                        |
| **Build**                    | `npm run build`                      | Next.js build                                                                                                                                                                                                                                                              |

All jobs must pass for the check to be green.

## Required env for build

The **Build** job sets:

- `DATABASE_URL` — dummy value (build does not connect to a DB)
- `SESSION_SECRET` — dummy value for compilation

Other env (e.g. SMTP) are not required at build time.

## Naming and structure beyond the script

The naming job validates file and folder naming from [naming-conventions](naming-conventions.md) (lib/, hooks/, types/, config/, components/, app/, modules/). Remaining rules (e.g. variable/function naming, no `any`) are enforced via **code review**. See [dos-and-donts](dos-and-donts.md) and [folder-architecture](folder-architecture.md).

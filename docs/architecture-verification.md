# Architecture Verification Guide

This guide explains how to verify that your code follows the enterprise architecture principles and layer boundaries. Automated verification scripts catch violations before they reach production.

---

## Table of Contents

1. [Overview](#overview)
2. [Automated Verification](#automated-verification)
3. [Manual Verification Checklist](#manual-verification-checklist)
4. [Common Violations](#common-violations)
5. [CI/CD Integration](#cicd-integration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Verification Matters

**Without Verification**:

- Architecture violations accumulate over time
- Technical debt grows silently
- Code becomes harder to maintain
- Refactoring becomes risky

**With Verification**:

- Architecture is enforced automatically
- Violations caught in development, not production
- Codebase stays clean and maintainable
- Onboarding easier with consistent patterns

### What We Verify

| Check                  | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| **Layer Dependencies** | Ensure layers don't import from forbidden layers |
| **Prisma Isolation**   | Ensure Prisma only in infrastructure             |
| **Module Structure**   | Ensure modules follow standard layout            |
| **Type Safety**        | Ensure no `any`, no type suppressions            |
| **Cache Coverage**     | Ensure handlers use React.cache()                |

---

## Automated Verification

### Running Verification Scripts

**Verify Everything**:

```bash
npm run verify:all
```

**Individual Checks**:

```bash
npm run verify:layers        # Layer dependency rules
npm run verify:prisma        # Prisma isolation
npm run verify:modules       # Module structure
npm run verify:types         # Type safety (no 'any')
npm run verify:cache         # React.cache() coverage
```

**Quick Alias**:

```bash
npm run verify               # Runs verify:all
```

---

### 1. Layer Dependency Verification

**Script**: `scripts/verify-layer-dependencies.ts`

**What it checks**:

- ❌ Domain cannot import Application, Infrastructure, Presentation
- ❌ Domain cannot import @prisma/client
- ❌ Application cannot import Infrastructure, Presentation
- ❌ Application cannot import @prisma/client
- ❌ app/ cannot import Infrastructure
- ❌ app/ cannot import @prisma/client
- ✅ Infrastructure can import Domain
- ✅ Presentation can import Application, Domain

**Example output**:

```
❌ Found 3 layer boundary violations:

  modules/production/application/list-items.ts
    → application cannot import infrastructure
    → Import: @/modules/production/infrastructure/item.prisma-repo

  modules/production/domain/ProductionItem.ts
    → domain cannot import @prisma/client
    → Import: @prisma/client

  app/api/production/items/route.ts
    → app cannot import infrastructure
    → Import: @/modules/production/infrastructure/item.prisma-repo
```

**Fix**:

- Use repository **interfaces** from domain, not implementations
- Move Prisma imports to infrastructure only
- Delegate from app/ to presentation handlers

---

### 2. Prisma Isolation Verification

**Script**: `scripts/verify-prisma-isolation.ts`

**What it checks**:

- ✅ @prisma/client only in `lib/prisma.ts` and `modules/*/infrastructure/`
- ❌ @prisma/client in domain, application, presentation, app/

**Example output**:

```
❌ Found 2 Prisma isolation violations:

  app/api/production/items/route.ts
    → Prisma import outside infrastructure layer
    → Fix: Move Prisma code to modules/*/infrastructure/ and use repository pattern

  modules/production/application/create-item.ts
    → Prisma import outside infrastructure layer
    → Fix: Move Prisma code to modules/*/infrastructure/ and use repository pattern
```

**Fix**:

- Remove Prisma imports from application, presentation, app/
- Use repository pattern with domain interfaces
- Implement repositories in infrastructure layer

---

### 3. Module Structure Verification

**Script**: `scripts/verify-module-structure.ts`

**What it checks**:

- Each module has domain/, application/, infrastructure/, presentation/ (or subset)
- Each layer has index.ts barrel export
- No orphaned files outside layer folders

**Example output**:

```
✅ Module structure verified for 12 modules:
  - production
  - procurement
  - finance
  - inventory
  - hrms
  - quotation
  - master-data
  - asset
  - workflow
  - file-storage
  - user
  - shared

⚠️  Warning: module 'procurement' missing index.ts in application/
⚠️  Warning: module 'inventory' has orphaned file: inventory-helper.ts (not in any layer)
```

**Fix**:

- Add missing index.ts barrel exports
- Move orphaned files to appropriate layer folders
- Follow standard module structure

---

### 4. Type Safety Verification

**Script**: `scripts/verify-type-safety.ts`

**What it checks**:

- ❌ No `any` type usage
- ❌ No @ts-ignore
- ❌ No @ts-expect-error
- ❌ No @ts-nocheck
- ❌ No eslint-disable

**Example output**:

```
❌ Found 5 type safety violations:

  modules/production/application/create-item.ts:45
    → 'any' type usage
    → Fix: Use explicit type or 'unknown' with type guard

  components/shared/DataTable.tsx:12
    → @ts-ignore found
    → Fix: Fix the underlying type error instead of suppressing

  app/api/production/items/route.ts:78
    → eslint-disable found
    → Fix: Fix the code instead of disabling linting
```

**Fix**:

- Replace `any` with explicit types or `unknown` + type guards
- Remove @ts-ignore and fix underlying type errors
- Remove eslint-disable and fix code issues

---

### 5. Cache Coverage Verification

**Script**: `scripts/verify-cache-coverage.ts`

**What it checks**:

- All exported functions in `modules/*/presentation/api/` should use `React.cache()`
- Flags handlers without cache wrapper

**Example output**:

```
✅ Cache coverage: 95% (38/40 handlers)

⚠️  Missing cache() wrapper:
  - modules/production/presentation/api/handlers/list-items-handler.ts
      → export const listItemsHandler
  - modules/inventory/presentation/api/handlers/get-stock-handler.ts
      → export const getStockHandler
```

**Fix**:

```typescript
// Before
export async function listItemsHandler() {
  return await repo.findMany();
}

// After
import { cache } from "react";

export const listItemsHandler = cache(async () => {
  return await repo.findMany();
});
```

---

## Manual Verification Checklist

Use these checklists when adding new features or refactoring:

### Per-Module Checklist

When creating or modifying a module:

- [ ] **Domain layer**
  - [ ] Entities and types defined
  - [ ] Repository interfaces defined
  - [ ] No imports from other layers
  - [ ] No framework dependencies (Next.js, Prisma)
  - [ ] Validation schemas (Zod) if needed

- [ ] **Application layer**
  - [ ] Use cases implemented
  - [ ] Uses domain repository interfaces (not implementations)
  - [ ] No Prisma imports
  - [ ] No UI or HTTP logic
  - [ ] Orchestrates multiple repositories if needed

- [ ] **Infrastructure layer**
  - [ ] Repository implementations (implements domain interfaces)
  - [ ] Prisma queries with explicit `take` limits
  - [ ] Maps Prisma models to domain entities
  - [ ] No business logic

- [ ] **Presentation layer**
  - [ ] API handlers wrapped with `React.cache()`
  - [ ] Handlers call application use cases
  - [ ] Server actions have `"use server"` directive
  - [ ] No direct Prisma usage
  - [ ] Returns serializable data

### Cross-Cutting Concerns Checklist

- [ ] **API Routes** (app/api/)
  - [ ] Thin (parse → validate → delegate)
  - [ ] No business logic
  - [ ] No Prisma imports
  - [ ] Delegates to presentation handlers
  - [ ] Proper error handling and HTTP status codes

- [ ] **Server Components** (app/ pages)
  - [ ] Calls presentation handlers directly
  - [ ] Passes data as props to client components
  - [ ] No Prisma imports
  - [ ] Uses `await` for async operations

- [ ] **Client Components**
  - [ ] Receives initialData from Server Component props
  - [ ] Uses `useState(initialData)` for hydration
  - [ ] Uses `router.refresh()` after mutations
  - [ ] No direct API fetching in useEffect for initial data

### Dependency Flow Checklist

Verify dependencies flow correctly:

- [ ] Client → Delivery (app/ imports presentation handlers)
- [ ] Delivery → Application (handlers call use cases)
- [ ] Application → Domain (use cases use repository interfaces)
- [ ] Infrastructure → Domain (repos implement domain interfaces)
- [ ] No upward dependencies (Domain doesn't import Application)
- [ ] No layer skipping (Client doesn't import Infrastructure)

---

## Common Violations

### Violation 1: Application Importing Infrastructure

**Detection**: `npm run verify:layers`

**Example**:

```typescript
// ❌ BAD
// modules/production/application/list-items.ts
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/item.prisma-repo";

export async function listItems() {
  const repo = new PrismaProductionItemRepository(); // ❌
  return await repo.findMany();
}
```

**Fix**:

```typescript
// ✅ GOOD
// modules/production/application/list-items.ts
import { ProductionItemRepository } from "@/modules/production/domain/ItemRepository";

export class ListItemsUseCase {
  constructor(private repo: ProductionItemRepository) {} // ✅ Interface

  async execute() {
    return await this.repo.findMany({ take: 100 });
  }
}

// Presentation layer instantiates infrastructure
// modules/production/presentation/api/handlers/list-items-handler.ts
import { cache } from "react";
import { PrismaProductionItemRepository } from "@/modules/production/infrastructure/item.prisma-repo";

export const listItemsHandler = cache(async () => {
  const useCase = new ListItemsUseCase(new PrismaProductionItemRepository());
  return await useCase.execute();
});
```

---

### Violation 2: Business Logic in API Routes

**Detection**: Code review, manual inspection

**Example**:

```typescript
// ❌ BAD
// app/api/production/items/route.ts
export async function GET() {
  const items = await prisma.productionItem.findMany(); // ❌ Prisma in delivery

  // ❌ Business logic in delivery
  const enriched = items.map((item) => ({
    ...item,
    progressPercent: (item.completedQty / item.quantity) * 100,
  }));

  return Response.json(enriched);
}
```

**Fix**:

```typescript
// ✅ GOOD
// app/api/production/items/route.ts
export async function GET() {
  const items = await listProductionItemsHandler(); // ✅ Delegate
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

---

### Violation 3: Client Component with useEffect Fetching

**Detection**: Manual inspection, performance monitoring

**Example**:

```typescript
// ❌ BAD
"use client";
export function ItemsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/items').then(res => res.json()).then(setItems); // ❌ Waterfall
  }, []);

  return <ItemsTable items={items} />;
}
```

**Fix**:

```typescript
// ✅ GOOD
// Server Component (SSR)
export default async function ItemsPage() {
  const items = await listItemsHandler(); // ✅ SSR
  return <ItemsClient initialItems={items} />;
}

// Client Component
"use client";
export function ItemsClient({ initialItems }) {
  const [items, setItems] = useState(initialItems); // ✅ Hydrate
  const router = useRouter();

  async function handleCreate(data) {
    await fetch('/api/items', { method: 'POST', body: JSON.stringify(data) });
    router.refresh(); // Re-run Server Component
  }

  return <ItemsTable items={items} onCreate={handleCreate} />;
}
```

---

### Violation 4: Prisma in Domain or Application

**Detection**: `npm run verify:prisma`

**Example**:

```typescript
// ❌ BAD
// modules/production/application/create-item.ts
import { prisma } from "@/lib/prisma"; // ❌

export async function createItem(data) {
  return await prisma.productionItem.create({ data }); // ❌
}
```

**Fix**:

```typescript
// ✅ GOOD
// modules/production/domain/ItemRepository.ts
export interface ProductionItemRepository {
  create(data: CreateItemData): Promise<ProductionItem>;
}

// modules/production/application/create-item.ts
export class CreateItemUseCase {
  constructor(private repo: ProductionItemRepository) {} // ✅

  async execute(data: CreateItemData) {
    return await this.repo.create(data); // ✅
  }
}

// modules/production/infrastructure/item.prisma-repo.ts
import { prisma } from "@/lib/prisma"; // ✅ Only in infrastructure

export class PrismaProductionItemRepository implements ProductionItemRepository {
  async create(data: CreateItemData): Promise<ProductionItem> {
    const item = await prisma.productionItem.create({ data });
    return this.mapToDomain(item);
  }
}
```

---

### Violation 5: Handler Without cache()

**Detection**: `npm run verify:cache`

**Example**:

```typescript
// ❌ BAD
// modules/production/presentation/api/handlers/list-items-handler.ts
export async function listItemsHandler() {
  const useCase = new ListItemsUseCase();
  return await useCase.execute();
}
```

**Fix**:

```typescript
// ✅ GOOD
import { cache } from "react";

export const listItemsHandler = cache(async () => {
  const useCase = new ListItemsUseCase();
  return await useCase.execute();
});
```

---

## CI/CD Integration

### Pre-Commit Hooks

**Setup**: Husky runs verification before commits

**File**: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type checking
npm run type-check

# Run architecture verification (fast checks only)
npm run verify:layers
npm run verify:prisma
npm run verify:types

# Run lint-staged
npx lint-staged
```

**If verification fails**, commit is blocked:

```
❌ Layer boundary violations found
❌ Prisma isolation violations found

Commit blocked. Fix violations before committing.
```

**Bypassing hooks** (emergency only):

```bash
git commit --no-verify -m "Emergency fix"
```

---

### GitHub Actions

**Workflow**: `.github/workflows/verify-architecture.yml`

**Triggers**:

- Pull requests to `main`, `develop`
- Pushes to `main`, `develop`

**Steps**:

1. Checkout code
2. Install dependencies
3. Run type check
4. Run all verification scripts
5. Run tests

**Status checks**:

- ✅ All checks pass → PR can merge
- ❌ Any check fails → PR blocked

**Viewing results**:

- Go to PR → "Checks" tab
- Click "Architecture Verification"
- View detailed output

---

### Branch Protection Rules

**Required status checks**:

- Architecture Verification
- Type Check
- Tests

**Require PR reviews**: 1 approval

**Settings**:

1. GitHub → Repository → Settings → Branches
2. Add rule for `main` and `develop`
3. Require status checks to pass
4. Select "Architecture Verification"

---

## Troubleshooting

### False Positives

**Issue**: Verification script flags valid code

**Solutions**:

1. **Review the rule**: Is it correct?
2. **Update the script**: Add exception if legitimate
3. **Refactor code**: Follow architecture if rule is correct

**Example**: If script flags a valid import, check if it's a cross-cutting concern that should be allowed.

---

### Performance Issues

**Issue**: Verification scripts are slow

**Solutions**:

1. **Cache dependencies**: Use `npm ci` instead of `npm install`
2. **Parallelize checks**: Run multiple scripts in parallel
3. **Optimize scripts**: Use faster file traversal
4. **Skip checks locally**: Use `--no-verify` for WIP commits (not for final commits)

---

### Verification Fails in CI but Passes Locally

**Issue**: CI fails but local verification passes

**Causes**:

1. **Different Node versions**: Check CI uses same Node as local
2. **Different dependencies**: Run `npm ci` to match lock file
3. **Cached results**: Clear cache and re-run

**Fix**:

```bash
# Clear cache
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# Re-run verification
npm run verify:all
```

---

## Summary

### Quick Reference

| Command                  | Purpose                     |
| ------------------------ | --------------------------- |
| `npm run verify:all`     | Run all verification checks |
| `npm run verify:layers`  | Check layer dependencies    |
| `npm run verify:prisma`  | Check Prisma isolation      |
| `npm run verify:modules` | Check module structure      |
| `npm run verify:types`   | Check type safety           |
| `npm run verify:cache`   | Check cache coverage        |

### Common Fixes

| Violation                          | Fix                                  |
| ---------------------------------- | ------------------------------------ |
| Application imports Infrastructure | Use repository interface from Domain |
| Prisma in Application              | Move to Infrastructure repository    |
| Business logic in API route        | Move to Application use case         |
| Client useEffect fetching          | Use Server Component with SSR        |
| Handler without cache()            | Wrap with `cache(async () => {...})` |

### Next Steps

1. **Run verification**: `npm run verify:all`
2. **Fix violations**: Follow fixes in this guide
3. **Commit changes**: Pre-commit hooks will verify
4. **Create PR**: CI will run full verification
5. **Merge**: Only after all checks pass

---

**Questions or Issues?**

If you encounter verification issues not covered here, please:

1. Check existing GitHub issues
2. Ask the team in Slack/Teams
3. Update this guide with the solution

---

**Last Updated**: 2026-03-13
**Version**: 1.0.0

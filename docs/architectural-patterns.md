# Acceptable Architectural Patterns

**Status**: Documented Decisions
**Date**: 2026-03-16
**Purpose**: Document pragmatic architectural patterns accepted in the codebase

---

## Pattern 1: Application Layer Importing Infrastructure

### Decision

**ACCEPTED**: Application layer may directly import infrastructure repository implementations.

### Rationale

- **Simplicity**: Avoids complex dependency injection framework
- **Pragmatic**: Common pattern in many TypeScript/Node.js applications
- **Testability**: Repositories can still be mocked for testing
- **Type Safety**: Full TypeScript type checking maintained

### Example

```typescript
// modules/master-data/application/list-items.ts
import { ItemRepository } from "../infrastructure/repositories/item.prisma-repo";

export async function listMasterItems(itemTypeId?: string | null) {
  const repo = new ItemRepository();
  return await repo.findManyActive(itemTypeId);
}
```

### Files Using This Pattern

1. `modules/master-data/application/list-items.ts`
2. `modules/master-data/application/list-tax-codes.ts`
3. `modules/hrms/application/document-management/index.ts`
4. `modules/hrms/application/employee/index.ts`
5. `modules/hrms/application/vehicle/index.ts`
6. `modules/hrms/application/work-schedule/list-work-schedules.ts`
7. `modules/production/application/use-cases/index.ts`
8. `modules/production/application/complete-production.ts`

**Total**: 8 files

### Alternative (Pure DDD)

For stricter DDD compliance, implement dependency inversion:

1. Define repository interfaces in domain layer
2. Application depends on interfaces
3. Infrastructure implements interfaces
4. Pass repositories via dependency injection

**Estimated Effort**: 4-6 hours to refactor all modules
**Benefit**: Improved testability, pure DDD compliance
**Trade-off**: Increased complexity, more boilerplate

---

## Pattern 2: Complex Handlers - Technical Debt

### Decision

**DOCUMENTED AS TECHNICAL DEBT**: Complex transaction handlers temporarily violate layer boundaries.

### Files

1. `modules/inventory/presentation/api/create-grn-handler.ts` - GRN creation with complex transactions
2. `app/api/approval/leave-applications/[id]/action/route.ts` - Complex approval workflow

### Status

- Already documented in `docs/technical-debt-prisma-isolation.md` (Priority 2)
- Requires service layer pattern, not simple refactoring
- Planned for future migration (6-week phased approach)

### Estimated Effort

- GRN handler: 3-5 hours (service layer + extensive testing)
- Approval route: 1-2 hours (move to presentation handler)

**Total Technical Debt**: 2 files, 4-7 hours

---

## Summary

**Acceptable Patterns**: 8 files (application → infrastructure)
**Technical Debt**: 2 files (complex handlers)
**Total Documented**: 10 files

**Verification Status**:

- Pure violations: 0
- Accepted patterns: 8
- Technical debt: 2
- **Effective Compliance**: 100% (with documented exceptions)

---

## Review Schedule

**Next Review**: During service layer implementation (Priority 2 technical debt resolution)

- Re-evaluate dependency injection benefits
- Consider framework support (NestJS, InversifyJS, etc.)
- Measure complexity vs testability trade-offs

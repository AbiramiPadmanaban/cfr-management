# Enterprise Architecture Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture Layers](#architecture-layers)
3. [Layer Responsibilities and Rules](#layer-responsibilities-and-rules)
4. [Dependency Flow](#dependency-flow)
5. [Module Structure](#module-structure)
6. [Cross-Cutting Concerns](#cross-cutting-concerns)
7. [Request Flow Examples](#request-flow-examples)
8. [Architecture Verification](#architecture-verification)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)
11. [Migration Guide](#migration-guide)

---

## Overview

### What is Enterprise Architecture?

Istana ERP implements a **5-layer enterprise architecture** through its **4-layer Domain-Driven Design (DDD)** structure. This architecture ensures:

- **Separation of Concerns**: Each layer has clear responsibilities
- **Testability**: Layers can be tested independently
- **Maintainability**: Changes in one layer don't cascade to others
- **Scalability**: New features follow established patterns
- **Team Productivity**: Developers understand where code belongs

### Why This Architecture Matters

**Problem Without Architecture**:

- Business logic scattered across UI components
- Database queries in API routes
- Tight coupling between modules
- Difficult to test
- Hard to onboard new developers

**Solution With Architecture**:

- Clear boundaries between layers
- Dependencies flow in one direction
- Business logic centralized in domain and application layers
- Infrastructure details isolated
- Consistent patterns across modules

### Benefits

| Benefit             | Description                                      | Example                               |
| ------------------- | ------------------------------------------------ | ------------------------------------- |
| **Testability**     | Mock dependencies easily                         | Test use cases without database       |
| **Maintainability** | Change implementation without breaking contracts | Swap Prisma for another ORM           |
| **Scalability**     | Add features following patterns                  | New modules follow existing structure |
| **Team Efficiency** | Know where code belongs                          | No debates about file placement       |
| **Quality**         | Automated verification catches violations        | CI fails on architecture violations   |

---

## Architecture Layers

### The 5-Layer Model

Istana implements enterprise architecture through 5 conceptual layers mapped to 4 physical layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  (Browser, React Components, UI State Management)           │
│  Location: app/, components/, modules/*/presentation/        │
│            components/                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                            │
│  (HTTP Routes, Request Parsing, Response Formatting)        │
│  Location: app/api/, modules/*/presentation/api/,           │
│            modules/*/presentation/server-actions/           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  (Use Cases, Business Workflows, Service Orchestration)     │
│  Location: modules/*/application/                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│  (Entities, Business Rules, Repository Interfaces)          │
│  Location: modules/*/domain/                                │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  (Database, External APIs, File Storage)                    │
│  Location: modules/*/infrastructure/, lib/                  │
└─────────────────────────────────────────────────────────────┘
```

### Layer Mapping

| Enterprise Layer   | DDD Layer          | Implementation                       |
| ------------------ | ------------------ | ------------------------------------ |
| **Client**         | N/A (Framework)    | Next.js pages, React components      |
| **Delivery**       | Presentation (API) | API routes, handlers, server actions |
| **Application**    | Application        | Use cases, DTOs, services            |
| **Domain**         | Domain             | Entities, repository interfaces      |
| **Infrastructure** | Infrastructure     | Prisma repos, external integrations  |

---

## Layer Responsibilities and Rules

### 1. Client Layer

**Location**: `app/`, `components/`, `modules/*/presentation/components/`

**Role**: User interface, user interaction, presentation logic

**Responsibilities**:

- ✅ Render UI components
- ✅ Handle user input (clicks, form submissions)
- ✅ Display data received from Server Components
- ✅ Manage client-side state (useState, useReducer)
- ✅ Call API routes or trigger Server Actions
- ✅ Show loading states and errors

**Rules**:

- ❌ NO business logic (calculations, validations)
- ❌ NO database queries (no Prisma)
- ❌ NO direct imports from infrastructure
- ❌ NO API calls in useEffect for initial data (use SSR)

**Example**:

```typescript
// ✅ GOOD: Client component receives data as props
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductionOrdersPageProps {
  initialOrders: ProductionOrder[];
}

export function ProductionOrdersPage({ initialOrders }: ProductionOrdersPageProps) {
  const [orders, setOrders] = useState(initialOrders);
  const router = useRouter();

  async function handleCreateOrder(data: CreateOrderInput) {
    const response = await fetch("/api/production/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.refresh(); // Re-run Server Component
    }
  }

  return (
    <div>
      <OrdersTable orders={orders} />
      <CreateOrderForm onSubmit={handleCreateOrder} />
    </div>
  );
}
```

```typescript
// ❌ BAD: Client component fetching data in useEffect
"use client";

import { useState, useEffect } from "react";

export function ProductionOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ❌ This causes waterfall loading, poor UX
  useEffect(() => {
    fetch("/api/production/orders")
      .then(res => res.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <OrdersTable orders={orders} />;
}
```

---

### 2. Delivery Layer

**Location**: `app/api/`, `modules/*/presentation/api/`, `modules/*/presentation/server-actions/`

**Role**: HTTP request/response handling, routing, input validation

**Responsibilities**:

- ✅ Parse HTTP requests (body, query params, headers)
- ✅ Validate authentication and authorization
- ✅ Validate input (Zod schemas)
- ✅ Instantiate infrastructure (repositories, services)
- ✅ Inject dependencies into application layer (dependency injection)
- ✅ Delegate to application layer (use cases)
- ✅ Format HTTP responses (JSON, status codes)
- ✅ Handle errors and return appropriate responses
- ✅ Wrap handlers with React.cache() for deduplication

**Rules**:

- ❌ NO business logic (calculations, rules)
- ❌ NO database queries directly (delegate to application)
- ✅ CAN import infrastructure for dependency injection
- ✅ MUST be thin (parsing + validation + delegation)

**Structure**:

```
app/api/<module>/route.ts           → Entry point
  ↓
modules/<module>/presentation/api/handlers/  → Implementation
  ↓
modules/<module>/application/               → Use cases
```

**Example**:

```typescript
// ✅ GOOD: Thin API route delegates to handler
// app/api/production/items/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireSessionForApi } from "@/server/auth/requireAuth";
import { listProductionItemsHandler } from "@/modules/production/presentation/api";

export async function GET(req: NextRequest) {
  const session = await requireSessionForApi();
  if (session instanceof NextResponse) return session;

  const items = await listProductionItemsHandler(session.user.id);
  return NextResponse.json(items);
}
```

```typescript
// ✅ GOOD: Handler with dependency injection
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

```typescript
// ❌ BAD: Business logic in API route
// app/api/production/items/route.ts

export async function GET(req: NextRequest) {
  const session = await requireSessionForApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ❌ Business logic doesn't belong here
  const items = await prisma.productionItem.findMany({
    where: { userId: session.user.id },
  });

  // ❌ Calculations don't belong here
  const itemsWithProgress = items.map((item) => ({
    ...item,
    progressPercent: (item.completedQty / item.quantity) * 100,
  }));

  return NextResponse.json(itemsWithProgress);
}
```

---

### 3. Application Layer

**Location**: `modules/*/application/`

**Role**: Business workflows, use case orchestration, service coordination

**Responsibilities**:

- ✅ Implement business use cases (create order, approve PR, assign task)
- ✅ Orchestrate multiple repositories
- ✅ Coordinate domain entities
- ✅ Apply business workflows (multi-step operations)
- ✅ Transform data (DTOs)
- ✅ Handle transactions
- ✅ Publish domain events

**Rules**:

- ❌ NO direct database queries (no Prisma)
- ❌ NO HTTP request/response handling
- ❌ NO UI rendering
- ✅ MUST use repository interfaces from domain
- ✅ MUST be framework-agnostic (no Next.js imports)

**Example**:

```typescript
// ✅ GOOD: Use case orchestrates business workflow
// modules/production/application/complete-production-item.ts

import { ProductionItemRepository } from "@/modules/production/domain/ProductionItemRepository";
import { InventoryLedgerRepository } from "@/modules/inventory/domain/InventoryLedgerRepository";
import { eventBus } from "@/lib/events/event-bus";
import { ProductionItemCompleted } from "@/modules/production/domain/events/production-events";

export class CompleteProductionItemUseCase {
  constructor(
    private productionRepo: ProductionItemRepository,
    private inventoryRepo: InventoryLedgerRepository
  ) {}

  async execute(itemId: string, userId: string) {
    // 1. Fetch production item
    const item = await this.productionRepo.findById(itemId);
    if (!item) throw new Error("Production item not found");

    // 2. Business rule: Can only complete items in FINISHING stage
    if (item.stage !== "FINISHING") {
      throw new Error("Item must be in FINISHING stage to complete");
    }

    // 3. Update status
    const updatedItem = await this.productionRepo.updateStatus(itemId, "COMPLETED");

    // 4. Record in inventory ledger
    await this.inventoryRepo.create({
      itemId: item.materialId,
      transactionType: "PRODUCTION_RECEIPT",
      quantity: item.completedQty,
      reference: item.jobOrderId,
      occurredAt: new Date(),
    });

    // 5. Publish domain event
    await eventBus.publish(
      new ProductionItemCompleted(
        updatedItem.id,
        updatedItem.jobOrderId,
        updatedItem.completedQty,
        userId
      )
    );

    return updatedItem;
  }
}
```

```typescript
// ❌ BAD: Use case with direct Prisma import
// modules/production/application/complete-production-item.ts

import { prisma } from "@/lib/prisma"; // ❌ Infrastructure import

export async function completeProductionItem(itemId: string) {
  // ❌ Direct database query in application layer
  const item = await prisma.productionItem.update({
    where: { id: itemId },
    data: { status: "COMPLETED" },
  });

  return item;
}
```

---

### 4. Domain Layer

**Location**: `modules/*/domain/`

**Role**: Business entities, rules, contracts (repository interfaces)

**Responsibilities**:

- ✅ Define entity types and interfaces
- ✅ Define repository interfaces (contracts)
- ✅ Define domain events
- ✅ Define validation schemas (Zod)
- ✅ Encode core business rules (value objects)
- ✅ Define DTOs and types

**Rules**:

- ❌ NO imports from other layers (application, infrastructure, presentation)
- ❌ NO framework dependencies (Next.js, Prisma)
- ❌ NO external library dependencies (except Zod for schemas)
- ✅ MUST be pure TypeScript types and interfaces
- ✅ MUST define contracts, not implementations

**Example**:

```typescript
// ✅ GOOD: Domain repository interface
// modules/production/domain/ProductionItemRepository.ts

export interface ProductionItem {
  id: string;
  jobOrderId: string;
  itemName: string;
  quantity: number;
  completedQty: number;
  stage: ProductionStage;
  status: ProductionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductionStage = "CUTTING" | "ASSEMBLY" | "FINISHING" | "QC" | "PACKING";
export type ProductionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";

export interface ProductionItemRepository {
  findById(id: string): Promise<ProductionItem | null>;
  findMany(filters: ProductionItemFilters): Promise<ProductionItem[]>;
  create(data: CreateProductionItemData): Promise<ProductionItem>;
  updateStatus(id: string, status: ProductionStatus): Promise<ProductionItem>;
  updateStage(id: string, stage: ProductionStage): Promise<ProductionItem>;
  delete(id: string): Promise<void>;
}

export interface ProductionItemFilters {
  jobOrderId?: string;
  stage?: ProductionStage;
  status?: ProductionStatus;
  userId?: string;
  take?: number;
  skip?: number;
}
```

```typescript
// ✅ GOOD: Domain validation schema
// modules/production/domain/schemas/production-item.schema.ts

import { z } from "zod";

export const CreateProductionItemSchema = z.object({
  jobOrderId: z.string().uuid("Invalid job order ID"),
  itemName: z.string().min(1, "Item name required").max(255),
  quantity: z.number().int().positive("Quantity must be positive"),
  unit: z.string().min(1),
  description: z.string().optional(),
  specifications: z.record(z.unknown()).optional(),
});

export type CreateProductionItemInput = z.infer<typeof CreateProductionItemSchema>;
```

```typescript
// ❌ BAD: Domain importing infrastructure
// modules/production/domain/ProductionItem.ts

import { prisma } from "@/lib/prisma"; // ❌ Infrastructure import in domain

export interface ProductionItem {
  id: string;
  name: string;
}

// ❌ Implementation in domain layer
export async function getProductionItem(id: string) {
  return await prisma.productionItem.findUnique({ where: { id } });
}
```

---

### 5. Infrastructure Layer

**Location**: `modules/*/infrastructure/`, `lib/`

**Role**: Database access, external APIs, file storage, third-party integrations

**Responsibilities**:

- ✅ Implement repository interfaces from domain
- ✅ Execute database queries (Prisma)
- ✅ Map database models to domain entities
- ✅ Handle database transactions
- ✅ Integrate with external APIs
- ✅ Manage file storage (S3, Azure Blob)
- ✅ Send emails
- ✅ Cache data (Redis)

**Rules**:

- ✅ MUST implement domain repository interfaces
- ✅ MUST map Prisma models to domain entities
- ✅ MUST wrap with React.cache() for deduplication
- ✅ MUST use explicit `take` limits on queries
- ❌ NO business logic (just data persistence)

**Example**:

```typescript
// ✅ GOOD: Infrastructure implements domain interface
// modules/production/infrastructure/production-item.prisma-repo.ts

import { prisma } from "@/lib/prisma";
import {
  ProductionItem,
  ProductionItemRepository,
  ProductionItemFilters,
  CreateProductionItemData,
  ProductionStatus,
  ProductionStage,
} from "@/modules/production/domain/ProductionItemRepository";

export class PrismaProductionItemRepository implements ProductionItemRepository {
  async findById(id: string): Promise<ProductionItem | null> {
    const item = await prisma.productionItem.findUnique({
      where: { id },
    });

    return item ? this.mapToDomain(item) : null;
  }

  async findMany(filters: ProductionItemFilters): Promise<ProductionItem[]> {
    const items = await prisma.productionItem.findMany({
      where: {
        jobOrderId: filters.jobOrderId,
        stage: filters.stage,
        status: filters.status,
        userId: filters.userId,
      },
      take: filters.take ?? 100, // Explicit limit
      skip: filters.skip,
      orderBy: { createdAt: "desc" },
    });

    return items.map(this.mapToDomain);
  }

  async create(data: CreateProductionItemData): Promise<ProductionItem> {
    const item = await prisma.productionItem.create({
      data: {
        jobOrderId: data.jobOrderId,
        itemName: data.itemName,
        quantity: data.quantity,
        completedQty: 0,
        stage: "CUTTING",
        status: "PENDING",
      },
    });

    return this.mapToDomain(item);
  }

  async updateStatus(id: string, status: ProductionStatus): Promise<ProductionItem> {
    const item = await prisma.productionItem.update({
      where: { id },
      data: { status },
    });

    return this.mapToDomain(item);
  }

  async updateStage(id: string, stage: ProductionStage): Promise<ProductionItem> {
    const item = await prisma.productionItem.update({
      where: { id },
      data: { stage },
    });

    return this.mapToDomain(item);
  }

  async delete(id: string): Promise<void> {
    await prisma.productionItem.delete({ where: { id } });
  }

  // Map Prisma model to domain entity
  private mapToDomain(item: any): ProductionItem {
    return {
      id: item.id,
      jobOrderId: item.jobOrderId,
      itemName: item.itemName,
      quantity: item.quantity,
      completedQty: item.completedQty,
      stage: item.stage as ProductionStage,
      status: item.status as ProductionStatus,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
```

---

## Dependency Flow

### Allowed Dependencies

Dependencies flow **inward and downward**:

```
Client Layer
  ↓ can import ↓
Delivery Layer
  ↓ can import ↓
Application Layer
  ↓ can import ↓
Domain Layer
  ↑ implemented by ↑
Infrastructure Layer
```

**Dependency Rules**:

| Layer              | Can Import                                      | Cannot Import                       |
| ------------------ | ----------------------------------------------- | ----------------------------------- |
| **Client**         | Delivery, shared components, hooks              | Infrastructure, Domain, Application |
| **Delivery**       | Application, Infrastructure, Domain, shared lib | Nothing (can import all for DI)     |
| **Application**    | Domain only                                     | Infrastructure, Delivery, Client    |
| **Domain**         | Nothing (pure)                                  | All other layers                    |
| **Infrastructure** | Domain only                                     | Application, Delivery, Client       |

### Dependency Inversion Principle

**Key Concept**: Application depends on Domain **interfaces**, Infrastructure **implements** them.

```
Application Layer (uses interface)
        ↓
Domain Layer (defines interface)
        ↑
Infrastructure Layer (implements interface)
```

**Example**:

```typescript
// Domain defines the contract
export interface ProductionItemRepository {
  findById(id: string): Promise<ProductionItem | null>;
}

// Application uses the interface
export class CompleteProductionItemUseCase {
  constructor(private repo: ProductionItemRepository) {}

  async execute(itemId: string) {
    const item = await this.repo.findById(itemId); // Uses interface
    // ...
  }
}

// Infrastructure implements the interface
export class PrismaProductionItemRepository implements ProductionItemRepository {
  async findById(id: string): Promise<ProductionItem | null> {
    return await prisma.productionItem.findUnique({ where: { id } });
  }
}
```

### Why This Matters

**Without Dependency Inversion**:

- Application imports Prisma directly
- Hard to test (need real database)
- Can't swap implementations

**With Dependency Inversion**:

- Application imports domain interface
- Easy to test (mock interface)
- Can swap Prisma for MongoDB, Firebase, etc.

---

## Module Structure

### Standard Module Layout

Every module follows this structure:

```
modules/<module-name>/
├── domain/
│   ├── entities/           # Entity types, interfaces
│   ├── repositories/       # Repository interface definitions
│   ├── events/            # Domain events
│   ├── schemas/           # Zod validation schemas
│   └── index.ts           # Barrel export
│
├── application/
│   ├── use-cases/         # Business use cases
│   ├── services/          # Application services
│   ├── dtos/              # Data Transfer Objects
│   └── index.ts           # Barrel export
│
├── infrastructure/
│   ├── repositories/      # Repository implementations
│   │   ├── *.prisma-repo.ts
│   │   └── index.ts
│   ├── adapters/          # External API adapters
│   └── index.ts           # Barrel export
│
└── presentation/
    ├── api/               # Server-side handlers
    │   ├── handlers/
    │   └── index.ts       # Barrel export (40+ exports)
    ├── server-actions/    # Next.js server actions
    ├── components/        # Module-specific UI components
    ├── hooks/             # Module-specific React hooks
    └── views/             # Page-level components
```

### Module Examples

**Production Module**:

```
modules/production/
├── domain/
│   ├── ProductionItem.ts
│   ├── ProductionItemRepository.ts
│   ├── events/production-events.ts
│   └── schemas/production-item.schema.ts
├── application/
│   ├── complete-production-item.ts
│   ├── assign-production-task.ts
│   └── list-production-items.ts
├── infrastructure/
│   └── production-item.prisma-repo.ts
└── presentation/
    ├── api/
    │   ├── handlers/
    │   │   ├── list-items-handler.ts
    │   │   ├── complete-item-handler.ts
    │   │   └── assign-task-handler.ts
    │   └── index.ts
    └── components/
        ├── ProductionItemsTable.tsx
        └── ProductionStageTimeline.tsx
```

---

## Cross-Cutting Concerns

Shared functionality lives in `server/` and `lib/`:

### server/ (Shared Services)

**Location**: `server/`

**Contents**:

- `server/auth/` - Authentication, session management
- `server/tenancy/` - Multi-tenancy (company isolation)
- `server/audit/` - Audit logging
- `server/events/` - Event bus, event handlers
- `server/approval/` - Approval workflows
- `server/queue/` - Background job queue

**Usage**: Import from any layer

```typescript
import { requireSession } from "@/server/auth/requireAuth";
import { auditLog } from "@/server/audit/auditLog";
import { eventBus } from "@/server/events/event-bus";
```

### lib/ (Shared Utilities)

**Location**: `lib/`

**Contents**:

- `lib/prisma.ts` - Prisma client
- `lib/file-storage.ts` - File upload/download
- `lib/email.ts` - Email sending
- `lib/errors.ts` - Error classes
- `lib/cache/` - Redis caching
- `lib/queue/` - Queue manager

**Usage**: Import from any layer (infrastructure mostly)

---

## Request Flow Examples

### API Request Flow

**User clicks "Complete Production Item" button**

```
1. CLIENT LAYER (Browser)
   ↓
   User clicks button → fetch("/api/production/items/123/complete", { method: "POST" })

2. DELIVERY ENTRY POINT (app/api/production/items/[id]/complete/route.ts)
   ↓
   export async function POST(req: Request, { params }: { params: { id: string } }) {
     const session = await requireSessionForApi();
     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

     const result = await completeProductionItemHandler(params.id, session.user.id);
     return NextResponse.json(result);
   }

3. DELIVERY IMPLEMENTATION (modules/production/presentation/api/handlers/complete-item-handler.ts)
   ↓
   export const completeProductionItemHandler = cache(async (itemId: string, userId: string) => {
     const useCase = new CompleteProductionItemUseCase(
       new PrismaProductionItemRepository(),
       new PrismaInventoryLedgerRepository()
     );
     return await useCase.execute(itemId, userId);
   });

4. APPLICATION LAYER (modules/production/application/complete-production-item.ts)
   ↓
   export class CompleteProductionItemUseCase {
     async execute(itemId: string, userId: string) {
       // Fetch from repository
       const item = await this.productionRepo.findById(itemId);

       // Business rule validation
       if (item.stage !== "FINISHING") {
         throw new Error("Item must be in FINISHING stage");
       }

       // Update status
       const updatedItem = await this.productionRepo.updateStatus(itemId, "COMPLETED");

       // Record in inventory
       await this.inventoryRepo.create({ ... });

       // Publish event
       await eventBus.publish(new ProductionItemCompleted(...));

       return updatedItem;
     }
   }

5. DOMAIN LAYER (modules/production/domain/ProductionItemRepository.ts)
   ↓
   export interface ProductionItemRepository {
     findById(id: string): Promise<ProductionItem | null>;
     updateStatus(id: string, status: ProductionStatus): Promise<ProductionItem>;
   }

6. INFRASTRUCTURE LAYER (modules/production/infrastructure/production-item.prisma-repo.ts)
   ↓
   export class PrismaProductionItemRepository implements ProductionItemRepository {
     async findById(id: string): Promise<ProductionItem | null> {
       const item = await prisma.productionItem.findUnique({ where: { id } });
       return item ? this.mapToDomain(item) : null;
     }

     async updateStatus(id: string, status: ProductionStatus): Promise<ProductionItem> {
       const item = await prisma.productionItem.update({
         where: { id },
         data: { status },
       });
       return this.mapToDomain(item);
     }
   }

7. DATABASE
   ↓
   Prisma → PostgreSQL

8. RESPONSE FLOWS BACK
   ↓
   Infrastructure → Application → Delivery → Client

9. CLIENT LAYER UPDATES
   ↓
   router.refresh() re-runs Server Component with fresh data
```

### Page Load Flow (SSR)

**User navigates to `/dashboard/production/items`**

```
1. CLIENT (Browser)
   ↓
   Browser requests /dashboard/production/items

2. NEXT.JS ROUTING
   ↓
   Routes to app/(dashboard)/production/items/page.tsx

3. SERVER COMPONENT (app/(dashboard)/production/items/page.tsx)
   ↓
   export default async function ProductionItemsPage() {
     const session = await requireSession();

     // Directly call presentation handler
     const items = await listProductionItemsHandler(session.user.id);

     // Pass data as props to Client Component
     return <ProductionItemsClient initialData={items} />;
   }

4. DELIVERY (modules/production/presentation/api/handlers/list-items-handler.ts)
   ↓
   export const listProductionItemsHandler = cache(async (userId: string) => {
     const useCase = new ListProductionItemsUseCase();
     return await useCase.execute({ userId });
   });

5. APPLICATION (modules/production/application/list-production-items.ts)
   ↓
   export class ListProductionItemsUseCase {
     async execute({ userId }: { userId: string }) {
       const repo = new PrismaProductionItemRepository();
       const items = await repo.findMany({ userId, take: 100 });
       return items;
     }
   }

6. INFRASTRUCTURE (modules/production/infrastructure/production-item.prisma-repo.ts)
   ↓
   async findMany(filters) {
     const items = await prisma.productionItem.findMany({
       where: { userId: filters.userId },
       take: 100,
       orderBy: { createdAt: "desc" },
     });
     return items.map(this.mapToDomain);
   }

7. RENDER
   ↓
   Server Component renders with data → sends HTML to browser

8. HYDRATION
   ↓
   Client Component hydrates with initialData prop
```

### Server Action Flow

**User submits form to create production item**

```
1. CLIENT (Browser)
   ↓
   <form action={createProductionItemAction}>
     <input name="itemName" />
     <button type="submit">Create</button>
   </form>

2. DELIVERY (modules/production/presentation/server-actions/create-item.action.ts)
   ↓
   "use server";

   export async function createProductionItemAction(formData: FormData) {
     const session = await requireSession();
     if (!session) redirect("/login");

     // Validate input
     const validated = CreateProductionItemSchema.parse({
       jobOrderId: formData.get("jobOrderId"),
       itemName: formData.get("itemName"),
       quantity: Number(formData.get("quantity")),
     });

     // Call use case
     const useCase = new CreateProductionItemUseCase();
     const item = await useCase.execute(validated, session.user.id);

     revalidatePath("/dashboard/production/items");
     return { success: true, item };
   }

3. APPLICATION → DOMAIN → INFRASTRUCTURE
   ↓
   (Same as API flow)

4. RESPONSE
   ↓
   Form submission completes → page automatically refreshes with new data
```

---

## Architecture Verification

### Automated Verification Scripts

Run these scripts to verify architecture compliance:

```bash
# Verify all layers
npm run verify:all

# Individual checks
npm run verify:layers        # Layer dependency rules
npm run verify:prisma        # Prisma isolation
npm run verify:modules       # Module structure
npm run verify:types         # Type safety (no 'any')
npm run verify:cache         # React.cache() coverage
```

### Verification Rules

**Layer Dependencies** (`verify:layers`):

- ❌ Domain cannot import Application, Infrastructure, Presentation
- ❌ Domain cannot import @prisma/client
- ❌ Application cannot import Infrastructure, Presentation
- ❌ Application cannot import @prisma/client
- ❌ app/ cannot import Infrastructure
- ✅ Infrastructure can import Domain
- ✅ Presentation can import Application, Domain

**Prisma Isolation** (`verify:prisma`):

- ✅ @prisma/client only in lib/prisma.ts and modules/\*/infrastructure/
- ❌ @prisma/client in domain, application, presentation, app/

**Module Structure** (`verify:modules`):

- ✅ Each module has domain/, application/, infrastructure/, presentation/
- ✅ Each layer has index.ts barrel export
- ❌ No orphaned files outside layer folders

**Type Safety** (`verify:types`):

- ❌ No `any` type usage
- ❌ No @ts-ignore, @ts-expect-error, @ts-nocheck
- ❌ No eslint-disable

**Cache Coverage** (`verify:cache`):

- ✅ All handlers in modules/\*/presentation/api/ use React.cache()

### CI/CD Integration

Architecture verification runs automatically:

- **Pre-commit hook**: Runs fast checks before git commit
- **GitHub Actions**: Runs full verification on pull requests
- **Branch protection**: PRs cannot merge if verification fails

---

## Best Practices

### 1. Always Use Repository Interfaces

**❌ Bad**:

```typescript
// Application layer importing Prisma
import { prisma } from "@/lib/prisma";

export async function getProductionItem(id: string) {
  return await prisma.productionItem.findUnique({ where: { id } });
}
```

**✅ Good**:

```typescript
// Application layer using domain interface
import { ProductionItemRepository } from "@/modules/production/domain/ProductionItemRepository";

export class GetProductionItemUseCase {
  constructor(private repo: ProductionItemRepository) {}

  async execute(id: string) {
    return await this.repo.findById(id);
  }
}
```

### 2. Wrap Handlers with cache()

**❌ Bad**:

```typescript
// Handler without cache
export async function listCountries() {
  return await prisma.country.findMany();
}
```

**✅ Good**:

```typescript
// Handler with cache() for deduplication
import { cache } from "react";

export const listCountries = cache(async () => {
  const repo = new PrismaCountryRepository();
  return await repo.findAll();
});
```

### 3. Use Server Components for Initial Data

**❌ Bad**:

```typescript
// Client component fetching in useEffect
"use client";
export function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/orders").then(res => res.json()).then(setOrders);
  }, []);

  return <OrdersTable orders={orders} />;
}
```

**✅ Good**:

```typescript
// Server component fetching, passing to client
export default async function OrdersPage() {
  const orders = await listOrdersHandler();
  return <OrdersClient initialOrders={orders} />;
}
```

### 4. Validate Input with Zod

**❌ Bad**:

```typescript
// Manual validation
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.name || body.name.length > 255) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  // ...
}
```

**✅ Good**:

```typescript
// Zod schema validation
import { CreateItemSchema } from "@/modules/production/domain/schemas/item.schema";

export async function POST(req: Request) {
  const body = await req.json();

  const result = CreateItemSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten(),
      },
      { status: 400 }
    );
  }

  // result.data is type-safe!
}
```

### 5. Use Explicit Limits on Queries

**❌ Bad**:

```typescript
// No limit - could return millions of rows
const items = await prisma.item.findMany({
  where: { userId },
});
```

**✅ Good**:

```typescript
// Explicit limit
const items = await prisma.item.findMany({
  where: { userId },
  take: 100, // Max 100 rows
  orderBy: { createdAt: "desc" },
});
```

### 6. Batch Fetch Related Data

**❌ Bad**:

```typescript
// N+1 query problem
const orders = await prisma.order.findMany();

for (const order of orders) {
  order.customer = await prisma.customer.findUnique({
    where: { id: order.customerId },
  });
}
```

**✅ Good**:

```typescript
// Batch fetch
const orders = await prisma.order.findMany({
  include: { customer: true }, // Single query with JOIN
});

// OR

const orders = await prisma.order.findMany();
const customerIds = orders.map((o) => o.customerId);
const customers = await prisma.customer.findMany({
  where: { id: { in: customerIds } },
});

// Map customers to orders
orders.forEach((order) => {
  order.customer = customers.find((c) => c.id === order.customerId);
});
```

---

## Common Patterns

### Pattern 1: Create Entity

```typescript
// 1. Define schema in domain
// modules/production/domain/schemas/item.schema.ts
export const CreateItemSchema = z.object({
  name: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;

// 2. Use case in application
// modules/production/application/create-item.ts
export class CreateItemUseCase {
  constructor(private repo: ProductionItemRepository) {}

  async execute(data: CreateItemInput, userId: string) {
    const item = await this.repo.create({ ...data, userId });
    await eventBus.publish(new ItemCreated(item.id, userId));
    return item;
  }
}

// 3. Handler in presentation
// modules/production/presentation/api/handlers/create-item-handler.ts
import { cache } from "react";

export const createItemHandler = cache(async (data: CreateItemInput, userId: string) => {
  const useCase = new CreateItemUseCase(new PrismaItemRepository());
  return await useCase.execute(data, userId);
});

// 4. API route in delivery
// app/api/production/items/route.ts
export async function POST(req: Request) {
  const session = await requireSessionForApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const validated = CreateItemSchema.parse(body);

  const item = await createItemHandler(validated, session.user.id);
  return NextResponse.json(item, { status: 201 });
}
```

### Pattern 2: List Entities with Filters

```typescript
// 1. Define filters in domain
export interface ItemFilters {
  status?: ItemStatus;
  category?: string;
  searchTerm?: string;
  take?: number;
  skip?: number;
}

// 2. Use case in application
export class ListItemsUseCase {
  constructor(private repo: ProductionItemRepository) {}

  async execute(filters: ItemFilters) {
    return await this.repo.findMany({
      ...filters,
      take: filters.take ?? 100, // Default limit
    });
  }
}

// 3. Handler in presentation
export const listItemsHandler = cache(async (filters: ItemFilters) => {
  const useCase = new ListItemsUseCase(new PrismaItemRepository());
  return await useCase.execute(filters);
});

// 4. Server component calls handler
export default async function ItemsPage({ searchParams }) {
  const items = await listItemsHandler({
    status: searchParams.status,
    searchTerm: searchParams.q,
  });

  return <ItemsClient initialItems={items} />;
}
```

### Pattern 3: Update Entity Status

```typescript
// 1. Use case in application
export class UpdateItemStatusUseCase {
  constructor(private repo: ProductionItemRepository) {}

  async execute(itemId: string, status: ItemStatus, userId: string) {
    const item = await this.repo.findById(itemId);
    if (!item) throw new Error("Item not found");

    // Business rule validation
    if (!this.canTransitionTo(item.status, status)) {
      throw new Error(`Cannot transition from ${item.status} to ${status}`);
    }

    const updated = await this.repo.updateStatus(itemId, status);
    await eventBus.publish(new ItemStatusChanged(itemId, item.status, status, userId));

    return updated;
  }

  private canTransitionTo(from: ItemStatus, to: ItemStatus): boolean {
    // Business rules for valid transitions
    const transitions = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED", "ON_HOLD"],
      ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    return transitions[from]?.includes(to) ?? false;
  }
}

// 2. Handler
export const updateItemStatusHandler = cache(
  async (itemId: string, status: ItemStatus, userId: string) => {
    const useCase = new UpdateItemStatusUseCase(new PrismaItemRepository());
    return await useCase.execute(itemId, status, userId);
  }
);

// 3. Server action
("use server");

export async function updateItemStatusAction(itemId: string, status: ItemStatus) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const item = await updateItemStatusHandler(itemId, status, session.user.id);

  revalidatePath("/dashboard/production/items");
  return { success: true, item };
}
```

---

## Migration Guide

### Adding a New Module

1. **Create module structure**:

   ```bash
   mkdir -p modules/new-module/{domain,application,infrastructure,presentation/api/handlers}
   ```

2. **Define domain entities** (`modules/new-module/domain/Entity.ts`):

   ```typescript
   export interface MyEntity {
     id: string;
     name: string;
     createdAt: Date;
   }
   ```

3. **Define repository interface** (`modules/new-module/domain/EntityRepository.ts`):

   ```typescript
   export interface MyEntityRepository {
     findById(id: string): Promise<MyEntity | null>;
     findMany(): Promise<MyEntity[]>;
     create(data: CreateEntityData): Promise<MyEntity>;
   }
   ```

4. **Implement repository** (`modules/new-module/infrastructure/entity.prisma-repo.ts`):

   ```typescript
   export class PrismaMyEntityRepository implements MyEntityRepository {
     async findById(id: string) {
       const entity = await prisma.myEntity.findUnique({ where: { id } });
       return entity ? this.mapToDomain(entity) : null;
     }
   }
   ```

5. **Create use cases** (`modules/new-module/application/list-entities.ts`):

   ```typescript
   export class ListEntitiesUseCase {
     constructor(private repo: MyEntityRepository) {}
     async execute() {
       return await this.repo.findMany();
     }
   }
   ```

6. **Create handlers** (`modules/new-module/presentation/api/handlers/list-entities-handler.ts`):

   ```typescript
   import { cache } from "react";

   export const listEntitiesHandler = cache(async () => {
     const useCase = new ListEntitiesUseCase(new PrismaMyEntityRepository());
     return await useCase.execute();
   });
   ```

7. **Create API routes** (`app/api/new-module/route.ts`):

   ```typescript
   export async function GET() {
     const entities = await listEntitiesHandler();
     return NextResponse.json(entities);
   }
   ```

8. **Run verification**:
   ```bash
   npm run verify:all
   ```

### Refactoring Existing Code

**Goal**: Move business logic from API routes to application layer

**Before**:

```typescript
// app/api/items/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  // ❌ Business logic in API route
  const item = await prisma.item.create({
    data: {
      name: body.name,
      quantity: body.quantity,
    },
  });

  // ❌ More business logic
  if (item.quantity < 10) {
    await prisma.notification.create({
      data: { message: "Low stock alert" },
    });
  }

  return NextResponse.json(item);
}
```

**After**:

```typescript
// 1. Create use case (application layer)
// modules/inventory/application/create-item.ts
export class CreateItemUseCase {
  constructor(
    private itemRepo: ItemRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async execute(data: CreateItemInput) {
    const item = await this.itemRepo.create(data);

    // Business logic in use case
    if (item.quantity < 10) {
      await this.notificationRepo.create({
        message: `Low stock alert: ${item.name}`,
      });
    }

    return item;
  }
}

// 2. Create handler (presentation layer)
// modules/inventory/presentation/api/handlers/create-item-handler.ts
export const createItemHandler = cache(async (data: CreateItemInput) => {
  const useCase = new CreateItemUseCase(
    new PrismaItemRepository(),
    new PrismaNotificationRepository()
  );
  return await useCase.execute(data);
});

// 3. Thin API route (delivery layer)
// app/api/items/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const validated = CreateItemSchema.parse(body);

  const item = await createItemHandler(validated);
  return NextResponse.json(item, { status: 201 });
}
```

---

## Summary

### Key Takeaways

1. **5-layer architecture** ensures separation of concerns
2. **Dependencies flow inward**: Client → Delivery → Application → Domain ← Infrastructure
3. **Domain defines contracts**, Infrastructure implements them
4. **Application orchestrates** business workflows
5. **Delivery is thin**: parse, validate, delegate
6. **Automated verification** enforces rules

### Quick Reference

| Layer          | Location                                  | Role                 | Can Import                                       |
| -------------- | ----------------------------------------- | -------------------- | ------------------------------------------------ |
| Client         | `app/`, `components/`                     | UI, user interaction | Delivery, shared libs                            |
| Delivery       | `app/api/`, `modules/*/presentation/api/` | HTTP handling, DI    | Application, Infrastructure, Domain, shared libs |
| Application    | `modules/*/application/`                  | Business workflows   | Domain only                                      |
| Domain         | `modules/*/domain/`                       | Entities, contracts  | Nothing (pure)                                   |
| Infrastructure | `modules/*/infrastructure/`, `lib/`       | DB, external APIs    | Domain only                                      |

### Next Steps

1. **Read this guide** thoroughly
2. **Review existing modules** to see patterns
3. **Run verification scripts** to understand current state
4. **Follow patterns** when adding new features
5. **Ask questions** if unsure where code belongs

---

**Questions? Issues? Suggestions?**

This is a living document. If you find gaps, errors, or have suggestions for improvement, please update this guide or discuss with the team.

---

**Last Updated**: 2026-03-13
**Version**: 1.0.0

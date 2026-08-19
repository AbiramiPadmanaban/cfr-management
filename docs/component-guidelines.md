# Component Guidelines

Standards for authoring UI components in the Istana ERP codebase.

---

## Two-tier component model

### Tier 1 — `components/ui/`

shadcn/Radix primitives only (Button, Dialog, Input, etc.).

- **No** business logic.
- **No** data fetching or direct API calls.
- **No** global state access.
- Props are primitive values or callbacks; no domain types.

### Tier 2a — `components/shared/`

Reusable cross-module display components (e.g. `EntityPageHeader`, `SectionCard`, `StatusBadge`).

- **No** direct API calls.
- **No** global state access (use props to receive data from the parent).
- May import from `components/ui/` and `types/`.
- Re-exported from `components/index.ts`.

### Tier 2b — `modules/*/presentation/components/`

Domain components that belong to one specific module (e.g. `QuotationHeader`, `WorkflowList`).

- Scoped to their module; **never** imported by another module.
- May call module-specific hooks and server actions.
- Re-exported from `modules/<name>/presentation/index.ts`.

---

## Standalone reusable component contract

A component is "standalone reusable" (Tier 1 or 2a) when it satisfies all of:

1. **Props-only**: receives all data via props; does not fetch data internally.
2. **No direct API calls**: no `fetch`, no server action calls inside the component body.
3. **No global state**: does not read from Zustand, React Context (other than UI-primitive contexts), or similar.
4. **No side effects on mount**: does not trigger mutations when first rendered.

---

## Props interface rules

- Props must be typed with a **named interface**, exported from the same file.
- Interface name: `<ComponentName>Props` — e.g. `QuotationHeaderProps`.
- No inline anonymous object types as prop types.
- No `any` in props — use explicit types or `unknown` + type guard.

```tsx
// Good
export interface QuotationHeaderProps {
  quotationNumber: string;
  status: QuotationStatus;
  onEdit: () => void;
}

export function QuotationHeader({ quotationNumber, status, onEdit }: QuotationHeaderProps) { … }

// Bad — anonymous inline object
export function QuotationHeader({ quotationNumber, status }: { quotationNumber: string; status: string }) { … }
```

---

## `"use client"` vs server component

| Use `"use client"` when…                              | Keep as server component when…                     |
| ----------------------------------------------------- | -------------------------------------------------- |
| Component uses React state (`useState`, `useReducer`) | Component only displays data passed as props       |
| Component uses browser APIs (`window`, `document`)    | Component renders static or server-fetched content |
| Component uses event handlers                         | No interactivity needed                            |
| Component uses `useEffect`                            |                                                    |

Default to **server component**. Only add `"use client"` when you actually need client features.

---

## Composition pattern (container → display)

Prefer separating data concerns from display:

```
QuotationDetailPage (server component — fetches data)
  └── QuotationDetailView (client or server — orchestrates layout)
        ├── QuotationHeader (display — receives props)
        ├── QuotationItemTable (display — receives props)
        └── PricingSummary (display — receives props)
```

- Container (page/view) is responsible for fetching data and passing it down.
- Display components are pure: same props → same output.

---

## File and export naming

- Component file: `kebab-case.tsx` (e.g. `quotation-header.tsx`)
- Barrel entry: **named export** (e.g. `export { QuotationHeader } from "./quotation-header"`)
- Do **not** use default exports for components — named exports are required for barrel re-export.
- One primary component per file; helper sub-components may coexist if small.

---

## What must NOT live in `components/` root

- Module-specific components (quotation forms, workflow editors, job card views, etc.) → go in `modules/<name>/presentation/components/`
- Business logic or domain rules → go in `modules/<name>/application/` or `domain/`
- API route handlers → go in `modules/<name>/presentation/api/`

# shadcn/ui — Components and MCP

The Istana ERP app uses **shadcn/ui** for shared UI components. This doc covers setup, where components live, and how to use the **shadcn MCP** in Cursor to add and explore components.

---

## 1. Overview

- **shadcn/ui** is a collection of copy-paste React components built on Radix UI and Tailwind CSS. You own the code; components are added to your repo, not installed as a dependency.
- We use it for **shared primitives** (Button, Card, Dialog, Input, Select, Table, etc.) so the app stays consistent and accessible.
- **Tailwind 4** is already configured; shadcn works with Tailwind 4 (CSS variables for theming). Ensure `components.json` is set up after init (see below).
- **Theme**: The project uses a **single theme** (Stone base color, light only). There is no light/dark toggle; the app uses one consistent look. Stone gives a warm, wooden feel suited to Istana as a furniture ERP. It is set in `components.json` (`baseColor: "stone"`) and in `app/globals.css` (`:root` only; no `.dark`). See [shadcn Theming](https://ui.shadcn.com/docs/theming) for other base colors (neutral, zinc, gray, slate).
- Official docs: [ui.shadcn.com](https://ui.shadcn.com) · [Installation (Next.js)](https://ui.shadcn.com/docs/installation/next) · [CLI](https://ui.shadcn.com/docs/cli) · [MCP](https://ui.shadcn.com/docs/mcp).

---

## 2. Installation and setup

### One-time init

From the **project root** (no `src/`), run:

```bash
npx shadcn@latest init
```

- Choose **Next.js** when prompted.
- Use **`--no-src-dir`** if the CLI offers a `src` directory option — we keep the standard Next.js app structure (app at root).
- The CLI installs dependencies (e.g. `class-variance-authority`, `clsx`, `tailwind-merge`), adds the `cn` utility, and creates **`components.json`**. It may add **`components/ui/`** as the default path for components.

### Add a component

```bash
npx shadcn@latest add button
npx shadcn@latest add card dialog input
```

Components are added under the path configured in `components.json` (typically **`components/ui/`**). Import from there, e.g. `@/components/ui/button`.

### Path alignment with this project

- **Shared shadcn primitives** → **`components/ui/`** (e.g. `components/ui/button.tsx`, `components/ui/card.tsx`). This matches the default shadcn layout and keeps all shadcn components in one place.
- **Our own shared composites** → **`components/`** (non-ui subfolders or files as needed). See [Folder architecture](folder-architecture.md).
- **Module-specific UI** → **`modules/<name>/presentation/views/`** (or `presentation/components/`). Use shadcn primitives from `@/components/ui/` there; do not duplicate shadcn component code in modules.

---

## 3. Using components

- Import from the path defined in `components.json` (e.g. `@/components/ui/button`):

```tsx
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

- Use in **Server Components** or **Client Components** as appropriate. If a shadcn component uses hooks or browser APIs, it will have `"use client"`; our code stays component-based and follows [Dos and don'ts](dos-and-donts.md) (no `any`, no monoliths).
- Theming and dark mode are configured via CSS variables (see shadcn [Theming](https://ui.shadcn.com/docs/theming) and [Dark Mode](https://ui.shadcn.com/docs/dark-mode)). Our global CSS lives in `app/globals.css` (Tailwind 4); shadcn’s theme variables can be added there or in a dedicated theme file.

---

## 4. shadcn MCP (Cursor)

The **shadcn MCP server** lets the AI in Cursor list, inspect, and add shadcn components and blocks via tools. Use it to get context and add components without leaving the editor.

### Enabling the MCP in Cursor

1. Add the shadcn server to your project’s MCP config. For Cursor, that is **`.cursor/mcp.json`** (or the path Cursor uses for MCP):

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

2. Restart Cursor or reload MCP, then enable the **shadcn** server in Cursor settings. When connected, you should see the shadcn tools available.

See [Cursor MCP documentation](https://docs.cursor.com/context/mcp#using-mcp-json) and [shadcn MCP docs](https://ui.shadcn.com/docs/mcp).

### MCP tools (this project)

The shadcn MCP exposes tools that your AI assistant can call. Typical tools:

| Tool                        | Purpose                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| **list_components**         | List all available shadcn/ui components (e.g. accordion, alert, button, card, dialog, input, table).    |
| **get_component**           | Get the source code for a component by name (e.g. `button`, `card`) so it can be added or compared.     |
| **get_component_metadata**  | Get metadata for a component (description, dependencies, etc.).                                         |
| **get_component_demo**      | Get demo/usage code for a component.                                                                    |
| **get_directory_structure** | Get the directory structure of the shadcn registry (path/owner/repo/branch optional).                   |
| **list_blocks**             | List available blocks (e.g. dashboard, login, sidebar), optionally by category.                         |
| **get_block**               | Get source for a block by name (e.g. `dashboard-01`, `login-02`), optionally including component files. |

**Note:** Some tools may depend on external APIs (e.g. GitHub). If a tool fails, use the CLI (`npx shadcn@latest add <component>`) or the [Registry Directory](https://ui.shadcn.com/docs/directory) and [Components](https://ui.shadcn.com/docs/components) docs instead.

### Example prompts (with MCP enabled)

- “Show me all available shadcn components.”
- “Add the Button, Card, and Dialog components to the project.”
- “Get the source for the Table component.”
- “Show me the demo for the Form component.”
- “List blocks in the dashboard category.”
- “Add a login form using shadcn components.”

The AI will use the MCP tools to list or fetch components/blocks and can then add files under `components/ui/` (or the path in `components.json`) and wire imports.

### Registries

- The default **shadcn/ui** registry is built in; no extra config is required to add core components.
- Additional registries (e.g. private or third-party) can be configured in **`components.json`** under `registries`. See [Registry](https://ui.shadcn.com/docs/registry) and [Configuring Registries](https://ui.shadcn.com/docs/mcp#configuring-registries). Namespaced installs: `npx shadcn add @namespace/component`.

---

## 5. Rules and alignment with this project

- **Component-based, no monoliths** — Compose pages from small components; use shadcn primitives inside those components. Do not build one giant page that inlines everything. See [Dos and don'ts](dos-and-donts.md).
- **No `any`** — shadcn components are typed; keep props and state strictly typed. See [Dos and don'ts](dos-and-donts.md).
- **Where to put what** — shadcn primitives in **`components/ui/`**; shared composites in **`components/`**; module-specific views in **`modules/<name>/presentation/`**. See [Folder architecture](folder-architecture.md).
- **Rendering** — Use SSR for tenant/auth pages; use Client Components only where needed (interactivity, hooks). See [Next.js Rendering Handbook](nextjs-rendering-handbook.md).
- **Forms** — shadcn supports [React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) and [TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form). Prefer server actions + validation for mutations; use forms in client components that call those actions. See [Developer guide](developer-guide.md) (server actions).

---

## 6. Quick reference

| Task                | Command or action                                                       |
| ------------------- | ----------------------------------------------------------------------- |
| Init shadcn         | `npx shadcn@latest init` (use `--no-src-dir` if prompted)               |
| Add component       | `npx shadcn@latest add button` (or `card`, `dialog`, etc.)              |
| Add multiple        | `npx shadcn@latest add button card input`                               |
| View before adding  | `npx shadcn@latest view button`                                         |
| List registry items | `npx shadcn@latest list @shadcn` (or other registry)                    |
| Import in app       | `import { Button } from "@/components/ui/button"`                       |
| MCP in Cursor       | Configure `.cursor/mcp.json` → enable shadcn server → use prompts above |

---

## 7. Links

- [Installation (Next.js)](https://ui.shadcn.com/docs/installation/next)
- [CLI](https://ui.shadcn.com/docs/cli) — init, add, view, search, list
- [MCP Server](https://ui.shadcn.com/docs/mcp) — Cursor/Claude/VS Code setup, registries, example prompts
- [Registry Directory](https://ui.shadcn.com/docs/directory) — community registries
- [Components](https://ui.shadcn.com/docs/components) — all radix/shadcn components
- [Blocks](https://ui.shadcn.com/docs/blocks) — pre-built sections and pages

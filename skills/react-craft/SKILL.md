---
name: react-craft
description: Enforces React naming, component and route structure, state ownership, readability, and test-first development. Use when creating, reviewing, or refactoring React components, hooks, pages, or routes, or when a React file is too long, badly named, or mixes concerns.
metadata:
  version: "2.0.0"
---

# React craft

Naming, structure, state ownership, tests, and readability for React code.

Works on its own. When `coding-core` is installed it owns the shared numbers and naming; the values below
match it. When they differ, `coding-core` wins.

Companion skills, installed separately:

```bash
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices   # hooks, effects, bundle size
npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns   # compound components
npx skills add obra/superpowers --skill test-driven-development               # TDD loop
```

## 1. Test first

List the test cases before writing the component. Tests sit next to the code they test.

- Query by role, label, or text. A class name or test ID only when nothing else works.
- One behavior per `it()`, named as the behavior: `disables submit when the form has errors`.
- Priority: user behavior, conditional rendering, edge cases (empty, error, loading, overflow), accessibility.
- No snapshot tests unless the markup is static and rarely changes.
- Bug fix: first a test that fails on the unpatched code.

```tsx
it("calls onSearch with the trimmed query on submit", async () => {
  const onSearch = vi.fn();

  render(<SearchInput onSearch={onSearch} />);

  await userEvent.type(screen.getByRole("searchbox"), "  react hooks  ");
  await userEvent.keyboard("{Enter}");

  expect(onSearch).toHaveBeenCalledWith("react hooks");
});
```

## 2. Naming

| Thing | Rule | Good | Bad |
|---|---|---|---|
| Component | PascalCase noun, no abbreviations | `InvoiceTable` | `Table1`, `AvatarDD` |
| Boolean prop or variable | `is`, `has`, `should`, `can` | `isOnSale` | `sale` |
| Event prop / internal handler | `on…` / `handle…` | `onAddToCart`, `handleRowClick` | `click` |
| Hook | `use` + capability | `usePaginatedProducts` | `useData` |
| Transform | verb + noun | `formatPrice`, `toSlug` | `process` |
| Collection | plural | `cartItems` | `itemList` |

Files and folders are kebab-case, always:

| File | Example |
|---|---|
| Component | `order-list-table.tsx` |
| Hook | `use-order-filters.ts` |
| Feature rules | `order-rules.ts` |
| API calls | `orders.api.ts` |
| Query keys and options | `orders.queries.ts` |
| Test | `order-list-table.test.tsx` |

## 3. Component anatomy

Same order in every component: types, component-scoped constants, then inside the component hooks,
derived values, handlers, guard returns, render.

```tsx
interface InquiriesPageProps {
  workspaceId: string;
}

export function InquiriesPage({ workspaceId }: InquiriesPageProps) {
  const query = useInquiries(workspaceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (query.isPending) {
    return <InquiriesSkeleton />;
  }

  if (query.isError) {
    return <InquiriesError error={query.error} />;
  }

  if (query.data.length === 0) {
    return <InquiriesEmptyState />;
  }

  return <InquiriesTable inquiries={query.data} selectedId={selectedId} onSelect={setSelectedId} />;
}
```

- Every hook runs before the first guard return. A guard clause must never make a hook conditional.
- Guards are multiline blocks, never `if (x) return y;` on one line. No nested ternaries.
- Name important decisions before the JSX instead of evaluating them inline.
- Destructure props in the signature. More than 5–7 props: consider composition.
- One component per file; a tiny private helper may stay.
- 200 lines per file, hard limit. Split into hooks or sub-components before that.
- Comments only for a constraint, as `/* */`, 8 words or fewer.

## 4. Structure

Group by feature or route, never by type. No root `utils/`, `helpers/`, `hooks/`, or `types/` folders.

```
src/
├── components/ui/              generic primitives only (button, dialog)
├── features/orders/
│   ├── order-list-page.tsx     orchestrates, holds no logic
│   ├── order-list-table.tsx
│   ├── use-order-filters.ts
│   ├── order-rules.ts
│   ├── orders.api.ts
│   └── orders.queries.ts
└── app/router.tsx              lazy routes only
```

A small app can start with one `features/` folder per screen. Promote code to shared only when a second
feature needs it, and give the shared module a specific name (`format-currency.ts`).

- Page files orchestrate hooks and components. No table columns, query logic, or form schemas inside.
- Routes lazy-load: `{ path: "/orders", lazy: () => import("@/features/orders/order-list-page") }`.
- A protected route checks the session; it is not object-level authorization. The server enforces that.
- No `.service.ts` files on the client by analogy with the backend.
- Feature barrels expose only that feature's public API. No broad root barrels; import from the source file.
- No circular imports between features.

## 5. State ownership

| State | Owner |
|---|---|
| Server data | the query cache (`orders.queries.ts`), never copied into a store |
| Filters, sorting, pagination worth sharing | the URL |
| Form values and errors | the form library or the form component |
| Dialog open, selection, expansion | local `useState` |
| Values computable from other state | derived during render, never synced by an effect |
| State shared across routes | one deliberately scoped global store |

- Props drilled more than 2 levels signal a missing boundary: compose, or scope a context to that tree.
- Theme and appearance values go through CSS variables, not inline `style` values.

## 6. Anti-patterns

- **God file:** a 941-line `data-table.tsx` holding an unrelated `ProjectFilter`. One concern per file.
- **Fat provider:** a 460-line `auth-provider.tsx` that fetches, stores, and renders. Split into
  `use-auth.ts`, `auth-context.tsx`, `auth-guard.tsx`.
- **Flat route dumping:** every page in `routes/pages/` sharing one `routes/components/`. Colocate instead.
- **Static router imports:** every page imported at the top of the router. Lazy-load each route.

## 7. Accessibility

- `<button>` for actions, `<a>` for navigation, never `<div onClick>`.
- Every interactive element is focusable with a visible focus ring; Escape closes overlays.
- `aria-label` on icon buttons, `aria-live` for async updates, `aria-expanded` on toggles.
- Targets at least 24×24px everywhere, 44×44px on touch layouts.

## 8. Pre-ship checklist

- [ ] Tests cover behavior, edge cases, and accessibility; a bug fix has a test that failed first
- [ ] Names describe what each thing is and does
- [ ] Every file under 200 lines; pages only orchestrate
- [ ] Hooks run before guard returns; guards are multiline
- [ ] No `any`, no `console.log`, no magic strings or numbers
- [ ] Loading, error, and empty states handled
- [ ] Keyboard navigable, targets sized
- [ ] Routes lazy-loaded, imports direct, no root barrels
- [ ] Server data stays in the query cache

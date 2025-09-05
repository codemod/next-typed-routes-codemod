# next-typed-routes

Transform Next.js `page.tsx` components to use typed route props types based on their file path location.

## How to run?

```bash
npx codemod@latest next-typed-routes
```

This codemod automatically transforms Next.js App Router page and layout components to use `PageProps<"/foo/bar">` and `LayoutProps<"/foo">` types based on their file system location.

### What it does:

- Converts manual prop type definitions to typed route props
- Automatically infers the route path from the file location
- Handles dynamic routes like `[id]`, `[slug]`, etc.
- Skips route groups like `(group)` in the path
- Skips parallel routes like `@modal`, `@auth` in the path
- Supports both page and layout components

### Examples:

**Before:**

```tsx
// File: src/app/foo/[id]/page.tsx
export default function Page(props: { params: { id: string } }) {
  return <div>Hello {props.params.id}</div>;
}
```

**After:**

```tsx
// File: src/app/foo/[id]/page.tsx
export default function Page(props: PageProps<"/foo/[id]">) {
  return <div>Hello {props.params.id}</div>;
}
```

**Route path resolution:**

- `/home/user/project/src/app/page.tsx` → `PageProps<"/">`
- `/home/user/project/src/app/foo/page.tsx` → `PageProps<"/foo">`
- `/home/user/project/src/app/foo/[id]/page.tsx` → `PageProps<"/foo/[id]">`
- `/home/user/project/src/app/(group)/foo/page.tsx` → `PageProps<"/foo">` (group ignored)
- `/home/user/project/src/app/@modal/login/page.tsx` → `PageProps<"/login">` (parallel route ignored)
- `/home/user/project/src/app/foo/layout.tsx` → `LayoutProps<"/foo">`

### Requirements:

- Next.js App Router project structure
- TypeScript files with `.tsx` extension
- Page or layout components exported as default exports
- Components must be function declarations, function expressions, or arrow functions

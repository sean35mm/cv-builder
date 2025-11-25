# Agent Guidelines for cv-builder

## Build/Test Commands

- `bun run dev` - Start dev server (frontend + backend in parallel)
- `bun run dev:frontend` - Start Next.js only
- `bun run dev:backend` - Start Convex backend with type checking
- `bun run build` - Build for production
- `bun run lint` - Type check both frontend (tsconfig.json) and backend (convex/tsconfig.json), then run Next.js linter

## Code Style

**Imports**: Use path aliases (`@/components/*`, `@/convex/*`, `@/lib/*`). Always import Convex types from `@/convex/_generated/api` and `@/convex/_generated/dataModel`.
**Formatting**: Single quotes, semicolons, ES5 trailing commas (see .prettierrc). Use Prettier for all files.
**TypeScript**: Strict types disabled but prefer explicit types. Use `Id<'tableName'>` for document IDs. Import `Doc<'tableName'>` for document types. Use `type` for interfaces, not `interface` keyword.
**React**: Use function components with hooks. Import from `'react'` not `'react-dom'`. Use shadcn/ui components from `@/components/ui/*`.
**Naming**: camelCase for variables/functions, PascalCase for components/types, UPPER_SNAKE_CASE for constants.
**Error Handling**: Throw descriptive errors in mutations/queries (e.g., `throw new Error('Not authenticated')`). Use `toast` from `sonner` for user-facing errors in components.

## Convex Guidelines (CRITICAL - see .cursor/rules/convex_rules.mdc)

**Function Syntax**: Always use new syntax with `args`, `handler`, and `returns` validators. Example: `export const f = query({ args: {}, returns: v.null(), handler: async (ctx, args) => { ... } })`.
**Validators**: Always include argument and return validators. Use `v.null()` if function returns nothing. Use `v.optional()` for optional fields. Use `v.literal()` for discriminated unions with `as const`.
**Queries**: Never use `.filter()` - always define indexes in schema and use `.withIndex()`. Use `.unique()` for single results. Use `.order('desc')` for descending order.
**Mutations**: Use `ctx.db.patch()` for partial updates, `ctx.db.replace()` for full updates. Never use `.delete()` on query results - collect results and call `ctx.db.delete(row._id)` on each.
**Auth**: Use `getAuthUserId(ctx)` from `@convex-dev/auth/server` to get current user. Check `if (!userId)` and throw error or return null.
**File References**: Use `api.filename.functionName` for public functions, `internal.filename.functionName` for internal functions. Never pass functions directly.

## Project-Specific

**Profile Data**: All profile data stored in `profiles` table with userId, username, and sections (experience, education, skills, projects, certifications, volunteering, exhibitions, awards).
**Color Themes**: Use literal types for themes (sage, ocean, rose, amber, slate, sand, cocoa, peach, forest, olive, teal, mauve).
**Section Order**: Use `sectionsOrder` array to control profile section display order. Default order in `lib/types.ts`.

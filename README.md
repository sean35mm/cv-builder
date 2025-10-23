# OpenCV — Open Source CV Builder

A modern, full‑stack CV builder with live editing, strong validation, drag‑and‑drop section ordering, and SEO‑friendly public profiles at `/@{username}`. Built with Next.js 15, React 19, Tailwind CSS 4, and Convex for data + auth.

> Note: Not related to the computer vision library “OpenCV”. This project’s short name is “Open CV”.

## Features

- Profile editor: name, title, location, bio, contact links, experience, education, skills, projects, certifications, volunteering, exhibitions, awards
- Live preview: real‑time preview that mirrors saved output
- Validation: comprehensive Zod schemas, cross‑field checks (date ranges), URL/email normalization, unique skills
- Drag & drop: reorder content sections with `@dnd-kit` and persist order
- Public profiles: toggle `Public` to publish at `/@{username}` with SSR, metadata, and JSON‑LD for SEO
- Auth: email/password via `@convex-dev/auth`
- Typed data model: strict Convex schema with indexes and owner checks

## Theming

- Light, Dark, and System (default is System)
- Implemented with `next-themes` using `class` on `<html>`
- Toggle is fixed top-right on all routes; preference persists

## Tech Stack

- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn‑style UI primitives, Framer Motion
- Forms/validation: `react-hook-form`, `zod`
- Drag & drop: `@dnd-kit/core`, `@dnd-kit/sortable`
- Backend: Convex (database, server functions, auth, HTTP router)
- Auth: **Temporary** `@convex-dev/auth` (Password provider)
- Tooling: TypeScript, ESLint, Prettier; package manager defaults to Bun but npm/pnpm work

## Routes

- `/`: Marketing landing (unauthenticated for all; authenticated users are redirected client-side to `/editor`)
- `/editor`: Authenticated workspace (sidebar visible)
- `/@{username}` or `/u/{username}`: Public profile view (no sidebar)

## Architecture

### App flow

- Unauthenticated: marketing landing (hero, features, workflow, gallery, FAQ) with auth modal
- Authenticated:
  - No profile → `ProfileSetup` (username availability check)
  - Profile exists → `ProfileEditor` (live preview + DnD reordering)

### Routing & SSR

- Next.js SSR page: `app/u/[username]/page.tsx` renders public profiles; `middleware.ts` rewrites `/@{username}` → `/u/{username}` (revalidate: 300s)
- Convex HTTP route: `convex/router.ts` also serves `/@{username}` directly with HTML + metadata (alternative backend‑hosted SSR)
- Auth routes are added to the Convex HTTP router in `convex/http.ts`

### Data/Functions

- Schema: `convex/schema.ts` (profiles table + Convex Auth tables)
- Queries/Mutations: `convex/profiles.ts` with strict validators and owner checks
- Auth: `convex/auth.ts` configures Password auth and exposes `auth.loggedInUser`

## Data Model

Defined in `convex/schema.ts` with indexes for efficient lookups.

Table: `profiles`

- Ownership: `userId: Id<'users'>`
- Identity: `username: string` (indexed, unique by logic)
- Basics: `name`, `title?`, `location?`, `bio?`
- Contact: `email?`, `website?`, `github?`, `linkedin?`, `twitter?`
- Arrays:
  - `experience[]`: `{ id, role, company, startDate, endDate?, current, description? }`
  - `education[]`: `{ id, degree, school, startDate, endDate?, current, description? }`
  - `skills[]: string[]`
  - `projects[]`: `{ id, title, year, company?, link?, description? }`
  - `certifications[]`: `{ id, name, issuer, year?, credentialId?, link?, description? }`
  - `volunteering[]`: `{ id, role, organization, startDate, endDate?, current, description? }`
  - `exhibitions[]`: `{ id, title, venue?, year, location?, link?, description? }`
  - `awards[]`: `{ id, title, issuer, year, link?, description? }`
- Presentation: `sectionsOrder?: string[]`, `isPublic: boolean`
- Indexes: `by_user(userId)`, `by_username(username)`

## Public API (Convex)

Queries

- `auth.loggedInUser()`: current user or `null`
- `profiles.getMyProfile()`: current user’s profile or `null`
- `profiles.getProfileByUsername({ username })`: public profile or `null`
- `profiles.checkUsernameAvailable({ username })`: `true` if unused

Mutations

- `profiles.createProfile({...})`: one profile per user; enforces unique `username`; initializes arrays; sets `isPublic=false`
- `profiles.updateProfile({...})`: updates full profile; enforces ownership

HTTP

- `GET /@{username}` (Convex HTTP router): server‑renders profile HTML with OG/Twitter/JSON‑LD; returns 404 when missing or private

## Validation & Editor Behavior

- Cross‑field checks: start/end month ordering; end date omitted when `current=true`
- Normalization: trims values; coerces blank optionals to `undefined` before saving; deduplicates skills (case‑insensitive)
- Section order: `sectionsOrder` is persisted; unknown IDs are ignored; editor guards against duplicates
- Public toggle: `isPublic` controls visibility; public fetches never leak private profiles

## Local Development

Prereqs: Node.js 18+ (or Bun 1.1+)

Install

```bash
# with bun
bun install
# or with npm
npm install
```

Run (Next + Convex in parallel)

```bash
# with bun
bun run dev
# or with npm
npm run dev
```

Scripts

- `dev`: `next dev` and `convex dev` in parallel
- `build`: `next build`
- `start`: `next start`
- `lint`: typechecks Convex + app and lints

## Environment Variables

- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL; defaults to `http://localhost:3210` in `app/ConvexClientProvider.tsx`
- `CONVEX_SITE_URL`: Used by `convex/auth.config.ts` to configure auth application domain
- `NEXT_PUBLIC_SITE_URL`: Used in `app/u/[username]/page.tsx` to generate canonical/OG/Twitter URLs

Create `.env.local` in the project root for Next variables, and configure Convex env via the Convex dashboard/CLI for production.

## Deployment

Frontend: Vercel (see `vercel.json`)

- Build command: `bun run build` (or `npm run build`)

Backend: Convex Cloud

- Deploy Convex functions/schema: `npx convex deploy`
- Set `NEXT_PUBLIC_CONVEX_URL` in Vercel to your Convex prod URL
- Set `CONVEX_SITE_URL` to your public site domain
- Set `NEXT_PUBLIC_SITE_URL` to the same public URL (for metadata)

Public Profiles

- Vercel serves `/@{username}` via `middleware.ts` → `app/u/[username]`
- Alternatively serve directly from Convex HTTP `/@{username}`

## Security

- Ownership checks: mutations derive `userId` from server context (`getAuthUserId`); only owners can write
- Public access: public queries only return data when `isPublic=true`
- HTML escaping: Convex HTML renderer escapes user content in `convex/router.ts`

## Project Structure

- `app/`: Next.js routes, layout, providers
- `components/`: UI, editor sections, landing, public view
- `convex/`: schema, auth, queries/mutations, HTTP router
- `lib/`: shared types/utilities

## Contributing

Issues and PRs are welcome. Please include a clear rationale and concise changeset. Keep changes minimal and consistent with existing patterns. Type first, validate at boundaries, and avoid unnecessary abstractions.

## Roadmap

- [ ] Change auth from beta convex to a solved 3rd party auth provider
- [ ] PDF export / print‑ready layout
- [ ] Themes and shareable presets
- [ ] Custom domains for public profiles
- [ ] Media support (avatar, images via Convex storage for projects, exhibitions, awards)
- [ ] Unlisted links / passcode‑protected profiles

## License

MIT.

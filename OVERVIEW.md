# Chef CV Builder — Overview

## What this app does

Build a professional CV you can edit in the browser and publish at a shareable URL. Authenticated users create and maintain a profile (name, title, location, bio, experience, education, skills, and contact links). When marked public, the profile is available at a server‑rendered route for fast loads and good SEO.

## Key features

- **Authentication**: Email/password and anonymous sign‑in via Convex Auth.
- **Profile setup**: Guided first‑time setup with live username availability check.
- **Profile editing**: Tabbed editor for basic info, experience, education, and skills.
- **Live preview**: Real‑time preview while editing.
- **Public profile**: Toggle to publish your profile at `/@{username}` with server‑rendered HTML and SEO metadata.

---

## Architecture

### Frontend (React + Vite + Tailwind)

- Entry: `src/main.tsx` wraps the app with `ConvexAuthProvider` using `VITE_CONVEX_URL`.
- App shell: `src/App.tsx`
  - Uses `Authenticated`/`Unauthenticated` states.
  - Shows `SignInForm` when logged out.
  - Shows `ProfileSetup` when logged in without a profile.
  - Shows `ProfileEditor` with a live `ProfilePreview` when a profile exists.
  - Detects client navigation to `/@{username}` and renders `PublicProfile`, while linking to the server‑rendered version.
- Components
  - `src/components/profile-setup.tsx`: create profile; checks `profiles.checkUsernameAvailable`.
  - `src/components/profile-editor.tsx`: update profile; toggle `isPublic`.
  - `src/components/profile-preview.tsx`: presentational rendering of a profile.
  - `src/components/public-profile.tsx`: client view that fetches by username.
  - `src/SignInForm.tsx`, `src/SignOutButton.tsx`: Convex Auth UI.

### Backend (Convex)

- Auth: `convex/auth.ts`
  - Providers: Password and Anonymous.
  - Query: `auth.loggedInUser` returns current user or `null`.
- Profiles: `convex/profiles.ts`
  - Queries
    - `profiles.getMyProfile`: current user's profile or `null`.
    - `profiles.getProfileByUsername`: public profile by username or `null`.
    - `profiles.checkUsernameAvailable`: `true` when username unused.
  - Mutations
    - `profiles.createProfile`: ensures unique `username` and one profile per user; initializes arrays and sets `isPublic=false`.
    - `profiles.updateProfile`: updates fields including `isPublic`.
- HTTP routes (SSR): `convex/router.ts` and `convex/http.ts`
  - `GET /@{username}` server‑renders the public profile with meta tags, structured data, and Tailwind via CDN.
  - `convex/http.ts` attaches Convex Auth routes to the router.

---

## Data model

Defined in `convex/schema.ts` with a single app table and Convex Auth system tables:

- **Table**: `profiles`
  - `userId: Id<'users'>` (owner)
  - `username: string` (unique, indexed)
  - `name: string`
  - `title?: string`
  - `location?: string`
  - `bio?: string`
  - `email?: string`
  - `website?: string`
  - `github?: string`
  - `linkedin?: string`
  - `twitter?: string`
  - `experience: { id, role, company, startDate, endDate?, current, description? }[]`
  - `education: { id, degree, school, startDate, endDate?, current, description? }[]`
  - `skills: string[]`
  - `isPublic: boolean`
  - Indexes: `by_user (userId)`, `by_username (username)`

---

## Auth flow

- `SignInForm` calls `signIn('password', FormData)` or `signIn('anonymous')` via `@convex-dev/auth`.
- `SignOutButton` calls `signOut()`.
- Client state is exposed via `Authenticated`/`Unauthenticated` components and `useConvexAuth()`.

---

## Public profile (SSR)

- Route: `/@{username}` handled by Convex HTTP router in `convex/router.ts`.
- Behavior:
  - Fetches `profiles.getProfileByUsername`.
  - Returns 404 HTML if profile is missing or not public.
  - Returns server‑rendered HTML with Open Graph, Twitter, and JSON‑LD metadata when public.

---

## Local development

### Prerequisites

- Node.js 18+ recommended.

### Install and run

```bash
npm install
npm run dev
```

This starts Vite and Convex dev servers in parallel.

### Environment variables

- `VITE_CONVEX_URL`: Required by the frontend (`src/main.tsx`) to connect to the Convex deployment.
- `CONVEX_SITE_URL`: Used by Convex Auth config (`convex/auth.config.ts`).

When developing with the Convex CLI and Chef, these are typically populated automatically. If needed, create `.env.local` and set them explicitly.

---

## Build & lint

- `npm run build`: Vite production build.
- `npm run lint`: Type checks (app + Convex) and a one‑off Convex build, then Vite build.

---

## Notable files

- Frontend: `src/App.tsx`, `src/components/*`, `src/main.tsx`, `src/index.css`
- Backend: `convex/auth.ts`, `convex/profiles.ts`, `convex/router.ts`, `convex/http.ts`, `convex/schema.ts`
- Tooling: `vite.config.ts`, `tailwind.config.js`, `package.json`

---

## How to extend

- Add new fields to `convex/schema.ts`, then surface them in `profiles.updateProfile`/`createProfile` and the editor/preview components.
- For additional public pages or formats (e.g., PDF), add Convex HTTP routes in `convex/router.ts` and reuse `profiles.getProfileByUsername`.

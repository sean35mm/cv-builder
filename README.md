# OpenCV — Open Source CV Builder

A CV builder that publishes your profile at one address, `opencv.app/u/{username}`. Built with Next.js 16, React 19, Tailwind CSS 4, and Convex for data and auth.

> Note: Not related to the computer vision library “OpenCV”. This project’s short name is “Open CV”.

## Features

- Sign in with a one-time email code (Resend). Password sign-in remains for older accounts; password sign-up is disabled
- Claim a username on the landing page or during onboarding, with live availability checks
- One workspace: section editor, design panel, and a live preview that uses the same renderer as the public page
- Autosave with partial-validity saves: one invalid field never blocks the rest of an edit
- Three templates (Editorial, Rail, Ledger) and six palettes; retired template and palette IDs render as their closest match
- Profile access: Private, Passcode, Unlisted, or Public
- Managed media: one avatar plus up to three images per project, exhibition, or award (JPEG, PNG, WebP, GIF, or AVIF, 5 MiB each)
- Public profile with PDF download, share link and QR code, and consent-based analytics
- Drag-and-drop section ordering with `@dnd-kit`

The backend still includes features hidden in the core-loop redesign: versions, testimonials, contact messages, custom domains, locales, AI drafts, the directory, and analytics reports. Their old routes redirect (see `next.config.ts`).

## Theming

- Light, Dark, and System (default System), via `next-themes` with `class` on `<html>`
- App chrome uses its own tokens (`--background`, `--surface`, …) in `app/globals.css`
- Profiles use separate `--p-*` tokens in `app/profile.css`, scoped to `.profile-theme`, so app chrome never restyles a published profile
- Type: Geist and Geist Mono for the app, Newsreader for profiles and the landing page

## Tech Stack

- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix/shadcn primitives
- Forms/validation: `react-hook-form`, `zod`
- Drag & drop: `@dnd-kit/core`, `@dnd-kit/sortable`
- Backend: Convex (database, server functions, auth, HTTP router)
- Auth: `@convex-dev/auth` with Resend email OTP
- Tooling: TypeScript, ESLint, Prettier, Bun

## Routes

- `/`: landing page with username claim (signed-in users go to `/editor`)
- `/login`: email-code sign-in
- `/editor`: the workspace (onboarding first, if the account has no profile)
- `/@{username}` or `/u/{username}`: profile, subject to its access mode
- `/@{username}/{locale}` or `/u/{username}/{locale}`: localized profile with default-locale fallback
- `/embed/{username}`: script-free embed when the profile allows it
- `/api/export?username={username}&format=txt|json|docx`: access-aware export
- `/privacy`, `/terms`

## Architecture

### App flow

- Signed out: landing page, then `/login`
- Signed in without a profile: onboarding (username, name, headline)
- Signed in with a profile: the workspace in `components/workspace`

### Routing & SSR

- Next.js SSR page: `app/u/[username]/page.tsx` renders public, unlisted, and authorized passcode profiles dynamically with private/no-store responses; `proxy.ts` rewrites `/@{username}` → `/u/{username}`
- Convex HTTP route: `convex/router.ts` also serves `/@{username}` directly with HTML + metadata (alternative backend‑hosted SSR)
- Auth routes and session handling remain in Convex Auth; auth routes are added to the Convex HTTP router in `convex/http.ts`

### Data/Functions

- Schema: `convex/schema.ts` (profiles table + Convex Auth tables)
- Queries/Mutations: `convex/profiles.ts` with strict validators and owner checks
- Passcode boundary: same-origin Next route handlers normalize and HMAC passcodes, then call secret-authenticated Convex HTTP actions; Argon2id runs only in a Node action, and Convex stores only encoded hashes and SHA-256 grant-token hashes
- Custom-domain boundary: `proxy.ts` accepts only exact configured platform authorities or a restricted customer-host path set; the dedicated `app/host-profile` route and each allowed API independently resolve an active hostname through Convex without a positive cache
- Auth: `convex/auth.ts` configures retained Convex Auth with Resend OTP first and password fallback only for existing-account sign-in; it exposes `auth.loggedInUser`

## Data Model

Defined in `convex/schema.ts` with indexes for efficient lookups.

Table: `profiles`

- Ownership: `userId: Id<'users'>`
- Identity: `username: string` (indexed, unique by logic)
- Basics: `name`, `avatar?`, `title?`, `location?`, `bio?`
- Contact: `email?`, `website?`, `github?`, `linkedin?`, `twitter?`
- Arrays:
  - `experience[]`: `{ id, role, company, startDate, endDate?, current, description? }`
  - `education[]`: `{ id, degree, school, startDate, endDate?, current, description? }`
  - `skills[]: string[]`
  - `languages[]`: `{ id, name, proficiency? }`
  - `projects[]`: `{ id, title, year, company?, link?, description?, images? }`
  - `publications[]`: `{ id, title, publisher?, date?, url?, authors?, description? }`
  - `certifications[]`: `{ id, name, issuer, year?, credentialId?, link?, description? }`
  - `volunteering[]`: `{ id, role, organization, startDate, endDate?, current, description? }`
  - `exhibitions[]`: `{ id, title, venue?, year, location?, link?, description?, images? }`
  - `awards[]`: `{ id, title, issuer, year, link?, description?, images? }`
  - `interests[]: string[]`
- Presentation: `sectionsOrder?: string[]`, optional authoritative `accessMode`/`accessVersion`, and compatibility `isPublic`/`isDirectoryListed` projections
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
- Normalization: trims values; coerces blank optionals to `undefined` before saving; deduplicates skills, languages, publication authors, and interests case-insensitively
- Media: new avatar, exhibition, and award images must be managed uploads; temporary preview tokens are removed on save, section visibility controls visitor access, and PDF/directory output remains image-free
- Section order: `sectionsOrder` is persisted; unknown IDs are ignored; editor guards against duplicates
- Profile access control: Private disables visitor access; Passcode requires an 8-hour HttpOnly browser grant and remains non-discoverable; Unlisted enables the link without directory listing or indexing; Public enables the link, directory listing, and indexing. Passcode access cannot prevent authorized recipients from resharing, downloading, screenshots, or capture, and testimonial recommendation links remain independent capability links.

### LinkedIn export file contract

The local importer recognizes these exact CSV base names, case-insensitively, in
a LinkedIn ZIP or as individual files. Other files are ignored and summarized.
Localized or unknown headers are warned about rather than guessed.

- `Positions.csv`: `Title`/`Position`, `Company Name`/`Company`, `Started On`/`Start Date`, `Finished On`/`End Date`, `Description`
- `Education.csv`: `Degree Name`/`Degree`, `School Name`/`School`, `Start Date`/`Started On`, `End Date`/`Finished On`, `Notes`/`Description`
- `Skills.csv`: `Name`/`Skill`
- `Certifications.csv`: `Name`, `Authority`/`Issuing Organization`/`Issuer`, `Started On`/`Issue Date`, `License Number`/`Credential ID`, `Url`/`URL`
- `Projects.csv`: `Title`/`Name`, `Started On`/`Start Date`/`Year`, `Description`, `Url`/`URL`
- `Languages.csv`: `Name`/`Language`, `Proficiency`
- `Publications.csv`: `Name`/`Title`, `Publisher`, `Published On`/`Publication Date`/`Date`, `Url`/`URL`, `Authors`, `Description`/`Summary`

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
- `check`: tests, typechecks/lints, and builds
- `test`: runs the Bun test suite
- `start`: `next start`
- `lint`: typechecks Convex + app and lints

## Release Preparation

The `release:check` and `release:prepare` commands only validate and prepare a
version change. They never stage, commit, tag, push, create a GitHub release, or
deploy.

```bash
# Validate a clean main branch without changing files
bun run release:check

# After the checks pass, update package.json and refresh bun.lock
bun run release:prepare patch # or minor, major, or an explicit x.y.z
```

Review the resulting `package.json` and `bun.lock` changes, then perform any
approved git and GitHub release steps manually.

## Environment Variables

- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL; defaults to `http://localhost:3210` in `app/ConvexClientProvider.tsx`
- `CONVEX_SITE_URL`: Convex HTTP Actions auth issuer (for example, `https://your-deployment.convex.site`)
- `PROFILE_PASSCODE_PEPPER`: server-only Next.js pepper used to HMAC normalized passcodes before the Convex boundary
- `PROFILE_ACCESS_SERVICE_SECRET`: shared server-only Next.js/Convex service-boundary secret; never expose it through a `NEXT_PUBLIC_*` variable. It remains a broad service credential, so restrict access to the two server runtimes, rotate it on a defined schedule and after suspected exposure, and treat per-operation credentials as a future least-privilege hardening option.
- `NEXT_PUBLIC_SITE_URL`: Public Next.js app origin used for canonical/OG/Twitter URLs
- `CUSTOM_DOMAINS_ENABLED`: server-only feature flag; must be exactly `true` to enable and defaults to `false`
- `VERCEL_API_TOKEN`: server-only Vercel API token; never expose it through a `NEXT_PUBLIC_*` variable
- `VERCEL_PROJECT_ID`: server-only Vercel project identifier used by versioned Projects Domains endpoints
- `VERCEL_TEAM_ID`: optional server-only Vercel team identifier
- `PLATFORM_HOSTS`: comma-separated exact trusted app authorities/aliases; wildcards and implicit `*.vercel.app` trust are not supported
- `NEXT_PUBLIC_AI_WRITING_ENABLED`: public UI feature flag; exactly `true` enables controls and defaults to `false`
- `AI_WRITING_ENABLED`: server-only AI adapter feature flag; exactly `true` enables and defaults to `false`
- `OPENAI_API_KEY`: server-only provider credential required only when AI writing is enabled
- `OPENAI_MODEL`: required explicit provider model when AI writing is enabled; no model is hardcoded
- `ANALYTICS_DIGEST_ENABLED`: server-only weekly digest feature flag; exactly `true` enables and defaults to `false`

Create `.env.local` in the project root for Next variables, and configure Convex env via the Convex dashboard/CLI for production.

## Deployment

Frontend: Vercel (see `vercel.json`)

- Build command: `bun run build` (or `npm run build`)

Backend: Convex Cloud

- Deploy Convex functions/schema: `npx convex deploy`
- Set `NEXT_PUBLIC_CONVEX_URL` in Vercel to your Convex prod URL
- Set `CONVEX_SITE_URL` to the deployment's `https://*.convex.site` HTTP Actions URL
- Set `NEXT_PUBLIC_SITE_URL` to the public Next.js app URL (for example, the Vercel custom domain)
- Before enabling custom domains, configure the same feature flag and trusted-host contract in the Next.js and Convex server environments, configure Vercel credentials only server-side, deploy the schema/functions and frontend, then verify provider/DNS behavior in a non-production environment. Vercel manages certificates; the application does not handle certificate material.

Public Profiles

- Vercel serves `/@{username}` via `proxy.ts` → `app/u/[username]`
- Alternatively serve directly from Convex HTTP `/@{username}`

## Security

- Ownership checks: mutations derive `userId` from server context (`getAuthUserId`); only owners can write
- Public access: public queries require an effective public state, including a valid owned default version when one is selected
- HTML escaping: Convex HTML renderer escapes user content in `convex/router.ts`

## Project Structure

- `app/`: Next.js routes, layout, providers
- `components/`: UI, editor sections, landing, public view
- `convex/`: schema, auth, queries/mutations, HTTP router
- `lib/`: shared types/utilities

## Contributing

Issues and PRs are welcome. Please include a clear rationale and concise changeset. Keep changes minimal and consistent with existing patterns. Type first, validate at boundaries, and avoid unnecessary abstractions.

## License

MIT.

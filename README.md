# OpenCV

OpenCV is a free, open source CV website. You write your CV once, pick a template and a palette, and publish it at one link, `opencv.app/u/{username}`. You choose who can see it: only you, anyone with a passcode, anyone with the link, or everyone. It is built with Next.js 16, React 19, Tailwind CSS 4, and Convex, and you can run your own copy.

> Note: not related to the computer vision library OpenCV. The short name here is "Open CV".

Hosted version: [opencv.app](https://opencv.app)

## Features

- **Sign in with an email code.** One-time codes are sent through Resend. Password sign-in remains for older accounts; password sign-up is disabled.
- **Claim a username** on the landing page or during onboarding, with a live availability check. Usernames are 3 to 30 lowercase letters, numbers, underscores, or hyphens.
- **One workspace.** A section editor, a design panel, and a live preview that uses the same renderer as the public page. Drag sections to reorder them.
- **Autosave.** An invalid field never blocks the rest of an edit from saving.
- **Three templates** (Editorial, Rail, Ledger) and **six palettes** (Slate, Sand, Sage, Olive, Ocean, Rose), each with a light and a dark mode. Every palette works with every template.
- **Four access modes.** Private, Passcode, Unlisted, or Public. Only Public profiles are listed and indexed.
- **Share.** Copy the link, download a QR code, or download a PDF of the profile.
- **LinkedIn import.** Upload your LinkedIn data export (ZIP or CSV files), review what was found, and merge it into your profile. Parsing happens in the browser.
- **Consent-based analytics.** Visitors are counted only if they agree. The workspace shows views for the last 7 days.
- **Images.** One avatar, plus up to three images per project, exhibition, or award (JPEG, PNG, WebP, GIF, or AVIF, 5 MiB each).

The backend also contains features that are hidden in the current UI: versions, testimonials, contact messages, custom domains, locales, AI drafts, the directory, and analytics reports. Their old routes redirect (see `next.config.ts`).

## Self-hosting

You need three things: a [Convex](https://convex.dev) project (database, functions, auth), a [Resend](https://resend.com) account (sign-in codes), and somewhere to run the Next.js app. `vercel.json` is included for Vercel, but any host that runs `next start` works.

Prerequisites: Node.js 20.9 or newer and [Bun](https://bun.sh) 1.3.9 (the repo's `packageManager`). npm and pnpm can also work but are untested here.

1. Clone the repo and install dependencies.

   ```bash
   git clone https://github.com/sean35mm/cv-builder.git
   cd cv-builder
   bun install
   ```

2. Copy `.env.example` to `.env.local`.

3. Create your Convex project. This is your own deployment, separate from opencv.app. It writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local` and pushes `convex/` to a dev deployment.

   ```bash
   bunx convex dev
   ```

4. Set up Convex Auth keys. This sets the signing keys and site URL variables that `@convex-dev/auth` needs on your Convex deployment.

   ```bash
   npx @convex-dev/auth
   ```

5. Set the Convex environment variables, in the Convex dashboard (Settings, Environment Variables) or with `bunx convex env set`:

   | Variable                        | Notes                                                                                                                                                                                     |
   | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `AUTH_RESEND_KEY`               | Resend API key. Sign-in codes are not sent without it.                                                                                                                                    |
   | `AUTH_EMAIL`                    | Optional sender, for example `OpenCV <noreply@yourdomain.com>`. Defaults to `onboarding@resend.dev`, Resend's test sender. To email other people, verify a domain in Resend and set this. |
   | `PROFILE_ACCESS_SERVICE_SECRET` | Long random string. Must be identical in Convex and in the Next.js server environment.                                                                                                    |
   | `CONVEX_SITE_URL`               | Provided by Convex. It is your deployment's `https://*.convex.site` URL, the auth issuer.                                                                                                 |

6. Set the Next.js environment variables in `.env.local`, or in your host's settings:

   | Variable                        | Notes                                                                                                                        |
   | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_CONVEX_URL`        | Your Convex deployment URL. Defaults to `http://localhost:3210` in `app/ConvexClientProvider.tsx`.                           |
   | `CONVEX_SITE_URL`               | Your deployment's `https://*.convex.site` URL.                                                                               |
   | `NEXT_PUBLIC_SITE_URL`          | The public origin of the app, for canonical, Open Graph, and sitemap URLs.                                                   |
   | `PROFILE_ACCESS_SERVICE_SECRET` | Same value as in Convex. Server-only; never expose it through a `NEXT_PUBLIC_*` variable.                                    |
   | `PROFILE_PASSCODE_PEPPER`       | Long random string used to HMAC passcodes before they reach Convex. Server-only; Next.js only.                               |
   | `PLATFORM_HOSTS`                | Comma-separated exact hosts the app is served from. The `NEXT_PUBLIC_SITE_URL` host is included automatically. No wildcards. |

7. Run it.

   ```bash
   bun run dev:frontend   # Next.js on http://localhost:3000
   ```

   `bun run dev` runs `next dev` and `convex dev` together. Run `convex dev` only against your own project.

8. For production, deploy the Convex functions, then build and host the app.

   ```bash
   bunx convex deploy
   bun run build
   bun run start
   ```

   Set the same variables on the production Convex deployment and in your host, with `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_SITE_URL` pointing at the production deployment. On Vercel, the build command is `bun run build` (see `vercel.json`).

Optional variables, all documented in `.env.example`:

- `SUPPORT_EMAIL`: shown as the contact address on the privacy page.
- `PDF_TRUSTED_IP_HEADER`: a client IP header your proxy overwrites, used for PDF rate limiting off Vercel, Fly.io, and Cloudflare Pages.
- `CUSTOM_DOMAINS_ENABLED`, `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`: Vercel-managed custom domains (hidden in the UI, off by default; set the flag and `PLATFORM_HOSTS` in both Next.js and Convex).
- `NEXT_PUBLIC_AI_WRITING_ENABLED`, `AI_WRITING_ENABLED`, `OPENAI_API_KEY`, `OPENAI_MODEL`: AI drafts (hidden in the UI, off by default; both flags must be exactly `true`).
- `ANALYTICS_DIGEST_ENABLED`: weekly aggregate analytics email (off by default; needs `AUTH_RESEND_KEY` and a verified `AUTH_EMAIL`).

## Theming

- Light, Dark, and System (default System), via `next-themes` with `class` on `<html>`
- App chrome uses its own tokens (`--background`, `--surface`, …) in `app/globals.css`
- Profiles use separate `--p-*` tokens in `app/profile.css`, scoped to `.profile-theme`, so app chrome never restyles a published profile
- Type: Geist and Geist Mono for the app, Newsreader for profiles and the landing page

## Tech Stack

- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix/shadcn primitives
- Forms/validation: `react-hook-form`, `zod`
- Drag & drop: `@dnd-kit/core`, `@dnd-kit/sortable`
- Backend: Convex (database, server functions, auth, HTTP router, rate limiting)
- Auth: `@convex-dev/auth` with Resend email OTP
- Tooling: TypeScript, ESLint, Prettier, Bun

## Routes

- `/`: landing page with username claim (signed-in users go to `/editor`)
- `/read-cv-alternative`: page for former read.cv users
- `/login`: email-code sign-in
- `/editor`: the workspace (onboarding first, if the account has no profile)
- `/@{username}` or `/u/{username}`: profile, subject to its access mode (`proxy.ts` rewrites `/@{username}` to `/u/{username}`)
- `/@{username}/{locale}` or `/u/{username}/{locale}`: localized profile with default-locale fallback
- `/embed/{username}`: script-free embed when the profile allows it
- `/api/pdf?username={username}`: PDF download
- `/api/export?username={username}&format=txt|json|docx`: access-aware export
- `/api/profile-share/qr` and `/api/profile-share/og`: QR code and share image
- `/privacy`, `/terms`

## Architecture

### App flow

- Signed out: landing page, then `/login`
- Signed in without a profile: onboarding (username, name, headline)
- Signed in with a profile: the workspace in `components/workspace`

### Routing & SSR

- `app/u/[username]/page.tsx` renders public, unlisted, and authorized passcode profiles dynamically with private/no-store responses
- Profiles render only through `components/profile/profile-document.tsx`; the three offered templates live in `components/templates`
- Auth routes and session handling remain in Convex Auth; HTTP routes, including the profile-access endpoints, are in `convex/http.ts`

### Data/Functions

- Schema: `convex/schema.ts` (profiles and related tables, plus Convex Auth tables)
- Queries/Mutations: `convex/profiles.ts` with strict validators and owner checks
- Passcode boundary: same-origin Next route handlers normalize and HMAC passcodes, then call secret-authenticated Convex HTTP actions; Argon2id runs only in a Node action, and Convex stores only encoded hashes and SHA-256 grant-token hashes
- Custom-domain boundary: `proxy.ts` accepts only exact configured platform authorities or a restricted customer-host path set; the dedicated `app/host-profile` route and each allowed API independently resolve an active hostname through Convex without a positive cache
- Auth: `convex/auth.ts` configures Convex Auth with Resend OTP first and password fallback only for existing-account sign-in; it exposes `auth.loggedInUser`

## Data Model

Defined in `convex/schema.ts` with indexes for efficient lookups.

Table: `profiles`

- Ownership: `userId: Id<'users'>`
- Identity: `username: string` (indexed, unique by logic)
- Basics: `name`, `avatar?`, `title?`, `industry?`, `location?`, `bio?`
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
- Presentation: `templateId?`, `colorTheme?`, `headingFont?`, `bodyFont?`, `sectionsOrder?: string[]`, optional authoritative `accessMode`/`accessVersion`, and compatibility `isPublic`/`isDirectoryListed` projections
- Indexes: `by_user(userId)`, `by_username(username)`

## Public API (Convex)

Queries

- `auth.loggedInUser()`: current user or `null`
- `profiles.getMyProfile()`: current user's profile or `null`
- `profiles.getProfileByUsername({ username })`: public profile or `null`
- `profiles.checkUsernameAvailable({ username })`: `true` if unused

Mutations

- `profiles.createProfile({...})`: one profile per user; enforces unique `username`; starts as `private`
- `profiles.updateProfile({...})`: updates the profile; enforces ownership
- `profiles.updateTemplate`, `profiles.updateColorTheme`, `profiles.updateTypography`: design settings

HTTP (`convex/http.ts`): the `/profile-access/*` endpoints used by the Next.js route handlers for passcodes, PDF authorization, storage, uploads, contact, and analytics events. They require the shared service secret.

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

See [Self-hosting](#self-hosting) for the environment variables and your own Convex project.

Scripts

- `dev`: `next dev` and `convex dev` in parallel (needs a Convex project in `.env.local`)
- `dev:frontend`: `next dev` only
- `dev:backend`: `convex dev` only
- `build`: `next build`
- `start`: `next start`
- `test`: runs the Bun test suite
- `lint`: typechecks Convex and the app, then runs ESLint
- `check`: tests, lint, and build

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

## Security

- Ownership checks: mutations derive `userId` from server context (`getAuthUserId`); only owners can write
- Public access: public queries require an effective public state, including a valid owned default version when one is selected
- Profile content is rendered through React, which escapes it; the only raw HTML is JSON-LD, serialized by `serializeJsonLd` in `lib/profile/structured-data.ts`

## Project Structure

- `app/`: Next.js routes, layout, providers
- `components/`: UI, workspace and editor sections, templates, landing, public view
- `convex/`: schema, auth, queries/mutations, HTTP router
- `lib/`: shared types and utilities (templates, palettes, import, PDF, access rules)
- `tests/`: Bun test suite

## Contributing

Issues and PRs are welcome. Please include a clear rationale and concise changeset. Keep changes minimal and consistent with existing patterns. Type first, validate at boundaries, and avoid unnecessary abstractions.

## License

MIT.

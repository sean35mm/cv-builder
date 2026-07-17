# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-27

### Added

- Initial beta release of OpenCV
- User authentication with email/password (Convex Auth)
- Create and customize professional CV profiles
- Choose from 12 beautiful color themes (sage, ocean, rose, amber, slate, sand, cocoa, peach, forest, olive, teal, mauve)
- Public profile hosting with custom usernames
- PDF export functionality
- Basic analytics dashboard
- Testimonials and recommendations system
- Dark/light mode support
- Drag-and-drop section reordering
- Contact form integration
- Version history management

### Technical

- Next.js 16 with React 19
- TypeScript with strict checking
- Convex backend for real-time data
- Tailwind CSS v4 for styling
- shadcn/ui component library
- Zod for schema validation
- React Hook Form for forms
- React DnD for drag-and-drop
- @react-pdf/renderer for PDF generation

## Historical Development Timeline

This project evolved from a simple resume builder to a comprehensive CV platform. Key development phases:

### Phase 1: Foundation (August 2025)

- Initial project setup with Next.js and TypeScript
- Migration from Vite to Next.js for better SSR capabilities
- Basic layout and theming system

### Phase 2: Core Features (September-October 2025)

- Integration with Convex for backend
- Drag-and-drop section management
- Real-time profile editing
- Public profile views

### Phase 3: Design & Polish (October 2025)

- Major UI redesign with refined aesthetics
- Theme system implementation
- Landing page development
- Legal pages (Terms, Privacy)

### Phase 4: Advanced Features (November 2025 - March 2026)

- Analytics tracking
- Contact forms
- Testimonials system
- Version history
- Template selection
- Client-only LinkedIn export import from user-selected ZIP/CSV files

### Phase 5: Open Source (March 2026)

- Made repository public
- Added comprehensive documentation
- Implemented GitHub-based changelog and versioning
- Marketing and social media integration

## [Unreleased]

### Local development (not released)

- Client-only LinkedIn export import with explicit review and append/dedupe merge
- Languages, Publications, and Interests profile sections
- Dynamic profile share images, QR downloads, sitemap entries, and JSON-LD
- Enhanced template system
- More color themes
- Advanced analytics
- Disabled-by-default AI section and cover-letter drafts with explicit review
- Access-aware plain text, JSON, and DOCX ATS exports
- Script-free profile embeds with unlisted owner opt-in
- Consent-based UTM, coarse device, trusted-country analytics with 90-day retention and disabled-by-default weekly digests
- Up to five manual BCP-47 profile locales with translation overlays and fallback
- Working Folio visual system with fixed warm editorial platform tokens, scoped profile palettes and typography, ruled workspace ledgers, and a restrained editorial landing page
- Responsive editor rows and workspace controls with square geometry, visible focus treatment, 44px targets, and reduced-motion foundations
- Refined directory, protected-profile, public action, loading, authentication, analytics, inbox, testimonial, theme, template, and domain presentation without changing their feature or security contracts

## How to Release

The supported release commands validate a clean `main` branch and never perform
git, GitHub, or deployment mutations automatically:

```bash
bun run release:check
bun run release:prepare patch # or minor, major, or an explicit x.y.z
```

The prepare command runs the same checks, then updates `package.json` and
refreshes `bun.lock`. Review those files and perform any approved commit, tag,
push, GitHub release, and deployment steps manually.

The changelog page at `/changelog` will automatically fetch and display releases from the GitHub API.

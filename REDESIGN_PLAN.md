# OpenCV Product-First Platform Redesign

**Status:** Broad redesign implemented in the current workspace; automated verification and manual visual QA remain checkpoints.  
**Scope:** Intentional platform-wide visual and interaction redesign. Backend behavior and data contracts are unchanged.

## Intent and implemented scope

OpenCV is presented as a product for independent professionals to claim a public address, build a structured profile, choose its presentation, control access, and publish. The implementation favors operational hierarchy, editorial composition, token-based color, accessible controls, and light/dark parity over decorative dashboard patterns.

The redesign intentionally spans:

- the landing page, authentication entry points, and supporting public/legal pages;
- authenticated workspace chrome and the Home, Profile, Appearance, Publish, and Activity workflows;
- the public directory and authenticated Explore state;
- profile editing, public profile presentation, and the five real template views;
- shared controls, motion primitives, spacing, typography, and responsive behavior.

This is not a landing-only patch. The current broad workspace and template changes are the source of truth.

## Product contracts

- The landing hero keeps username claim in the initial desktop viewport and demonstrates the real five templates and twelve profile palettes.
- Workspace navigation keeps Home, Profile, Appearance, Publish, Activity, and Explore. Mobile and desktop chrome use the same information architecture.
- Home prioritizes the next action, readiness based on meaningful user work, and recent activity.
- Appearance places template, palette, and typography controls beside a live preview. Defaults provide a valid rendering but do not by themselves prove the user completed appearance setup.
- Publish prioritizes profile address, access mode, and sharing/export actions.
- The directory remains public without authenticated chrome and uses workspace chrome for authenticated visitors without duplicate branding.
- Shared controls preserve visible focus, 44px targets, reduced-motion behavior, and property-specific transitions; `transition-all` remains prohibited.

## Frozen behavior

- Username normalization, validation, query gating, session storage, callback behavior, and the 15-character limit remain unchanged.
- All twelve profile themes and five stable template IDs remain available.
- Legacy `/theme` and `/templates` routes continue to redirect to `/appearance`.
- Profile data flow, authentication, access controls, exports, analytics consent, and Convex schema/API behavior are not redesigned.
- No dependency or migration changes are required.

## Acceptance and verification

Automated acceptance requires formatting, type/lint checks, the design-system contract test, and focused profile-editor routing coverage to pass. Checks must validate behavior without reducing the redesign to exact marketing copy or brittle utility-class snapshots.

Manual QA is still required and must not be inferred from automated checks. Confirm:

- desktop and mobile hierarchy across landing, workspace, editor, appearance, publish, activity, and directory;
- anonymous versus authenticated directory chrome;
- keyboard focus, template/palette previews, pause/resume, and reduced motion;
- light and dark mode parity; and
- public profile rendering for all templates and representative palettes.

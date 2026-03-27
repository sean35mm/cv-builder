#!/bin/bash

# Retroactive Release Script for OpenCV
# Creates 6 GitHub Releases based on historical deployment periods
# Run this ONCE to backfill releases from the main branch history

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Creating retroactive GitHub Releases for OpenCV${NC}"
echo -e "${YELLOW}This will create 6 releases matching your deployment history${NC}"
echo ""

# Ensure we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Must be on main branch${NC}"
    exit 1
fi

# Pull latest
echo -e "${YELLOW}Pulling latest changes...${NC}"
git pull origin main

echo -e "${GREEN}✓ Ready to create releases${NC}"
echo ""

# Release 1: v0.1.0 - Initial Build (Aug 29 - Sep 23, 2025)
echo -e "${BLUE}📦 Release 1/6: v0.1.0 - Initial Build${NC}"
if ! git tag -l | grep -q "^v0.1.0$"; then
    git tag -a "v0.1.0" 7b4951d -m "v0.1.0 - Initial Build\n\nThe foundation of OpenCV."
    echo -e "${GREEN}  ✓ Created tag v0.1.0${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.1.0 already exists${NC}"
fi

# Release 2: v0.2.0 - Landing Page & Editor Overhaul (Sep 23 - Oct 16, 2025)
echo -e "${BLUE}📦 Release 2/6: v0.2.0 - Landing Page & Editor Overhaul${NC}"
if ! git tag -l | grep -q "^v0.2.0$"; then
    git tag -a "v0.2.0" d46fa89 -m "v0.2.0 - Landing Page & Editor Overhaul\n\nFirst production-ready landing page with full marketing site."
    echo -e "${GREEN}  ✓ Created tag v0.2.0${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.2.0 already exists${NC}"
fi

# Release 3: v0.3.0 - Themes & OSS (Oct 16 - Oct 24, 2025)
echo -e "${BLUE}📦 Release 3/6: v0.3.0 - Themes & OSS${NC}"
if ! git tag -l | grep -q "^v0.3.0$"; then
    git tag -a "v0.3.0" a8b1813 -m "v0.3.0 - Themes & Open Source\n\nOpen sourced with beautiful color themes and dark mode."
    echo -e "${GREEN}  ✓ Created tag v0.3.0${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.3.0 already exists${NC}"
fi

# Release 4: v0.3.1 - Legal & Config (Oct 24 - Nov 5, 2025)
echo -e "${BLUE}📦 Release 4/6: v0.3.1 - Legal & Config${NC}"
if ! git tag -l | grep -q "^v0.3.1$"; then
    git tag -a "v0.3.1" e226a01 -m "v0.3.1 - Legal Pages & Config\n\nAdded Privacy Policy, Terms of Service, and footer links."
    echo -e "${GREEN}  ✓ Created tag v0.3.1${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.3.1 already exists${NC}"
fi

# Release 5: v0.3.2 - Security Patch (Nov 5 - Dec 15, 2025)
echo -e "${BLUE}📦 Release 5/6: v0.3.2 - Security Patch${NC}"
if ! git tag -l | grep -q "^v0.3.2$"; then
    git tag -a "v0.3.2" d0fa93e -m "v0.3.2 - Security Patch\n\nCritical security fix for React Server Components CVE vulnerabilities."
    echo -e "${GREEN}  ✓ Created tag v0.3.2${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.3.2 already exists${NC}"
fi

# Release 6: v0.4.0 - Feature Sprint (Dec 15, 2025 - Mar 23, 2026)
echo -e "${BLUE}📦 Release 6/6: v0.4.0 - Feature Sprint${NC}"
if ! git tag -l | grep -q "^v0.4.0$"; then
    git tag -a "v0.4.0" 545f2dc -m "v0.4.0 - Major Feature Sprint\n\nPDF export, analytics, templates, testimonials, and messaging system."
    echo -e "${GREEN}  ✓ Created tag v0.4.0${NC}"
else
    echo -e "${YELLOW}  ⚠ Tag v0.4.0 already exists${NC}"
fi

echo ""
echo -e "${YELLOW}Pushing all tags to GitHub...${NC}"
git push origin --tags

echo ""
echo -e "${GREEN}✅ All tags created and pushed!${NC}"
echo ""

# Now create GitHub Releases
echo -e "${BLUE}Creating GitHub Releases with detailed notes...${NC}"
echo ""

# Release 1: v0.1.0
echo -e "${YELLOW}Creating v0.1.0 release...${NC}"
gh release create "v0.1.0" \
    --title "v0.1.0 - Initial Build" \
    --notes-file - <<'EOF'
## 🚀 Initial Build

**Released:** September 23, 2025

The foundation of OpenCV — a full-stack CV builder with real-time editing and public profile hosting.

### Added
- Project scaffolded with Next.js, TypeScript, and Tailwind CSS v4
- Convex backend for real-time data synchronization
- Authentication system with email/password (Convex Auth)
- Profile editor with drag-and-drop section reordering (@dnd-kit)
- Section support: experience, education, skills, projects, certifications, volunteering, exhibitions, awards
- Public profile view with clean URL structure (`/:username`)
- shadcn/ui component library integration
- Bun for package management and Vercel deployment
- Initial dark/light mode support

### Technical
- Migration from Vite to Next.js for SSR capabilities
- Component-based section architecture
- Type-safe database schema with Convex
- Responsive layout foundation
EOF
echo -e "${GREEN}✓ v0.1.0 created${NC}"

# Release 2: v0.2.0
echo -e "${YELLOW}Creating v0.2.0 release...${NC}"
gh release create "v0.2.0" \
    --title "v0.2.0 - Landing Page & Editor Overhaul" \
    --notes-file - <<'EOF'
## 🎨 Landing Page & Editor Overhaul

**Released:** October 16, 2025

First production-ready landing page with a complete marketing site and dramatically improved editor UX.

### Added
- Full landing page with hero, features, FAQ, gallery, workflow, and closing CTA
- Username claim flow on landing page
- Complete section editors for all profile sections:
  - Experience (company, title, dates, description)
  - Education (institution, degree, dates)
  - Projects (title, link, description, technologies)
  - Skills (categories and tags)
  - Awards, Certifications, Exhibitions, Volunteering
- React Hook Form + Zod validation for all forms
- Month/year input components with proper formatting
- Prettier configuration and enforced formatting
- Type system overhaul with shared types in `lib/types.ts`
- Profile preview component for real-time preview
- Editor save button and auto-save functionality

### Improved
- Split monolithic editor into per-section components
- Better form validation with descriptive error messages
- Enhanced UX with loading states and feedback
- Refactored public profile view for cleaner rendering

### Technical
- Migrated to RHF + Zod for all forms
- Added proper TypeScript strict checking
- Established component naming conventions (kebab-case files)
EOF
echo -e "${GREEN}✓ v0.2.0 created${NC}"

# Release 3: v0.3.0
echo -e "${YELLOW}Creating v0.3.0 release...${NC}"
gh release create "v0.3.0" \
    --title "v0.3.0 - Themes & Open Source" \
    --notes-file - <<'EOF'
## 🎨 Themes & Open Source

**Released:** October 24, 2025

Open sourced with a beautiful theme system and dark mode support. First community contributions merged.

### Added
- **12 Color Themes:** sage, ocean, rose, amber, slate, sand, cocoa, peach, forest, olive, teal, mauve
- Theme selector page (`/theme`) with live preview
- Section registry pattern for clean profile rendering
- AppShell component for consistent layout management
- ThemeProvider and ThemeToggle components
- MIT License
- `.env.example` with required environment variables
- Comprehensive README with setup instructions
- GitHub repository made public

### Technical
- Theme system using Tailwind CSS variables
- Profile section registry for dynamic rendering
- Refactored sidebar for theme-aware navigation
- First pull requests merged (#1 hero improvements, #2 themes feature)

### Open Source
- Added LICENSE, README, .env.example
- Made repository public
- Established contribution guidelines
EOF
echo -e "${GREEN}✓ v0.3.0 created${NC}"

# Release 4: v0.3.1
echo -e "${YELLOW}Creating v0.3.1 release...${NC}"
gh release create "v0.3.1" \
    --title "v0.3.1 - Legal Pages & Config" \
    --notes-file - <<'EOF'
## 📄 Legal Pages & Config

**Released:** November 5, 2025

Added required legal pages and improved deployment configuration.

### Added
- **Privacy Policy page** (`/privacy`) with full privacy terms
- **Terms of Service page** (`/terms`) with usage terms
- Footer component with legal links and social media
- Updated footer with Terms and Privacy links
- Vercel configuration for production deployment

### Fixed
- Vercel proxy configuration for API routes
- Build configuration optimizations
- App branding name updated

### Changed
- Footer redesigned with legal links
- Social links added (Twitter/X, GitHub, LinkedIn)
EOF
echo -e "${GREEN}✓ v0.3.1 created${NC}"

# Release 5: v0.3.2
echo -e "${YELLOW}Creating v0.3.2 release...${NC}"
gh release create "v0.3.2" \
    --title "v0.3.2 - Security Patch" \
    --notes-file - <<'EOF'
## 🔒 Security Patch

**Released:** December 15, 2025

Critical security update addressing React Server Components CVE vulnerabilities.

### Security
- **React 19.0.0** → patched version for CVE vulnerabilities
- **Next.js 16.0.10** → updated for security fixes
- Fixed React Server Components vulnerability ([CVE-2024-XXXX](https://vercel.com/changelog/react-server-components-cve-fix))

### Added
- AGENTS.md for AI-assisted development guidelines
- Updated TypeScript configuration

### Technical
- Dependency updates via automated Vercel security patch
- Pull request #3 merged from Vercel security automation
- All security patches applied automatically

**Recommended Action:** All users should update to this version immediately.
EOF
echo -e "${GREEN}✓ v0.3.2 created${NC}"

# Release 6: v0.4.0
echo -e "${YELLOW}Creating v0.4.0 release...${NC}"
gh release create "v0.4.0" \
    --title "v0.4.0 - Major Feature Sprint" \
    --notes-file - <<'EOF'
## ✨ Major Feature Sprint

**Released:** March 23, 2026

The biggest feature release since launch. PDF export, analytics, templates, testimonials, and a complete landing page redesign.

### Added
- **PDF Resume Export** — Generate beautiful PDFs with @react-pdf/renderer
  - Theme-aware color schemes in PDFs
  - Professional layout matching web profile
  - Download button in public profiles
- **Analytics Dashboard** — Track profile views and engagement
  - View counts per profile
  - Date range filtering
  - Analytics tracker component
- **Resume Templates** — Multiple layout options
  - Classic template (traditional layout)
  - Modern template (contemporary design)
  - Minimal template (clean & simple)
  - Template selector UI
- **Testimonials System** — Collect recommendations
  - Generate recommendation links
  - Shareable testimonial request URLs
  - Manage testimonials in dashboard
  - Display on public profiles
- **Contact Form** — Let visitors reach out
  - Contact form component with validation
  - Message inbox (`/inbox`) for received messages
  - Email notifications
- **Version Management** — Profile history
  - Save profile versions
  - Restore previous versions
  - Version diff viewing
- **Messaging System** — Direct communication
  - Receive messages from profile visitors
  - Inbox management interface
  - Message read status

### Redesigned
- **Landing Page** — Cleaner, focused design
  - Removed: FAQ, Gallery, Workflow sections
  - Added: How It Works section with clearer steps
  - New reveal and stagger animations
  - Better feature explanations

### Improved
- **Public Profile View** — Better template integration
- **Project Section** — Enhanced with technology tags and links
- **UI Cleanup** — Removed 30+ unused shadcn components
- **Profile Editor** — Better organization and UX

### Technical
- Removed legacy Convex router (migrated to direct queries)
- Added resume upload scaffolding (for future AI parsing)
- API routes for PDF generation and file storage
- Updated Convex schema for testimonials and messages
- Removed unused dependencies (~50MB reduction)

### API Changes
- New endpoints: `/api/pdf`, `/api/storage/[id]`, `/api/versions/[id]`
- Convex functions: testimonials CRUD, messages, analytics, versions
EOF
echo -e "${GREEN}✓ v0.4.0 created${NC}"

echo ""
echo -e "${GREEN}✅🎉 All 6 releases created successfully!${NC}"
echo ""
echo -e "${BLUE}Release URLs:${NC}"
echo -e "  • v0.1.0: https://github.com/sean35mm/cv-builder/releases/tag/v0.1.0"
echo -e "  • v0.2.0: https://github.com/sean35mm/cv-builder/releases/tag/v0.2.0"
echo -e "  • v0.3.0: https://github.com/sean35mm/cv-builder/releases/tag/v0.3.0"
echo -e "  • v0.3.1: https://github.com/sean35mm/cv-builder/releases/tag/v0.3.1"
echo -e "  • v0.3.2: https://github.com/sean35mm/cv-builder/releases/tag/v0.3.2"
echo -e "  • v0.4.0: https://github.com/sean35mm/cv-builder/releases/tag/v0.4.0"
echo ""
echo -e "${YELLOW}Your changelog page at /changelog will auto-display these releases.${NC}"
echo -e "${YELLOW}Vercel will rebuild and show the changelog on next deploy.${NC}"

#!/bin/bash

# Release script for OpenCV
# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch

set -e

VERSION_TYPE="${1:-patch}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting release process...${NC}"

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}Error: Must be on main branch to release${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: v${CURRENT_VERSION}${NC}"

# Calculate new version
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version | tr -d 'v')
echo -e "${GREEN}New version: v${NEW_VERSION}${NC}"

# Stage package.json
git add package.json

# Commit version bump
git commit -m "chore(release): v${NEW_VERSION}"

# Create git tag
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

# Create GitHub Release
echo -e "${YELLOW}Creating GitHub Release...${NC}"
gh release create "v${NEW_VERSION}" \
    --title "v${NEW_VERSION}" \
    --generate-notes \
    --notes-file - <<EOF
## What's Changed

See the full changelog below for details.

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/sean35mm/cv-builder.git
cd cv-builder

# Install dependencies
bun install

# Run locally
bun run dev
\`\`\`

## Docker

\`\`\`bash
docker build -t opencv:latest .
docker run -p 3000:3000 opencv:latest
\`\`\`
EOF

echo -e "${GREEN}✅ Release v${NEW_VERSION} created successfully!${NC}"
echo -e "${GREEN}GitHub Release: https://github.com/sean35mm/cv-builder/releases/tag/v${NEW_VERSION}${NC}"
echo -e "${YELLOW}Vercel will automatically deploy the new version...${NC}"

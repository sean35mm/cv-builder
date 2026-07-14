#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-check}"
VERSION_SPEC="${2:-}"

if [[ "$MODE" != "check" && "$MODE" != "prepare" ]]; then
  echo "Usage: $0 check | $0 prepare <patch|minor|major|x.y.z>" >&2
  exit 1
fi

if [[ "$MODE" == "prepare" && -z "$VERSION_SPEC" ]]; then
  echo "A version bump is required for prepare." >&2
  echo "Usage: $0 prepare <patch|minor|major|x.y.z>" >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Release checks must run from the main branch." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release checks require a clean worktree, including untracked files." >&2
  exit 1
fi

echo "Verifying the frozen lockfile..."
bun install --frozen-lockfile --ignore-scripts

echo "Running tests..."
bun test

echo "Running type checks and lint..."
bun run lint

echo "Running the production build..."
NEXT_PUBLIC_CONVEX_URL="https://release-check.convex.cloud" \
  CONVEX_SITE_URL="https://release-check.convex.site" \
  NEXT_PUBLIC_SITE_URL="https://release-check.example.com" \
  bun run build

if [[ "$MODE" == "check" ]]; then
  echo "Release checks passed. No files were changed."
  exit 0
fi

CURRENT_VERSION="$(bun -e 'const pkg = await Bun.file("package.json").json(); console.log(pkg.version)')"
NEW_VERSION="$({
  CURRENT_VERSION="$CURRENT_VERSION" VERSION_SPEC="$VERSION_SPEC" bun -e '
    const current = Bun.env.CURRENT_VERSION ?? "";
    const spec = Bun.env.VERSION_SPEC ?? "";
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
    if (!match) throw new Error(`Unsupported current version: ${current}`);
    if (/^\d+\.\d+\.\d+$/.test(spec)) {
      console.log(spec);
      process.exit(0);
    }
    let [, major, minor, patch] = match.map(Number);
    if (spec === "major") [major, minor, patch] = [major + 1, 0, 0];
    else if (spec === "minor") [minor, patch] = [minor + 1, 0];
    else if (spec === "patch") patch += 1;
    else throw new Error(`Unsupported version bump: ${spec}`);
    console.log(`${major}.${minor}.${patch}`);
  '
})"

if [[ "$NEW_VERSION" == "$CURRENT_VERSION" ]]; then
  echo "The requested version matches the current version." >&2
  exit 1
fi

echo "Updating package.json from $CURRENT_VERSION to $NEW_VERSION..."
bun pm pkg set "version=$NEW_VERSION"
bun install --lockfile-only --ignore-scripts

echo
echo "Prepared version $NEW_VERSION. Nothing was staged, committed, tagged, pushed, released, or deployed."
echo "Review package.json and bun.lock, then perform any approved git and GitHub steps manually."

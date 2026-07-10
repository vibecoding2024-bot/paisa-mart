# Paisa Mart Agent Guide

This repository is a monorepo with two active workspaces: [mobile/](mobile/) and [backend/](backend/). Use the package-local scripts and conventions for the area you are editing; the root package.json does not define project scripts.

Before making changes, read the nearest folder guide first:
- [mobile/CLAUDE.md](mobile/CLAUDE.md) for Expo app conventions.
- [backend/CLAUDE.md](backend/CLAUDE.md) for Bun + Hono backend conventions.

Prefer linking to existing docs instead of restating them. The highest-value references are [README.md](README.md), [MOBILE_INTEGRATION_CHECKLIST.md](MOBILE_INTEGRATION_CHECKLIST.md), [BACKEND_IMPLEMENTATION_GUIDE.md](BACKEND_IMPLEMENTATION_GUIDE.md), [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md), and [INTEGRATION_READINESS_PLAN.md](INTEGRATION_READINESS_PLAN.md).

Keep edits narrow and local. Avoid generated output, build artifacts, and package-manager churn unless the task explicitly requires them. When adding or changing dependencies, keep the package manager consistent with the workspace you touched and update the matching lockfile immediately.

Mobile work:
- Expo Router routes live in [mobile/src/app/](mobile/src/app/).
- Shared components belong in [mobile/src/components/](mobile/src/components/) and utilities in [mobile/src/lib/](mobile/src/lib/).
- Use `react-native-safe-area-context`, NativeWind, `react-native-reanimated`, React Query object APIs, and Zustand selectors as described in [mobile/CLAUDE.md](mobile/CLAUDE.md).

Backend work:
- Hono routes live in [backend/src/routes/](backend/src/routes/) and are mounted from [backend/src/index.ts](backend/src/index.ts).
- Keep API endpoints prefixed with `/api/`.
- Validate backend changes with the smallest relevant `bun run typecheck` or route-level check.

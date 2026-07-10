# Mobile Agent Guide

Read [mobile/CLAUDE.md](CLAUDE.md) before editing anything in this folder; it is the local source of truth for Expo, routing, state, styling, and forbidden files.

Use [mobile/README.md](README.md) and [MOBILE_INTEGRATION_CHECKLIST.md](../MOBILE_INTEGRATION_CHECKLIST.md) for feature context instead of restating long requirements in custom instructions.

Keep mobile edits within [src/app/](src/app/), [src/components/](src/components/), and [src/lib/](src/lib/). Follow the established Expo Router patterns, use `react-native-safe-area-context`, NativeWind, `react-native-reanimated`, React Query object APIs, and Zustand selectors.

Do not edit files marked as forbidden in [mobile/CLAUDE.md](CLAUDE.md) unless the user explicitly asks for that change.

Validate with the smallest relevant mobile check, usually `bun run lint` or `bun run typecheck` from this folder.
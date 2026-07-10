# Mobile Route Screens

Use this file when editing Expo Router screens under [src/app/](.). For broader mobile conventions, read [../../CLAUDE.md](../../CLAUDE.md) and [../../AGENTS.md](../../AGENTS.md) first.

Keep route changes local to the screen you are touching. Preserve the existing navigation structure, and do not create a second `/` route or refactor the root layout unless the task explicitly requires it.

Prefer the existing screen patterns in this folder: typed local state, React Query object APIs for async work, Zustand selectors for shared state, and `react-native-safe-area-context` for custom headers or full-screen layouts.

When a screen needs feature context, link to the relevant doc instead of re-encoding it here. The main references are [../../README.md](../../README.md) and [../../MOBILE_INTEGRATION_CHECKLIST.md](../../MOBILE_INTEGRATION_CHECKLIST.md).

Validate screen edits with the smallest relevant mobile command from [../../package.json](../../package.json), usually `bun run lint` or `bun run typecheck` from the mobile workspace.

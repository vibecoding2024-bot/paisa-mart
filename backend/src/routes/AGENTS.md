# Backend Route Modules

Use this file when editing route handlers under [src/routes/](.). For broader backend conventions, read [../../CLAUDE.md](../../CLAUDE.md) and [../../AGENTS.md](../../AGENTS.md) first.

Keep route modules small and explicit. Mount them from [../index.ts](../index.ts), validate request bodies with Zod, and keep public endpoints under the `/api/` prefix.

Prefer reusing the existing store modules in [../lib/](../lib/) instead of introducing new persistence code. If the task needs a new API shape, update the request/response contract in the route, the store, and the matching mobile client together.

Use the smallest backend validation command available in this workspace, usually `bun run typecheck` from the backend workspace.

# Backend Agent Guide

This folder contains the Bun + Hono backend. Read [backend/CLAUDE.md](CLAUDE.md) before editing code here; it is the source of truth for backend conventions.

Keep route code in [src/routes/](src/routes/) and mount new routers from [src/index.ts](src/index.ts). Every public endpoint should be prefixed with `/api/`.

Prefer small, typed route changes with Zod validation. Use the existing store and route patterns in [src/lib/](src/lib/) and avoid introducing a database unless the task explicitly needs persistence.

Validate backend edits with the smallest relevant command from this workspace, usually `bun run typecheck`.

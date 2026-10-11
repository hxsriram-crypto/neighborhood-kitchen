# Neighborhood Kitchen

A lightweight web marketplace bringing neighbors together: residential cooks and families who need a meal. Neighbors discover upcoming home-cooked meals and contact cooks outside the platform.

## Current authorization

The founder has explicitly approved the mobile, tablet, and desktop wireframes. The current stage is proposing the technical setup. Do not begin functional development or provision dependent services until technical choices and budget are explicitly approved. Do not enable real contact, real participant notifications, or live food activity.

Unresolved product, design, architecture, vendor, cost, privacy, or scope choices require practical options and a recommendation followed by an explicit founder answer before dependent work. Proposed defaults are not approvals. Start technical setup proposals by asking for missing budget ceiling, workspace/repository ownership, and technical preferences.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Template database env for possible later use: `DATABASE_URL` — not required for visual wireframes

## Template stack (not approved product architecture)

These packages were supplied with the project template. Their presence is not founder approval to use them for the functional product.

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

“We sell what we eat” is for cooks, not the marketplace's overall tagline. The presentation must clearly serve both cooks and families looking for a meal.

Discovery and connection only. No in-app orders, reservations, inventory, payments, delivery, order messages, pickup confirmation, or completion tracking. Current screens and assistant interactions are simulated visual wireframes.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- [Document review and source-document links](docs/document-review.md)
- [Founder decision log and authorization gates](docs/decision-log.md)

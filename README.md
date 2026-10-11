# Neighborhood Kitchen

A lightweight marketplace connecting neighbor cooks with families looking for a meal.

## Current stage

This is a playable, fictional-data prototype based on approved wireframes. Records save only in the visitor's browser. Sign-in, contact, operator review, and assistance are simulations; there are no real accounts, file uploads, calls, messages, transactions, or model calls.

The app is not published. Service setup and billing decisions are deferred until a service is needed. The GitHub repository is intended to remain private.

## Source

- `artifacts/neighborhood-kitchen/src/` — playable web app
- `artifacts/neighborhood-kitchen/src/screens/` — marketplace screens and forms
- `artifacts/neighborhood-kitchen/src/nk/` — domain rules, fictional records, persistence, and scripted helper
- `artifacts/mockup-sandbox/` — approved visual reference
- `lib/` and root configuration — shared workspace tooling
- `docs/` — review, decisions, proposal, and prototype walkthrough
- `.conversation/attached_assets/` — the three original project documents

Keep the whole pnpm workspace together; the app folder is not an independent repository.

## Run

In Replit, use the existing `artifacts/neighborhood-kitchen: web` workflow.

For local development with Node.js and pnpm installed:

```sh
pnpm install --frozen-lockfile
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/neighborhood-kitchen run dev
```

The browser-local prototype does not require the template API server, a database, or service credentials.

See [the prototype walkthrough](docs/playable-prototype.md) for sample flows, limitations, and domain/persistence checks. See [the decision log](docs/decision-log.md) before extending the service-backed product.

The [prototype readiness review](docs/prototype-readiness-review.md) maps the current app to PRD T01–T18, distinguishes demonstration gaps from deferred services, and provides a prioritized next-build checklist. It does not authorize implementation.

See the [development handoff progress note](docs/development-handoff-v1.7-progress.md) for the current browser-local implementation status and service-stage gates.

## GitHub

Commit and push source changes to the private repository through the Git pane or Git commands after its remote is configured. Browser-local demo data is not part of Git synchronization. Do not commit credentials, participant information, real evidence, dependencies, or build outputs.

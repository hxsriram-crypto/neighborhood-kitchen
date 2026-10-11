# Browser regressions

## URL and history navigation

Run from the workspace root:

```sh
pnpm --filter @workspace/neighborhood-kitchen run test:navigation:browser
```

This committed suite drives the real app in Chromium against disposable Vite
production builds at `/` and `/navigation-regression/`. Playwright builds, starts,
and stops its test-only preview servers on ports 5181 and 5182. No managed
workflow, API, real identity, or service is needed or changed. Both ports must be
free; an already-running server is deliberately never reused.

Each case has a fresh context, fixed UTC time, and isolated fictional localStorage
with prior simulated neighbor sign-in and contact consent. Data is seeded only
when absent, not overwritten on reload; read-only flows must leave it unchanged.
The existing Google Fonts CSS import receives an empty local response (system
fonts are used). All other external, API, and non-GET requests are blocked and fail
the test if attempted. No request reaches an external service.
Browser exceptions and console errors also fail the test. No contacts are invoked.

Every case runs under both bases. Coverage:

- Discover → encoded meal ID → encoded cook ID; real browser Back and Forward,
  reload on meal/profile, and no duplicate history step from the current tab.
- Fresh direct meal links, reload, and the in-app Back to Discover button.
- Direct/reloaded closed, already-expired, consent-withdrawn, moderated, and
  ineligible meals keep warnings and block contact even with prior neighbor consent.
- Missing meals, private drafts, and cook profiles stay unavailable instead of
  falling through to another screen; the in-app back route and browser history
  recover safely.

This does not advance the clock across cutoffs, test sorting, or cover helper
restrictions. Failure traces/screenshots and disposable builds stay under the
ignored `generated-artifacts/navigation-browser/` directory. There are no retries.
Use `-- --project=artifact-base` or `-- --grep 'Back/Forward'` to narrow a run.
Chromium setup and the shared browser typecheck command are described below.

## Scripted helper

These Playwright tests drive the real React helper. They complement
`src/nk/helper.test.ts`, which tests parsing and matching without the browser.

Start the existing **Neighborhood Kitchen web** managed workflow, then run from
the workspace root:

```sh
pnpm --filter @workspace/neighborhood-kitchen run test:helper:browser
```

Type-check the runner, fixtures, and browser tests separately with
`pnpm --filter @workspace/neighborhood-kitchen run typecheck:browser`.

The default target is the local Replit preview proxy at `http://127.0.0.1:80/`.
To test another development preview, set `PLAYWRIGHT_BASE_URL` to its full URL
(including the artifact base path and trailing slash). Do not target production.
The runner uses Replit's Chromium if installed. Elsewhere, install the Playwright
browser with `pnpm --filter @workspace/neighborhood-kitchen exec playwright install chromium`,
or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a local Chromium executable.
No separate web server or API workflow is started by this suite.

Each test gets a new browser context, a fixed clock, and three fictional offers
with present, absent, and unknown allergen declarations. Expected matches are
explicit, not computed using the helper's matching code. Tests block external
HTTP, all API routes, and non-GET requests, and check that stored fictional
records remain unchanged. No sign-in, real AI, service provisioning, publishing,
editor save, or contact action is performed.

Coverage includes unsupported/partially supported requests, matching keyword
additions/removals, removing every chip, editing before rerunning, blank input,
find/offer mode resets, simulated fallback/restoration, and visible unknown
allergen warnings plus safety/availability/inert-contact boundaries. It does not
exercise meal links, browser Back, browse sorting, or deadline transitions.

Failure screenshots and traces go to the ignored
`generated-artifacts/helper-browser/` directory at the workspace root. No retries
are used, so failures are not hidden.

# Scripted helper browser regressions

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

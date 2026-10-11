# Neighborhood Kitchen — Playable Prototype

## Purpose and limits

Explore the approved marketplace design with working browser-local interactions and fictional Maplewood records. This is not the service-backed functional core or a live pilot.

- No real authentication, uploads, phone calls, messages, payments, or model calls.
- Simulated sign-in and operator access demonstrate flows, not security.
- Use fictional information only.
- Saves belong to this browser and site address, not an account. They are not shared across people, devices, or browser tabs. Clearing browser/site storage removes them.
- Kitchen time is explicitly shown as UTC for this demonstration; no live pilot timezone is selected.
- The helper is scripted and labeled as such. It cannot establish allergy safety, verify eligibility, or publish on anyone's behalf.
- Service costs and relevant privacy/access choices will be revisited before services are enabled.

## Suggested walkthrough

1. **Browse meals:** search, combine cuisine/date/dietary filters, and open a meal. Inspect its portion, sourcing, unknown allergens, pickup window, and separate ordering deadline.
2. **Try contact:** simulate sign-in and consent. The sample phone number is plain text; no call or message is sent.
3. **Try cooking:** open My cooking. Edit the seeded flatbread, or create an offer. Save a draft, complete required disclosures and dates, then publish. Return to Browse meals to see it.
4. **Try invalid states:** leave the ordering deadline missing, set it after pickup, or omit the preparation commitment. Publishing should explain what needs fixing. Preview the expired sample; close an offer and inspect its unavailable contact state.
5. **Try applications:** restart the fictional applicant flow and submit sample information. No evidence file is uploaded.
6. **Try operator review:** enter the clearly labeled operator simulation, approve an application or suspend a cook, then check discovery. Report an offer and find that report in the local queue.
7. **Try the helper:** search with a meal preference, try its fallback, or request a draft and finish it in the normal editor.
8. **Check persistence:** reload after saving a change. To start over, use the confirmed reset in Profile. Reset affects this prototype's sample data only.

### Cook consent, disclosures and publication

- **Other allergens:** edit the additional cook-reported disclosure in the offer editor. A blank entry means unknown/not stated, not “none” or allergy-safe.
- **Validation:** all nine major allergens must explicitly be `unknown`, `present` or `absent`. USD sample prices must be positive decimal values with at most two decimal places; unsupported precision is rejected, never rounded for publication.
- **Preparation:** explicitly check the same-day/no-freezing statement for every publication, reopening and published edit. The editor starts unchecked, saving clears it, and changing the pickup date clears it. A successful action stores statement version, confirmation time, pickup date and offer revision. Existing older local records without that metadata are not given invented confirmations.
- **Withdrawal:** “Withdraw contact consent” acts immediately on the saved fictional offer, independently of unsaved editor changes or publication validation. Discovery, cook profiles, helper matching and contact all use the same availability rule. An unavailable detail preview can still show disclosures, but never the sample phone route. To restore consent, review the editor and save with consent and a fresh preparation confirmation; closing, expiry, eligibility and moderation still apply independently.
- **Reopening:** My cooking opens the editor for review, rather than reusing the previous preparation checkbox. Moderated offers cannot publish/reopen; the rejection explains that the simulated operator must restore them first.
- **Revisions:** expand local fictional offer revisions in the editor to inspect prior offer-content snapshots. Successful saves, closure, withdrawal and moderation preserve earlier content. Only changes made since this feature are available; no earlier history is reconstructed. There is no order/customer history or notification system. The consumer detail shows last-updated time and current revision.
- **External arrangements:** cooks are reminded on edit, publication, closure, withdrawal and reopening to inform neighbors they arranged with outside the platform. Nothing contacts anyone automatically.

Navigation uses artifact-base-prefixed URLs. Meals open at `/meals/<fictional-offer-id>` (for example `/meals/flatbread`), and reload, direct entry, browser Back and Forward retain the selected screen. Profiles, cooking, editors, the helper and simulated operator screens also have routes. A copied link selects a record in the recipient's own browser-local sample data; it does not share edits or enable a service. Unknown meal IDs show a not-found message. Draft previews require the simulated owner identity. Expired, closed, consent-withdrawn, moderated and ineligible links retain disclosures but block contact, even with previously recorded neighbor consent. Helper draft fields remain local history state, not URL parameters.

Meal editors and cook applications warn before discarding unsaved input on screen navigation or browser Back/Forward. The in-app dialog offers **Stay and keep editing** or **Discard and leave**, with focus initially on staying. Reload and tab close use the browser's own leave warning. Untouched forms and successful saves/submissions do not warn; failed validation keeps protection active. Helper-seeded offers count as unsaved until saved. Immediate contact withdrawal saves only consent and does not save other editor changes. There is no automatic draft recovery after a confirmed discard, browser crash or forced tab close; browsers may suppress unload warnings, especially on mobile. Use the explicit local save buttons to keep fictional work.

## Verification

Unsaved-edit protection passes the targeted typecheck/build and five focused history-protection tests covering clean/dirty departures, cancelled Back/Forward, multi-entry traversals, reload warnings, cleanup and older unindexed history. Browser checks verified retained input on staying, navigation and saved-baseline restoration on discard, Back/Forward without duplicate steps, cancelled reload, failed validation remaining protected, successful local draft/application saves and sample submission, and no false warning after demo application restart. All actions remained fictional and browser-local.

The consent/publication changes have passed their targeted typecheck/build and fourteen automated checks (six original domain/persistence checks and eight publication regressions). These do not constitute verification of real sign-in, file storage, multi-user security, real AI, or live operation.

A single browser walkthrough verified the fictional flatbread lifecycle: rejection of excess price precision, other-allergen display, fresh preparation checks, prior revision content, inert phone disclosure, immediate consent withdrawal, explicit restoration, closure/reopening, reload persistence and moderated reopening rejection. The walkthrough also found a negative-margin mobile navigation overflow; its spacing was corrected. Fresh post-reload browser error capture was empty. A Vite hot-update warning during editing required re-entering the initial test inputs; the subsequent lifecycle checks passed.

The URL/navigation change passed the targeted typecheck/build and eighteen domain/persistence/publication/navigation checks. One isolated browser pass verified meal reload, direct entry, Back/Forward through meal and cook-profile screens, active contact gates and inert plain text, and expired, closed, consent-withdrawn, moderated and ineligible detail links with contact blocked even after neighbor consent. Missing records, signed-out draft privacy, and simulated editor/operator gates also passed. No app JavaScript errors were observed, and the tester restored its original local sample data. An extra malformed UTF-8 URL (`/meals/%E0%A4%A`) was rejected before the app loaded (browser protocol error; direct Vite request returned 404), so its app-rendered not-found state was not browser-verified; the parser's safe handling is covered by a unit check.

Run domain/persistence checks from the workspace root:

The local discovery correction adds seven focused checks for first-publication timestamps, edit/closure/reopening preservation, equal-pickup ordering, unknown legacy history, storage reload, fresh fixtures and cutoff expiry. All 33 current checks pass, along with the targeted typecheck/build. A preview screenshot confirms separate labeled pickup and contact/order cutoff information on the featured card. These checks do not add real neighborhoods or shared services.

```sh
pnpm --filter @workspace/api-server exec esbuild ../neighborhood-kitchen/src/nk/*.test.ts --bundle --platform=node --format=esm --outdir=/tmp/neighborhood-kitchen-tests
node --test /tmp/neighborhood-kitchen-tests/*.js
```

Build checks outside the managed workflow need the artifact's non-secret routing configuration:

```sh
PORT=23820 BASE_PATH=/ pnpm --filter @workspace/neighborhood-kitchen run build
pnpm --filter @workspace/neighborhood-kitchen run typecheck
```

Run the focused open-browse clock regressions:

```sh
pnpm --filter @workspace/neighborhood-kitchen run test:discovery:browser
pnpm --filter @workspace/neighborhood-kitchen run typecheck:browser
```

The four clock checks use a disposable static build, isolated browser storage and fictional meals. They verify simultaneous contact-cutoff expiry, featured-offer replacement, next-deadline timer rearming and final empty states, filtered-list expiry without losing search text, and independent focus/visibility refresh at cutoff equality while scheduled timers remain paused. Timer assertions allow the existing 50ms scheduling cushion but run before the 15-second polling fallback. Background-tab checks simulate lifecycle signals explicitly rather than relying on headless tab visibility. No navigation/Back or helper restrictions are retested, no services or contact requests are permitted, and expiry must leave stored meals unchanged. Build/test outputs stay in the ignored `generated-artifacts/discovery-browser/` directory.

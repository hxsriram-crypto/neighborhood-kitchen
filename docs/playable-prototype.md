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

Meal editors and cook applications warn before discarding unsaved input on screen navigation or browser Back/Forward. The in-app dialog offers **Stay and keep editing** or **Discard and leave**, with focus initially on staying. Reload and tab close use the browser's own leave warning; browsers may suppress unload warnings, especially on mobile. Untouched forms and successful saves/submissions do not warn; failed validation keeps protection active. Helper-seeded offers count as unsaved until saved. Immediate contact withdrawal saves only consent and does not save other editor changes. Fictional offer and cook-application drafts can separately opt into browser-local recovery for up to seven days. Recovery restores fields to a form only; it never publishes or submits and never restores a same-day preparation confirmation. Copies are removed on save/submission, explicit discard, sample reset or expiry. They are not shared across browsers, devices or tabs. Fictional report forms have an explicit discard warning but are not covered by the seven-day recovery policy.

## Verification

Fresh checks run after the merged prototype updates:

- 44 domain, helper, navigation, publication, recovery and persistence tests passed.
- 14 scripted-helper browser tests, 48 navigation/form-protection browser tests, and 4 discovery-cutoff browser tests passed.
- App and browser TypeScript checks passed; the Vite production build passed.

These are targeted prototype checks, not a complete run of PRD T01–T18, a screen-reader/accessibility audit, multi-user security validation, or service-backed verification. No real accounts, shared database, uploads, AI, contact requests, participant notifications or live food activity are enabled.

Run the local domain and persistence tests from the workspace root:

```sh
pnpm --filter @workspace/api-server exec esbuild ../neighborhood-kitchen/src/nk/*.test.ts --bundle --platform=node --format=esm --outdir=/tmp/neighborhood-kitchen-tests
node --test /tmp/neighborhood-kitchen-tests/*.js
```

Run the application checks:

```sh
pnpm --filter @workspace/neighborhood-kitchen run typecheck
PORT=23820 BASE_PATH=/ pnpm --filter @workspace/neighborhood-kitchen run build
pnpm --filter @workspace/neighborhood-kitchen run typecheck:browser
pnpm --filter @workspace/neighborhood-kitchen run test:helper:browser
pnpm --filter @workspace/neighborhood-kitchen run test:navigation:browser
pnpm --filter @workspace/neighborhood-kitchen run test:discovery:browser
```

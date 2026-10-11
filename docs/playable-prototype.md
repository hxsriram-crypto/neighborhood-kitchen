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

Navigation is inside the app; screens do not have individual URLs, and browser Back does not step through them.

## Verification

The prototype has passed its targeted typecheck/build, desktop/mobile render checks, and six automated domain/persistence checks. These do not constitute verification of real sign-in, file storage, multi-user security, real AI, or live operation.

Run domain/persistence checks from the workspace root:

```sh
pnpm --filter @workspace/api-server exec esbuild ../neighborhood-kitchen/src/nk/prototype.test.ts --bundle --platform=node --format=esm --outfile=/tmp/neighborhood-kitchen-prototype.test.mjs
node --test /tmp/neighborhood-kitchen-prototype.test.mjs
```

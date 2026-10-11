# Neighborhood Kitchen — Prototype Readiness Review

## Conclusion

The current app is a **playable, browser-local marketplace demonstration**, not the PRD's server-backed functional prototype and not a live pilot.

It demonstrates the central idea: neighbors browse upcoming meals, inspect cook-reported disclosures, and see how they would contact a cook outside the platform. Cooks can apply, draft, publish, edit, and close fictional offers. Operator review and reports are simulated.

Since the initial review, the fictional browser-local prototype has received several follow-up corrections and regression tests. The original gap descriptions below are retained as a history of what was found; current status and remaining service-backed limitations are stated in this update. The next step is to review the updated demonstration, not to redo fixes already completed.

Real authentication, shared data, protected evidence, and real AI require separately approved development stages. This review does not authorize or implement those stages.

## Sources and precedence

- [PRD v1.4](../.conversation/attached_assets/Neighborhood_Kitchen_PRD_v1.4_1791685354745.md): product behavior and acceptance scenarios.
- [Development Handoff v1.6](../.conversation/attached_assets/Neighborhood_Kitchen_Development_Handoff_v1.6_1791685354745.md): staged implementation and approval gates.
- [Business Plan v1.5](../.conversation/attached_assets/Neighborhood_Kitchen_Business_Plan_v1.5_1791685354736.md): marketplace purpose and learning goals.
- [Decision log](decision-log.md): founder-approved exceptions and choices.

Founder decisions take precedence over proposed defaults. In particular, the current browser-local prototype is authorized while service setup is deferred. Signed-out browsing, fictional Maplewood, inert phone contact, and sample USD prices are resolved for this demonstration. “We sell what we eat” is a cook promise, not the overall marketplace positioning.

## What is already represented

- Responsive marketplace discovery with meal cards, prices, pickup dates, cuisine/dietary filters, and no-match/loading states.
- Offer details with ingredients, per-ingredient sourcing/organic status, nine major allergens, unknowns, cross-contact, handling, pickup condition, and planned preparation.
- One simulated identity for browsing and cooking; local application drafts/submission and operator approval/suspension.
- Manual offer drafts, preview, advance publication, required future cutoff, deadline no later than pickup start, explicit closing/reopening, and date-change clearing of the preparation checkbox.
- A shared local availability predicate used by discovery, details, and helper matching. Deadline equality means expired, independently of the later pickup window.
- Inert contact demonstrations, reports without order IDs, local moderation effects, and local audit entries.
- Scripted discovery/drafting assistance with ordinary filters/forms as fallback.
- Reload persistence and explicit warnings for corrupt or unavailable browser storage.
- No ordering, reservation, inventory, checkout, payments, ready/completed states, pickup confirmation, or request messaging.

## Evidence and limits of this review

The review inspected the implemented domain rules, state handling, helper parser, relevant screens, and API route inventory. The API currently exposes the template health endpoint, not the marketplace service contracts.

Verification performed:

- A fresh combined verification passed **44 domain/helper/navigation/publication/recovery/persistence tests**, **14 helper browser tests**, **48 navigation/form-protection browser tests**, and **4 discovery-cutoff browser tests**.
- Application and browser TypeScript checks and the Vite production build passed.
- These targeted checks do not amount to a complete PRD T01–T18 acceptance run, accessibility audit, or service-backed multi-user/security verification.

No services were enabled. All demonstrated identities, meals, contact details and recovery data remain fictional and browser-local.

## Initial review findings and current dispositions

### Current disposition: consent, disclosure and publication fixes

The G2–G5 findings below describe the baseline before the follow-up corrections. The browser-local prototype now checks current cook consent at disclosure, hides withdrawn-consent offers from discovery (see the founder decision in the decision log), supports additional allergen text, validates all nine declaration values and USD price precision, requires a fresh versioned preparation confirmation for publication/reopening/published edits, preserves local offer revisions, shows consumer last-updated time, and rejects moderated publication/reopening with feedback. My cooking routes reopening through explicit editor review.

The current combined checks are summarized above and in the walkthrough. No real accounts, services, uploads, shared data, customer history, notifications, real contact or AI have been enabled. These corrections do not establish service-backed PRD acceptance.

### G1 — Helper constraint and warning behavior (corrected locally)

**PRD: AI02, T12, T13.**

The baseline parser silently dropped some constraints. The scripted browser-local helper now preserves supported allergen exclusions, explicit unambiguous dates, budget and other supported filters; unresolved or unsupported requests block suggestions rather than becoming unrestricted searches.

For a requested avoidance, declarations marked present are excluded. Unknown declarations may remain in results only with a prominent unknown warning and instruction to confirm with the cook. They are never treated as absent or allergy-safe. This is the founder-approved demo policy.

The cook-side helper also leaves unsupported offer details blank rather than inventing facts, and returns drafts for ordinary editor review.

**Evidence:** `src/nk/helper.ts`; `src/nk/helper.test.ts`; helper browser tests; the current verification results above.

### G2 — Cook consent is not checked at contact disclosure

**Priority: highest before any real contact. PRD: CONTACT01, T10.**

Publishing validates `offer.contactConsent`, but the detail screen reveals the sample route based on availability, simulated sign-in, and the neighbor's acknowledgment. It does not also check the cook's offer-level consent. There is no independent cook-route withdrawal flow; saving a published offer with consent removed fails publication validation.

No real contact is exposed today: the route remains fictional plain text.

**Next-build acceptance:** check current cook consent whenever the route is displayed; demonstrate withdrawal/change without falsely suggesting consent remains effective. Obtain a decision on whether withdrawal leaves an offer visible without contact or hides it.

**Evidence:** `src/screens/OfferDetail.tsx` (`contactOk`), `src/nk/domain.ts` (`validatePublish`), `src/screens/OfferEditor.tsx`.

### G3 — Disclosure and price validation are incomplete

**Priority: before calling the core PRD-complete. PRD: PUB01, T12.**

- The detail page has “Other disclosed allergens,” but the editor/data model cannot store additional allergens; that text is fixed.
- UI defaults provide nine unknown declarations, but the publication validator accepts an empty allergen object. This was a domain-level probe, not a claim that ordinary controls currently let users erase all nine declarations.
- A price of `12.345` passes validation and displays as `$12.35`. The stored price is a string, not integer minor units.
- Photo uploads are absent by design; the demo uses sample art. This last item is a service-backed deferral, not an accidental upload failure.

**Next-build acceptance:** allow additional disclosures; validate all declaration values; reject unsupported price precision and use an explicit currency/minor-unit representation in the eventual API/database.

**Evidence:** `src/nk/types.ts`, `src/nk/domain.ts`, `src/screens/OfferEditor.tsx`, `src/screens/OfferDetail.tsx`; temporary validation probes.

### G4 — Publication commitments and revision history are only partial

**Priority: before service-backed publication. PRD: FRESH01–02, PUB02–03, T09, T11.**

New offers start unchecked and pickup-date changes clear the commitment, but republishing/reopening can reuse the stored boolean. There is no versioned declaration record with statement version and confirmation timestamp.

Offer versions increment, and My cooking shows the edited time. However, edits replace the previous offer rather than preserving a revision snapshot, and the consumer detail page does not show last-updated time. The material-change reminder exists for saving a published offer, not consistently across every publication/reopening path.

**Next-build acceptance:** model each required publication confirmation, preserve revisions, show consumer update time, and consistently remind cooks to inform externally arranged customers. Do not introduce order snapshots or buyer notifications.

**Evidence:** `src/nk/types.ts`, `src/nk/store.tsx` (`upsertOffer`, `reopenOffer`), `src/screens/OfferEditor.tsx`, `src/screens/MyCooking.tsx`.

### G5 — Moderation is not a publication/reopening validation gate

**Priority: before service-backed publication. PRD: PUB02, EXP06, T07.**

The publication validator accepts a moderated offer, and reopening uses that validator. The availability predicate still returns `moderated`, so the offer remains hidden and contact stays blocked. This is an inconsistent accepted action/success state, **not an observed moderation exposure bypass**.

**Next-build acceptance:** reject publication/reopening while moderated, with clear feedback; retain the independent discovery/contact restriction.

**Evidence:** `src/nk/domain.ts`, `src/nk/store.tsx`; temporary moderated-publication probe.

### G6 — Meal URLs work within the browser-local prototype

**PRD: WIRE02, EXP05, T06.**

The original review found screens selected through React state under the root route. The local prototype now uses artifact-base-safe `/meals/<id>` URLs and routes for other screens. Reload/direct entry resolve the current browser-local record; browser Back/Forward follows screen navigation without resetting sample data. Unavailable meal links retain disclosure previews but block contact. Unknown IDs fail safely, and drafts require the simulated owner identity.

Copied links still resolve against each browser's own fictional sample data; they do not share edits, create shared access, or substitute for server-backed records.

**Evidence:** `src/App.tsx`, `src/nk/store.tsx`, `src/nk/navigation.ts`, `src/nk/navigation.test.ts`; the documented browser-local limitations remain.

### G7 — Cutoff display and publication ordering corrected; real location filters deferred

**PRD: DISC01–02, T10.**

- Featured offers now display a separate “Contact / order by” cutoff.
- Equal-pickup sorting uses the first recorded publication time, not last edit time. Older sample records without publication history remain unknown rather than being backfilled from edit time.
- Neighborhood is still a fixed fictional area, not a live selector/filter backed by neighborhood/jurisdiction records. That remains an intentional prototype limit.

**Evidence:** `src/screens/Discover.tsx`, `src/nk/domain.ts`, `src/nk/types.ts`, and the current test results above.

**Local-only follow-up:** Featured offers now show a separate “Contact / order by” date/time in UTC alongside labeled pickup information. Discovery sorts by pickup start, then first publication (newest first), then sample ID. Successful first publication records `publishedAt`; edits, closure, moderation, consent withdrawal and reopening preserve it. New published fixtures use their browser-local sample creation time, not a historical claim. Existing saved published/closed samples without that field remain unknown through edits/reopening and reload; no `updatedAt` or migration-time backfill is invented. At equal pickup times, known publication times precede unknown ones, with stable IDs for unknown/tied times. Discovery explains this fallback when older current samples are present. Focused checks cover these rules and local persistence. Real neighborhood filtering remains deferred to the approved shared-data stage.

## PRD acceptance coverage after the local follow-ups

“Represented” below means evidence in the local demonstration, not service-backed acceptance.

| Scenario | Current assessment | Remaining evidence/work |
| --- | --- | --- |
| T01 — Single account and protected ownership/evidence | Partly represented | Simulated identity and owner/editor gates; no real authentication, server ownership or protected evidence. |
| T02 — Eligibility/jurisdiction gates | Partly represented | Pending/suspended sample states are filtered locally. Credential expiry, enabled jurisdictions and direct-API enforcement are absent. |
| T03 — Publish at least seven days ahead | Represented locally; domain tests pass | Eventual shared-data implementation and kitchen timezone still require verification. |
| T04 — Deadline and pickup validation | Represented locally in UTC; domain tests pass | No server schema or local-time/DST acceptance run. |
| T05 — Earlier cutoff than pickup; equality expires | Represented locally; unit and discovery-clock tests pass | No server predicate or shared cache to verify. |
| T06 — Stale pages, resume, contact, delayed responses | Partly represented | Local timers, focus/resume refresh and deep links exist. Dedicated open-detail contact-at-cutoff test, server time/contact revalidation, shared caches and delayed-model checks remain. |
| T07 — Explicit extension/reopening | Represented locally; domain tests pass | Fresh confirmation and moderation gates exist. No server-side eligibility gate or revision retention policy. |
| T08 — Kitchen timezone and DST | Not implemented beyond fixed UTC | IANA timezone conversion and nonexistent/repeated local-time handling remain. |
| T09 — Preparation declaration | Represented locally; domain tests pass | Fresh, versioned confirmation on publication/reopening/published edits. No server-side evidence or shared data. |
| T10 — Contact copy, consent, inert demo | Represented locally; contact tests pass | Current cook and neighbor consent gate disclosure. Route is fictional/inert; no real authentication or external contact. |
| T11 — Material edits and revisions | Represented locally | Offer revisions, last-updated time and direct-reminder copy exist; there is no external notification or order/customer history. |
| T12 — Unknown disclosures and no safety claims | Represented locally | Nine allergens, additional disclosure and unknown state are retained; unknown is warned, never treated as absent or safe. |
| T13 — Assistant hard constraints and no writes | Partly represented by scripted helper | Supported hard constraints and unresolved-request blocking are tested. No real model, server authorization or bounded AI backend. |
| T14 — Draft from supplied facts, review normally | Partly represented by scripted helper | Unsupported details remain blank and normal editor review is required. No real model evaluation. |
| T15 — Approved-current guidance/security | Not implemented | Approved corpus, retrieval, citations, version/scope filtering, injection/private-data evaluations. |
| T16 — Failure fallback/current records | Partly represented | Scripted fallback and local current-state recomputation exist; real-model timeout and server-version rehydration are absent. |
| T17 — Reports and audited suspension | Partly represented | Local reports/audits, moderation and discard warnings exist; trusted operator roles, severity/evidence, reconsideration and retention controls remain. |
| T18 — No transactional functionality | Scope compliant in inspected product code | Preserve this boundary throughout subsequent stages. |

## Intentional deferrals, not current prototype defects

- Real sign-in, trusted operator roles, shared database records, and server-side authorization.
- Cook credential expiry, enabled-jurisdiction enforcement, private evidence/media storage, and review history describing what was checked.
- Actual external contact routes. They must remain inert in the fictional-data functional prototype.
- Real AI, bounded read tools, approved-document retrieval/citations, and the minimum thirty versioned evaluations.
- Live participants, food activity, notifications, production hosting, and live incident operations.

Calling the current app a “playable prototype” is accurate. Calling it the PRD's completed “functional prototype” would imply services and acceptance evidence that do not yet exist.

## Prioritized next-build checklist

### A. Review the corrected fictional demonstration — implementation changes are already present

1. Review the scripted helper with common allergen/date restrictions and explicit warnings for unknowns.
2. Walk through current cook-consent withdrawal, other-allergen disclosure, price validation, preparation confirmation and revision history.
3. Verify meal routes, cutoff display/sorting, expiry states, interrupted-draft recovery, and stay/discard navigation.
4. Conduct the still-needed full keyboard/accessibility and usability walkthrough. Keep records fictional and contact inert.

### B. Build the shared functional core — separately authorize services/setup

1. Revisit service-specific costs/access and the necessary privacy/test settings when each service becomes needed. The approved stack need not be selected again.
2. Define schema/API contracts for accounts, cook applications/credentials, neighborhoods/jurisdictions, offers/ingredients, consent, revisions, reports, and audits.
3. Implement approved authentication and server ownership/operator authorization; shared fictional records and migrations/seeding; scoped evidence/media access when authorized.
4. Enforce publication and the common availability predicate on the server, including credential expiry, jurisdiction status, consent, UTC/IANA time, and explicit moderation states.
5. Add response/server-clock and no-cache contact contracts, strict field/price validation, revisions, deletion/retention controls, rate limits, and checks appropriate to the activated services.
6. Verify the core PRD scenarios against APIs and real multi-user authorization, while keeping contact, participant notifications, and live food disabled.

### C. Add the real assistant only after the core

Approve provider/model/retrieval choices, sample guidance, retention, and call/time/session/monthly limits. Implement allowlisted read-only tools, current-offer revalidation, citations and fallback. Run at least thirty versioned cases; demonstrate critical constraint/deadline/authorization compliance and record latency/usage. Planning documents are not an approved public-policy corpus.

### D. Treat a live pilot as a separate release

Resolve jurisdiction/local obligations, residential eligibility verification, real contact consent, privacy/retention, insurance/coverage statements, support and incident handling. Verify security, monitoring, restoration/rollback, and obtain explicit launch approval. No orders, payments, stock, or fulfillment tracking are added by this step.

## Decisions to ask only when the affected work is selected

| Decision | When needed | Recommendation, not approval |
| --- | --- | --- |
| Unknown allergens in strict avoidance requests | Resolved for local prototype | Founder chose to include unknown-declaration offers only with a prominent warning and reminder to confirm with the cook. Unknown never means absent or allergy-safe. |
| Visibility after cook contact-consent withdrawal | Resolved for local prototype | Founder chose hide from discovery and block contact; unavailable detail previews retain disclosures. No live-contact or retention policy approved. |
| Kitchen timezone and local-time policy | Before shared scheduling | Select an explicit IANA kitchen timezone and require DST disambiguation; do not infer it silently from the browser. |
| Input/photo/evidence limits and review access | Before affected forms/uploads | Narrow allowed fields/types/sizes and least-privilege access, with no real evidence during demo work. |
| Retention/deletion, incident holds, and operator coverage | Before retaining real data or live reports | Approve policies and responsibilities before collection. |
| Service spending/setup and test sign-in delivery | Before each affected service | Approve a scoped development setup, not live activation or an assumed billing cap. |
| Guidance ownership and real AI usage limits | Before assistant stage | Founder-approved, versioned demo guidance and bounded evaluations; no uncontrolled model calls. |

Public demo browsing, fictional location, sample USD, phone-only illustration, the selected core stack, workspace ownership, private GitHub, and keeping the temporary preview are already decided. Do not ask the founder to repeat them.

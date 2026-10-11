# Neighborhood Kitchen — Prototype Readiness Review

## Conclusion

The current app is a **playable, browser-local marketplace demonstration**, not the PRD's server-backed functional prototype and not a live pilot.

It demonstrates the central idea: neighbors browse upcoming meals, inspect cook-reported disclosures, and see how they would contact a cook outside the platform. Cooks can apply, draft, publish, edit, and close fictional offers. Operator review and reports are simulated.

The next recommended step is to correct the highest-impact demonstration gaps, then collect usability feedback. Real authentication, shared data, protected evidence, and real AI require separately approved development stages. This review does not authorize or implement those stages.

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

- All **six existing domain/persistence tests passed**. They cover deadline equality, local availability states, advance publication, cutoff validation, preparation/contact consent/chronology/cook approval, and browser-storage failure behavior.
- The advance fixture has pickup on 19 October and cutoff on 18 October against a 10 October test clock.
- Additional temporary probes confirmed the validation and parser gaps listed below.
- A fresh **820 × 1180 tablet screenshot** showed the public marketplace page rendering without visible layout breakage or browser errors. Earlier desktop/mobile checks are documented in the prototype walkthrough.

This was not a full interactive browser, keyboard, screen-reader, multi-user, security, or PRD T01–T18 acceptance run. Six passing unit tests do not establish all eighteen acceptance scenarios. No services were enabled and no app behavior was changed.

## Actual gaps in the current demonstration

### Follow-up status: consent and publication corrections

The G2–G5 findings below describe the reviewed baseline. The browser-local fictional prototype now checks current cook consent at disclosure, hides withdrawn-consent offers from discovery (founder decision recorded in the decision log), supports other-allergen text, validates all nine declaration values and USD precision, requires fresh versioned preparation confirmation for publication/reopening/published edits, preserves local offer revisions, shows consumer last-updated time, and rejects moderated publication/reopening with feedback. My cooking routes reopening through explicit editor review.

Fourteen focused domain/persistence/publication checks and the targeted typecheck/build pass. No real accounts, services, uploads, shared data, customer history, notifications, real contact or AI have been enabled. These corrections do not establish service-backed PRD acceptance or resolve the remaining gaps.

### G1 — The helper can ignore important meal restrictions

**Priority: highest. PRD: AI02, T12, T13.**

The scripted parser does not reliably preserve all requested constraints:

- `vegetarian peanut-free under $12` produced only vegetarian and budget chips. A fixture declaring peanuts present still matched.
- `vegetarian under $12 on 2026-10-18` produced no date constraint.

The helper is labeled scripted and not allergy-safe, but silently dropping a restriction can still misrepresent the intended experience.

**Next-build acceptance:** never recommend an offer declaring a requested excluded allergen present; surface unsupported or ambiguous constraints instead of silently discarding them; test explicit dates and common exclusion phrasing. Decide how unknown declarations behave in strict avoidance searches before implementing that policy.

**Evidence:** `src/nk/helper.ts` (`parseFind`, `matchOffers`), `src/screens/Assistant.tsx`; temporary parser/matcher probes.

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

### G6 — “Direct links” are not actual shareable meal URLs — addressed locally

**Priority: improve before broader prototype feedback. PRD: WIRE02, EXP05, T06.**

The original review found screens selected through React state under the root route. The local prototype now uses artifact-base-safe `/meals/<id>` URLs and routes for other screens. Reload/direct entry resolve the current browser-local record; browser Back/Forward follows screen navigation without resetting sample data. Unavailable meal links retain disclosure previews but block contact. Unknown IDs fail safely, and drafts require the simulated owner identity. Copied links do not share local edits or provide real multi-user access.

**Next-build acceptance:** base-path-safe meal URLs; reload/deep-link handling for active, expired, closed, and unavailable offers; coherent browser Back behavior. These changes need no real accounts or paid service.

**Evidence:** `src/App.tsx`, `src/nk/store.tsx`, `src/nk/navigation.ts`, `src/nk/navigation.test.ts`; the documented browser-local limitations remain.

### G7 — Some discovery details do not match the PRD

**Priority: lower than consent and constraint handling. PRD: DISC01–02, T10.**

- The featured meal card shows pickup information but omits its contact/order cutoff.
- Equal-pickup sorting uses last-edited time, not publication time.
- Neighborhood is a fixed fictional area, not a real selector/filter backed by neighborhood/jurisdiction records. This is a deliberate single-area limitation for the demo.

**Next-build acceptance:** show the cutoff on featured cards; preserve publication time for the required stable sort; add real neighborhood filtering only in the approved shared-data stage.

**Evidence:** `src/screens/Discover.tsx`, `src/nk/domain.ts` (`sortOffers`), `src/nk/types.ts`.

## PRD acceptance coverage

“Represented” below means evidence in the local demonstration, not service-backed acceptance.

| Scenario | Current assessment | Remaining evidence/work |
| --- | --- | --- |
| T01 — Single account and protected ownership/evidence | Partly represented | Simulated identity/editor ownership; no real authentication, server ownership, or protected evidence. |
| T02 — Eligibility/jurisdiction gates | Partly represented | Pending/suspended cooks are filtered locally. Credential expiry, enabled jurisdictions, and direct-API enforcement are absent. |
| T03 — Publish at least seven days ahead | Represented; domain check passes | Advance fixture is nine days ahead; recheck with eventual shared data and kitchen timezone. |
| T04 — Deadline and pickup validation | Represented in UTC; domain checks pass | No full server/schema or local-time acceptance run. |
| T05 — Earlier cutoff than pickup; equality expires | Represented; predicate boundary test passes | Browse/helper reuse the predicate; full browser/server acceptance is still needed. |
| T06 — Stale pages, resume, contact, delayed responses | Partial | Local timers/resume handling exist. No server time/contact revalidation, real cache contracts, delayed model checks, or shareable deep links. |
| T07 — Explicit extension/reopening | Partial | No auto-renewal; close/reopen exists. G4/G5 remain. |
| T08 — Kitchen timezone and DST | Not implemented beyond fixed UTC | IANA timezone conversion and nonexistent/repeated local-time handling. |
| T09 — Preparation declaration | Partial | Initial unchecked/date clearing exist. Versioned publication confirmations remain. |
| T10 — Contact copy, consent, inert demo | Partial | Copy and inert route exist. Cook-consent disclosure/withdrawal and featured-card cutoff remain. |
| T11 — Material edits and revisions | Partial | Version counter, owner edited time, and save reminder exist; retained revisions and consistent consumer metadata/reminders remain. |
| T12 — Unknown disclosures and no safety claims | Partial | Nine declarations and unknown/cross-contact copy exist; additional allergens and schema enforcement remain. |
| T13 — Assistant hard constraints and no writes | Partial scripted demonstration | G1 must be corrected; real bounded backend and authorization are deferred. |
| T14 — Draft from supplied facts, review normally | Represented by script | Missing-field prompts/editor handoff exist; real-model evaluation is deferred. |
| T15 — Approved-current guidance/security | Not implemented | Approved corpus, retrieval, citations, version/scope filtering, injection/private-data evaluations. |
| T16 — Failure fallback/current records | Partly represented | Simulated fallback and locally recomputed results exist; actual timeout and server-version rehydration tests are absent. |
| T17 — Reports and audited suspension | Partly represented | Local reports/audits and suspension effects; secure operator actions, severity/evidence, reason/reconsideration, and retention controls remain. |
| T18 — No transactional functionality | Scope compliant in inspected product code | Preserve this boundary throughout subsequent stages. |

## Intentional deferrals, not current prototype defects

- Real sign-in, trusted operator roles, shared database records, and server-side authorization.
- Cook credential expiry, enabled-jurisdiction enforcement, private evidence/media storage, and review history describing what was checked.
- Actual external contact routes. They must remain inert in the fictional-data functional prototype.
- Real AI, bounded read tools, approved-document retrieval/citations, and the minimum thirty versioned evaluations.
- Live participants, food activity, notifications, production hosting, and live incident operations.

Calling the current app a “playable prototype” is accurate. Calling it the PRD's completed “functional prototype” would imply services and acceptance evidence that do not yet exist.

## Prioritized next-build checklist

### A. Improve the existing fictional demonstration — approval required

1. Correct helper constraint handling (G1), with regression cases for exclusion phrasing, explicit dates, and unsupported requests.
2. Honor cook consent at disclosure and resolve withdrawal behavior (G2).
3. Complete additional allergens and price/declaration validation (G3).
4. Correct publication confirmation, revision/update representation, and moderation feedback (G4/G5).
5. Add real meal URLs/browser navigation (G6), then address featured cutoff and sorting (G7).
6. Run one coherent walkthrough of these changed flows, including keyboard/mobile/tablet/desktop checks. Keep fictional data and inert contact.

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
| Unknown allergens in strict avoidance requests | Before changing that helper policy | Exclude present and unknown declarations from a strict avoidance recommendation; ordinary browsing may show unknowns prominently. Confirm this interpretation with the founder. |
| Visibility after cook contact-consent withdrawal | Resolved for local prototype | Founder chose hide from discovery and block contact; unavailable detail previews retain disclosures. No live-contact or retention policy approved. |
| Kitchen timezone and local-time policy | Before shared scheduling | Select an explicit IANA kitchen timezone and require DST disambiguation; do not infer it silently from the browser. |
| Input/photo/evidence limits and review access | Before affected forms/uploads | Narrow allowed fields/types/sizes and least-privilege access, with no real evidence during demo work. |
| Retention/deletion, incident holds, and operator coverage | Before retaining real data or live reports | Approve policies and responsibilities before collection. |
| Service spending/setup and test sign-in delivery | Before each affected service | Approve a scoped development setup, not live activation or an assumed billing cap. |
| Guidance ownership and real AI usage limits | Before assistant stage | Founder-approved, versioned demo guidance and bounded evaluations; no uncontrolled model calls. |

Public demo browsing, fictional location, sample USD, phone-only illustration, the selected core stack, workspace ownership, private GitHub, and keeping the temporary preview are already decided. Do not ask the founder to repeat them.

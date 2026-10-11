# Neighborhood Kitchen Product Requirements

Version 1.4 | Product planning draft | 10 October 2026

## Product objective and scope

Neighborhood Kitchen is a responsive web app for discovering upcoming home-cooked meals from eligible residential neighbors and contacting those cooks outside the platform. Motto: “We Sell What We Eat.” One account supports both consumer and cook participation. Cooks set prices; monetization is deferred.

This revision replaces the transactional scope of PRD 1.3. No ordering, order acceptance, reservations, inventory counts, payments, order cancellations, ready/completed states, pickup confirmation, no-show tracking or fulfillment dashboards are included. Do not implement the previous request lifecycle, reservation jobs, request snapshots or request-scoped messaging. Contact actions do not establish an order or guarantee availability.

| Release | Included | Boundary |
| --- | --- | --- |
| Clickable wireframes | Responsive consumer and cook journeys, simulated assistant, disclosures and expiration states | Fictional data; no real contact actions |
| Functional prototype | Shared server-backed offers, deadline filtering, account roles, real bounded AI and document retrieval over fictional data | Prominent demo label; external contact and participant notifications disabled |
| Controlled live pilot | Approved cooks, enabled jurisdiction, real offers and cook-approved external contact routes, reporting and moderation | Real activity disabled until live gates pass; transactions remain outside the app |

Individual residents preparing food at home are eligible under applicable rules. Exclude restaurants, caterers, commercial kitchens, professional meal-preparation companies, resellers and aggregators. A required home-kitchen permit or business registration alone does not disqualify a residential cook. Do not imply that home-cooked food is automatically healthy, allergy-safe or independently verified.

## Responsive experience and journeys

WEB01: Deliver a web app usable on mobile, tablet and desktop. No native apps are required. Use responsive layouts rather than limiting functionality to mobile. Support keyboard navigation, visible focus, readable text, labeled fields and touch-friendly controls.

JOUR01 Consumer: Select neighborhood and pickup date → browse active offers or use “Help me find a meal” → inspect ingredients, sourcing, allergens, planned preparation, pickup window and deadline → read “Contact the cook to confirm availability and arrange your order outside Neighborhood Kitchen” → explicitly open an approved external contact route. Ordering, payment and exact pickup coordination happen outside the app. Show no order-success screen.

JOUR02 Cook: Sign in with the same account → apply to cook → receive eligibility review → draft an upcoming offer manually or with “Help me offer a meal” → complete disclosures, price, pickup window, contact/order deadline and contact consent → confirm same-day preparation commitment → preview and publish → edit or close the offer as plans change. Allow offers for next week. Publishing ahead does not mean preparing ahead.

WIRE01: First deliverable is clickable mobile and desktop wireframes with tablet adaptation. Include discovery, detail, profile, cook application, My cooking, offer editor, assistant and operator review/report screens. Review before server-backed implementation.

WIRE02: Include loading, no matches, invalid deadline, expired direct link, closed offer, suspended cook, model failure and missing-disclosure states. No cart, inventory, order history, reservation, checkout or completion screens.

## Accounts, eligibility and privacy

AUTH01: One authenticated user owns a neighbor profile and optional cook profile. Neighbor navigation: Discover, Profile and Become a cook/My cooking. Operators use restricted review screens; role checks are server-side.

COOK01: Save incomplete cook applications. Require relevant jurisdiction fields, residential preparation declaration, neighborhood eligibility and policy consent before submission. Pending applicants cannot publish live offers.

COOK02: Store applicable permit number, agency, expiry, private evidence and review history. Record what was checked, source, reviewer and date. Upload alone is not verification. Public badges describe check scope and date without exposing private evidence.

COOK03: Publication and discovery require an approved cook, current eligibility and an enabled jurisdiction. Expiry, suspension or jurisdiction disablement hides offers and blocks contact actions on the server. Optional credential reminders are administrative, not order notifications.

COOK04: Commercial-operation reports open a review case. Decisions include reason and a reconsideration route. Keep residential permit holders eligible when their activity meets the approved policy.

PRIV01: Public discovery shows approximate neighborhood only. Exact home addresses and private credentials are not public offer fields. Cooks share exact pickup locations directly outside the app. No automatic address-release logic or retained buyer address access exists.

CONTACT01: Require authentication to access external contact actions in the live pilot; public browsing is a proposed default. Cooks explicitly approve which contact route is shown to signed-in neighbors. Store consent and allow changes or withdrawal. Prototype routes are inert and fictional. Final channel choices remain a technical-design decision; do not build in-app messaging.

CONTACT02: Use a narrow set of validated contact types, such as email or phone. Reject executable URLs and arbitrary redirect targets; any additional messaging channel needs an approved URL/domain policy. Explain that contact details may be seen and retained by other participants. Contact actions record no message content or order details.

## Offer publishing and data validation

| Field group | Required content |
| --- | --- |
| Meal | Title, description, image, portion-size description, currency and cook-set price per portion |
| Ingredients | Names, relevant compound ingredients, sourcing or explicit unknown, organic status per ingredient as cook-reported/not organic/unknown |
| Allergens | Explicit declarations for nine major US allergens and other disclosed allergens; kitchen cross-contact information or unknown; blank never means absent |
| Schedule | Kitchen timezone, pickup start and end on one local date, derived planned preparation date, required Contact/order by timestamp |
| Cook and handling | Eligible cook reference, applicable public permit information, family-care promise, hot/chilled pickup condition and food-specific handling instructions where needed |
| Contact | Cook-approved external route with consent; actual availability confirmed directly with cook |

PUB01: Validate required fields on the server. Price is positive and stored in integer minor units with currency. Portion size describes food quantity per serving; it is not a count of available portions. No stock count, maximum quantity, minimum order or reservable-quantity field.

PUB02: States are draft, published, closed and removed. Expired is derived from the deadline, not a manually maintained inventory state. Cooks can close an offer early with one action. Closed, removed and expired offers are excluded from discovery; operator suspension independently blocks visibility. Preserve revisions for moderation under the approved retention policy.

PUB03: Offer owners may edit details; validate and increment version. Show last-updated time. Reconfirm the preparation commitment when the pickup date changes. The platform cannot notify people who already ordered outside it: clearly remind cooks to communicate material changes directly to those neighbors. Do not create transaction snapshots or cancellation flows.

PUB04: Future offers can be published immediately, including at least seven days ahead. No weekly recurring scheduler is required. A normal date picker is enough; arbitrary lead-time caps are not a founder requirement.

## Contact/order deadline and expiration

EXP01: Every published offer has a required Contact/order by date and time chosen by the cook. It must be strictly in the future at publication and no later than pickup start. Pickup end must be after start and on the same local date. The deadline can be on an earlier day than pickup.

EXP02: Store UTC instants and the kitchen's IANA timezone. Display schedule and deadline with an explicit timezone label. Use the kitchen timezone for date filters and preparation date. Reject nonexistent local times and require disambiguation of repeated daylight-saving times; never silently shift the selected time.

EXP03: An offer is discoverable only when published, not moderated/removed, cook eligible, jurisdiction enabled, neighborhood/date filters satisfied and server_now < contact_order_by. At equality it is expired. Reuse this server predicate for browse, search, direct-contact authorization and assistant results.

EXP04: Filtering occurs at read time; correctness does not depend on a background expiry job. Include server time and deadline in responses. Client timers remove visible expired cards and disable contact at cutoff, with server revalidation on refresh and before revealing/opening the contact route. Recheck when a suspended/background browser resumes. Clear or revalidate cached results; disable caching of contact eligibility. A previously copied phone/email or already opened external app cannot be revoked.

EXP05: Existing direct links after cutoff show “Ordering deadline has passed” and disable the ordering contact action. Closed offers show “This offer is closed.” Reports remain accessible. Expired offers may appear in the owner's management view, visibly labeled, but never in consumer discovery or fresh assistant recommendations.

EXP06: Cooks may explicitly extend a deadline only if the new cutoff is in the future and no later than pickup start. Revalidate all fields, eligibility and preparation commitment as applicable; record the revision. Never automatically renew offers. A closed offer requires explicit reopening. Reopening cannot bypass moderation or eligibility restrictions.

EXP07: Example: Contact/order by Tuesday 6 p.m.; pickup Thursday 5–7 p.m., kitchen local time. Visible Tuesday 5:59 p.m.; absent from search at Tuesday 6 p.m., despite future pickup. No assumption about whether orders were placed.

## Same-day preparation commitment

FRESH01: At each publication, require an unchecked declaration: “I will prepare this meal on the day of pickup and will not freeze the completed meal.” Store text version, cook ID, confirmation timestamp, offer version and planned date. Disclosed frozen ingredients are allowed; the completed meal must not be frozen.

FRESH02: Derive planned preparation date from pickup in kitchen timezone; do not require duplicate date entry. Changing pickup date clears the declaration and requires reconfirmation. Show “Planned for [date] — same-day preparation commitment, cook-reported.” Do not claim a future meal is already prepared or verified.

FRESH03: Show hot or chilled pickup condition. There is no ready-time confirmation, actual-preparation workflow or completion tracking in this MVP. The app communicates the plan and promise; consumers confirm actual circumstances directly with cooks.

FRESH04: If plans change or the commitment cannot be met, the cook edits or closes the offer and informs externally arranged customers directly. Reports of inaccurate claims enter moderation. Do not create automatic order cancellation or affected-buyer notifications.

FRESH05: Disclosures are digital; no platform mandate to print or attach preparation labels. Applicable local physical labeling, handling and temperature-control obligations remain live-pilot requirements.

## Discovery and consumer contact

DISC01: Cards show meal title/image, cook, approximate neighborhood, cook-set price, pickup date/window and Contact/order by. Offer details show all disclosures and the external-ordering explanation. Display “Contact cook to confirm availability”; never “X portions left,” “in stock,” or “order confirmed.”

DISC02: Standard filters include neighborhood, pickup date, cuisine and cook-declared dietary tags. Sort by pickup start, then newest publication with stable ID tie-break. Tags never override ingredient or allergen evidence. No precise distance estimates from a neighborhood centroid.

DISC03: No results offers filter reset and another pickup date. Never silently insert expired, out-of-area, ineligible or commercial listings. Deadline is separate from pickup date: a next-week search still excludes offers whose contact deadlines passed today.

DISC04: Contact click analytics, if enabled, measure interest only. Opening email/phone does not prove that a message was sent, an order was accepted, payment occurred or a pickup completed.

## Shared assistant and document RAG

AI01: One backend serves “Help me find a meal” on Discover and “Help me offer a meal” in My cooking. Explicit consumer/cook context; reset task-specific context or ask to retain it when switching. Server authorization determines role. Support discovery, selected-offer questions, drafting and approved platform help.

AI02: Parse natural language into validated neighborhood, pickup date/time, budget, dietary restrictions, stated allergens and soft preferences. Show editable chips; ask about ambiguity. Enforce hard constraints with application logic; never silently relax them. Highlight unknown ingredients/cross-contact and never call a meal allergy-safe. Household size may inform a question to ask the cook; it cannot be matched against stock or promise available portions.

AI03: Cook drafts contain only supplied/approved facts. Ask about missing ingredients, sourcing, allergens, portion size, price, pickup, deadline and contact route. Return proposed fields to the ordinary editor for explicit review, FRESH01 declaration and publication. AI cannot publish, extend deadlines, approve eligibility or send messages.

AI04: Meal facts come from current cook-published records, including stated price, ingredients, pickup and cutoff. They are not live inventory. Explain “Published offer; confirm availability with the cook.” Revalidate eligibility/deadline immediately before returning recommended IDs; hydrate cards from current server records. If a slow response crosses cutoff, omit that offer. Historical chat cards lose contact eligibility at expiry. Guidance documents do not determine active-offer facts.

AI05: Use bounded LangChain workflows, schema validation and allowlisted read tools: searchOffers, getOfferDetails, validateOfferDraft and retrieveGuidance. Draft validation accepts proposed data and has no writes. Parameterized queries only; no model-generated SQL. Cap model/tool calls, output, time and usage. No browser model credentials. Normal filters and forms remain available on model failure.

RAG01: Use a small approved corpus covering participation, ingredient disclosure, preparation commitment, deadlines, direct external ordering, privacy and reporting. No platform order/cancellation workflow should appear in help. Store document ID, version, approval state, jurisdiction and effective date with chunks/embeddings in a vector index. Filter to current approved applicable guidance, cite title/version or link and admit missing evidence. Withdraw obsolete documents. Planning documents, private credentials, addresses and conversations are not public-policy corpus inputs.

AI06: Treat offers and retrieved text as untrusted data, never instructions. Restrict access to caller permissions. Keep short sessions; cross-session memory deferred. Choose retention before live use, support deletion and redact logs. Exclude private contact details from model context unless separately required and approved; contact controls can render through the application.

AI07: At least 30 versioned fixture cases across both entry points, sources, unknowns, deadline boundaries, changed/closed offers, stale eligibility, prompt injection and failures. Record input/context, expected fields/results/sources and prohibited claims. Rerun on changes to prompts, model, tools or corpus.

AI08: Critical deterministic suite must have 100% deadline, authorization and hard-constraint compliance; no invented disclosures, stock guarantees or unauthorized actions. Proposed overall task success ≥90%; proposed response p95 ≤8 seconds in documented test conditions. Set timeout, per-session and monthly usage budgets before model tests. Track redacted model/prompt version, source IDs, latency and usage.

## Reporting and operations

SAFE01: Reports from offers and profiles include suspected illness, inaccurate allergens/preparation, commercial misuse and harassment. Collect optional reporter-supplied context, not a mandatory order ID. Operators triage severity, suspend offers/cooks and record reasons and actions. Acknowledgment and privileged actions are auditable.

SAFE02: Preserve offer revisions and submitted report evidence under approved retention. The system has no order ledger and cannot identify everyone who ordered externally. Do not promise automatic buyer tracing or refund/dispute resolution. Define direct outreach and applicable incident reporting in the operating playbook.

SAFE03: Administrative notices can cover application decisions, credential expiry and report receipt. No order, pickup, payment, cancellation or completion notifications. Real participant notifications stay disabled in the prototype.

## Data model and service contracts

| Entity | Essential data |
| --- | --- |
| User / NeighborProfile | UUID, authentication reference, public name, neighborhood, status, policy consents |
| CookProfile / Credential | Unique user reference, application/eligibility status, private evidence, permit/expiry/reviewer records, approved contact route and consent |
| Neighborhood / Jurisdiction | Public area, timezone, allowlist, policy version and requirements |
| MealOffer / Ingredient | Cook ID, version, status, disclosures, price/currency, portion description, pickup UTC instants, kitchen timezone, contact_order_by, preparation declaration, timestamps |
| OfferRevision / AuditEvent | Offer version/change record, actor, reason, timestamps; restricted access |
| Report | Offer/cook reference, reporter, category, optional evidence, severity and resolution |
| GuidanceDocument / Chunk | Version, approval, scope, effective date, source link, embedding/index reference |
| AssistantSession | Caller, explicit context, short history/draft/preferences under retention controls |
| Optional ContactIntent | Consumer/offer reference and time under privacy policy; no order, message or fulfillment data |

No MealRequest, Reservation, inventory ledger, buyer-order history or request-scoped Thread entity.

Suggested endpoints: GET /offers (shared eligibility predicate), GET /offers/:id, POST /offers, PATCH /offers/:id, POST /offers/:id/close, POST /offers/:id/reopen, GET /offers/:id/contact (authenticated, eligibility rechecked, no-cache), cook application/review endpoints, POST /reports and POST /assistant/messages. GET detail may return an expired status without contact. Assistant responses contain structured chips, current eligible offer IDs, proposed draft fields and guidance citations. Define exact contracts in technical design.

## Architecture, quality and analytics

Proposed architecture: one TypeScript responsive web app, existing server API, managed authentication, relational database, restricted evidence/media storage, model integration, LangChain validation/tools and a small vector index. No ordering service, stock reservation service, payment gateway or autonomous agent is needed. Offer expiry uses timestamp queries; optional jobs support credential reminders or corpus ingestion, not correctness of visibility.

Enforce ownership, least privilege, input validation, safe media handling, rate limits, secrets management, environment separation, backups and audit logging. Define retention/deletion and incident holds before live data. Test keyboard/touch flows and mobile/tablet/desktop layouts. Pin dependencies and choose vendors after checking current capabilities and budget.

Measure discovery task time, publishing effort, active published offers, repeat discovery, recurring cooks, unmatched searches, deadline-filter correctness, reports, AI task success/latency/cost and optional contact intent. Do not report sales, fulfillment, order conversion or stock accuracy. Proposed learning targets: median discovery under 2 minutes, repeat publishing under 5 minutes, repeat discovery ≥30%, recurring cooks ≥60%, required disclosures/deadline tests 100%. Report denominators; these are learning proposals, not forecasts.

## Backlog and acceptance scenarios

| Sequence | Deliverable | Completion evidence |
| --- | --- | --- |
| 1 | Responsive fictional wireframes | Both journeys and expiration/fallback states reviewed |
| 2 | Accounts, cook drafts, disclosures and eligibility | Role/ownership checks pass; one account supports both roles |
| 3 | Advance publishing, deadline validation and discovery | Boundary/timezone tests pass; no inventory or transaction flows |
| 4 | External contact, report/moderation controls | Consent and current eligibility enforced; demo actions inert |
| 5 | Bounded shared assistant and approved-document RAG | Versioned evaluation suite, citations and fallbacks pass |
| 6 | Pilot preparation | Policies, local requirements, support, monitoring and recovery ready |

T01: One account can browse and apply to cook; unauthorized offer editing and evidence access fail.

T02: Pending, expired or suspended cook and disabled jurisdiction prevent publication, discovery and contact even through direct APIs.

T03: Publish an offer seven days ahead; preparation date remains pickup date; no stock count required.

T04: Missing, past or after-pickup-start cutoff fails; cutoff equal to pickup start is valid when future. Pickup end before start or crossing local midnight fails.

T05: Tuesday cutoff/Thursday pickup example behaves correctly before, at and after cutoff in browse, search and assistant.

T06: Stale cache, browser resume, open detail, contact click and delayed AI response at cutoff cannot return actionable expired offers. External apps already opened are outside control.

T07: Explicit extension/reopening validates future cutoff and eligibility; no automatic renewal; closure removes offer immediately.

T08: UTC conversion, kitchen date and daylight-saving ambiguity/nonexistent-time validation pass.

T09: Publication without preparation declaration fails; pickup-date edit clears declaration; future food never labeled already prepared.

T10: Contact confirmation copy and deadline visible on core layouts; live contact requires consent/authentication; prototype cannot contact real people.

T11: Material edit creates revision and reminds cook to inform external customers; no order cancellation or buyer notifications created.

T12: Unknown allergen/sourcing information remains unknown; dietary tags never prove allergy safety.

T13: AI honors hard constraints, omits expired/closed/ineligible offers, never guarantees quantities and cannot perform writes/messages.

T14: Cook drafting asks for missing cutoff/disclosures and requires normal review/publication; no fabricated facts.

T15: Approved-current guidance cited; withdrawn/wrong-jurisdiction guidance excluded; prompt injection and private-data access fail.

T16: Model timeout/no-match preserves filters/forms; AI results rehydrated from current offer versions.

T17: Reports and suspensions auditable; reporter can submit without order ID; system does not claim transaction traceability.

T18: No ordering, reservation, inventory, ready/completed, payment or request messaging entities/screens/routes present in MVP.

## Release gates and unresolved decisions

Prototype: fictional data labeled, full responsive journeys reviewed, acceptance checks pass, real contact/notifications/live food disabled, AI budget defined and evaluation evidence recorded.

Live pilot: selected jurisdiction and actual platform/cook obligations resolved with applicable authorities/advisers; required registrations/credentials, user disclosures and policies approved; verification/contact consent/retention ready; support and incident playbook staffed; security, monitoring, backup restoration and rollback checked. Off-platform ordering does not itself establish regulatory exemption. Refer to dated legal research in the business plan; reconfirm before launch.

Remaining decisions: pilot area; eligibility/residence verification; exact external channels; signed-out browsing policy; field limits/image rules/currency; vendors and spending ceiling; guidance ownership; retention/deletion; insurance and accurate coverage disclosure; support coverage. These do not authorize transaction tracking. Future order/inventory/payment functionality requires a separate scope decision and PRD.

## Revision record

Version 1.4 supersedes PRD 1.3 transaction-related requirements and test numbering. Discovery and connection replace requests, inventory and fulfillment. Contact/order deadline filtering is required everywhere, including AI. Same-day cook commitment and one shared assistant remain; ready-time confirmation is removed. Business plan 1.5 and handoff 1.4 are the aligned companion versions.

# Neighborhood Kitchen Development Handoff

Version 1.6 | Working draft | 10 October 2026

Use business plan 1.5 and PRD 1.4 together. This handoff supersedes version 1.3 and its transaction/reservation implementation instructions. The MVP is a responsive discovery and connection web app. Cooks publish upcoming offers; neighbors contact them externally. The app tracks offers and deadlines, not orders or inventory.

## Source documents and precedence

- Neighborhood_Kitchen_Business_Plan.md: mission, positioning and pilot learning goals.
- Neighborhood_Kitchen_PRD.md: authoritative product behavior, scope, acceptance scenarios and release gates.
- This handoff: implementation sequence and initial coding prompt.

Founder decisions take precedence. Resolve conflicts before implementing affected behavior. Use one canonical Git repository with agreed branches if Codex and Replit both contribute. Keep one codebase.

## Explicit decisions before implementation

When any decision is required that is not explicitly resolved in the approved documents or my prior answers, ask me before implementing the affected work. Do not make assumptions, silently choose a proposed default, or treat a recommendation as approval. State the decision, explain its impact, present practical options and your recommendation, and wait for my explicit answer. If requirements conflict or are ambiguous, ask for clarification. Record each answer in the decision log. Continue independent work that does not depend on the pending decision; do not proceed with dependent work until I answer. Apply this rule to product behavior, design, architecture, vendors, costs, data/privacy policies and scope changes. Do not re-ask decisions I have already explicitly approved.

## Approved MVP boundary

Include one account for consumers and cooks, residential-only participation, cook eligibility review, ingredient and sourcing transparency, cook-set prices, advance publishing including next week, required Contact/order by deadline, same-day preparation commitment, external contact, reporting/moderation and one assistant with two contextual entry points.

Exclude carts, checkout, in-app orders, acceptance/decline, stock counts, reservations, inventory deductions, payment processing, delivery, order cancellation, ready/completed statuses, pickup confirmation, no-show tracking, buyer order history, order messages and transaction dashboards. Remove earlier MealRequest/Reservation/Thread designs and associated jobs. Do not add these to make the demo feel complete.

## Exact deadline behavior

- Cook chooses contact/order cutoff and pickup window separately. Cutoff must be future at publication and no later than pickup start.
- Example: contact by Tuesday 6 p.m.; pickup Thursday 5–7 p.m. Hide the offer at Tuesday 6 p.m., not Thursday.
- Use kitchen IANA timezone and UTC storage, explicit timezone labels and valid daylight-saving conversion.
- Shared server predicate: published, current cook/jurisdiction eligibility, not moderated/removed, filters match and server_now < cutoff.
- Apply predicate to browsing, search, assistant IDs and contact authorization. Recheck delayed AI responses and stale browser pages. Read-time filtering is required; an expiry job is unnecessary for correctness.
- Direct expired links display “Ordering deadline has passed” and disable ordering contact. Closed offers display closure. Reporting remains available.
- Cooks can close early or explicitly extend/reopen after validation; no automatic renewal. Keep revisions.
- Contact clicks measure interest, never orders or completion. A phone/email already copied or external app already opened cannot be revoked.

## User journeys and wireframes

Consumer: Discover → filter/assistant → offer detail and disclosures → confirm cutoff → open approved external contact → arrange availability, order, payment and pickup with cook outside platform.

Cook: same account → application/review → upcoming offer draft/manual or assistant → required disclosures, pickup, deadline and contact consent → unchecked preparation declaration → preview/publish → edit/close as needed.

First deliverable: clickable mobile and desktop wireframes with tablet adaptation, warm community styling and fictional data. Screens: Discover, offer detail, Profile, cook application, My cooking, editor, shared assistant and restricted operator views. Include expired links, missing fields, closure, suspended eligibility, no matches and model fallback. Review before server-backed implementation.

## Preparation and contact rules

Publication can happen a week ahead; preparation remains on pickup day. Confirm “I will prepare this meal on the day of pickup and will not freeze the completed meal.” Frozen ingredients can be disclosed. Derive preparation date from local pickup date; date edits clear declaration. Display cook-reported planned preparation and hot/chilled condition. No actual preparation confirmation or ready step. No platform printed-label mandate; applicable local rules still apply.

Show “Contact the cook to confirm availability and arrange your order outside Neighborhood Kitchen.” Proposed live default: signed-out discovery, authenticated contact, cook-approved email/phone route with consent. Validate channels and prevent unsafe links. Exact home addresses are shared outside the app. Changing an offer must remind cooks to communicate directly with any externally arranged customers; the app cannot identify those customers or notify them automatically.

## Technical starting point

Proposed: TypeScript responsive app, server API, managed authentication, relational database, restricted media/evidence storage, model integration and small vector index. Choose framework/vendors after checking environment, current capabilities and spending ceiling. Secrets stay in environment secret management, never prompts or source.

Schema: users/profiles, cook applications/credentials, neighborhoods/jurisdictions, offers/ingredients, offer revisions, consent, reports/audits, approved guidance/chunks and short assistant sessions. Optional contact-intent analytics require privacy approval. No transactional entities. Offer expiry is a query condition; jobs may support administrative reminders or guidance ingestion.

## Shared assistant and RAG

One assistant: Help me find a meal; Help me offer a meal. Wireframes simulate responses. Functional prototype uses a real model, bounded LangChain tools and real retrieval over fictional offers and approved sample guidance.

Tools: searchOffers, getOfferDetails, validateOfferDraft and retrieveGuidance. Meal facts use current cook-published data, not a document inventory or stock system. Return validated chips, current eligible IDs, missing-field questions, proposed drafts and guidance citations. Rehydrate cards and recheck cutoff before returning results. No writes, publication, orders, deadline extensions, credential approval or external messages by AI.

Corpus: approved participation, disclosure, preparation, deadline, external-contact, privacy and reporting help. Version/jurisdiction/effective-date filtering; withdraw obsolete text. Do not retain obsolete order/cancellation policies from previous scope. No private evidence, addresses, conversation data or internal plans as public guidance. Unknown allergens remain unknown; no allergy-safe or availability guarantees.

Set call/time/session/monthly usage limits before real-model tests. Retention must be approved before live use. At least 30 versioned evaluations; hard-constraint, authorization and cutoff compliance 100% in critical fixtures. Normal filters/forms remain fallback.

## Preparation and staged development sequence

Use the stage prompts below in order. The initial prompt is sufficient to begin; later prompts authorize the next stage only after its prerequisites are met. Do not paste all stage prompts as simultaneous authorization. All stages follow the explicit-decision rule above.

| Stage | Preparation | Work and deliverable | Gate before advancing |
| --- | --- | --- | --- |
| 1 Document review | Supply business plan 1.5, PRD 1.4 and this handoff; select a primary development workspace | Confirm versions/scope, identify conflicts, list only unresolved decisions needed for wireframes | Founder answers decisions that affect wireframes |
| 2 Wireframes | Approved design decisions and fictional examples; no database or AI credentials needed | Clickable mobile/desktop consumer and cook journeys, tablet adaptation, simulated assistant and cutoff/fallback states | Founder reviews and explicitly approves wireframes |
| 3 Technical design | Reviewed wireframes; founder provides budget ceiling and account/repository ownership | Propose framework, hosting, database, authentication, storage, model/embeddings and retrieval; list costs, required accounts, secrets and tradeoffs | Founder explicitly approves unresolved technical choices and costs |
| 4 Development setup | Approved stack; required service accounts and scoped workspace/repository access | One canonical repository, development environment, migrations, seed data, secret configuration, README and checks | Setup runs with fictional data; approved access/spending boundaries respected |
| 5 Functional core | Working development database/authentication; no model key needed yet | Shared account, cook application/review, offer drafts/disclosures, advance publishing, deadline filtering, edit/close, inert demo contact, reports/audits | Relevant PRD acceptance checks pass and core journey reviewed |
| 6 Real AI and RAG | Approved model and embedding access, call/budget limits, approved sample guidance and fictional offers | Bounded LangChain workflows, validated read tools, citations, current-offer filtering, fallbacks and ≥30 evaluation cases | Critical authorization/deadline/hard-constraint tests pass; report task success, latency and cost |
| 7 Prototype review | Core and assistant integrated | Run PRD T01–T18, responsive/accessibility checks and usability walkthrough; document gaps | Founder reviews prototype; real contact, participant notifications and live food remain disabled |
| 8 Live-pilot preparation | Jurisdiction, verification, contact/policies/privacy, operating coverage and production choices resolved | Prepare production release checklist, monitoring, recovery/rollback and support playbook | Separate explicit launch authorization and all PRD live gates met |

Prepare only what the current stage needs. Do not require production services, real personal data, live permits or paid AI access for clickable wireframes. The developer should guide account creation after stack approval, not ask the founder to provision unspecified services beforehand.

### Technical setup checklist

- Select Codex or Replit as the primary development workspace. If both contribute, use the same repository and agree branch ownership before changes.
- Supply the three current Markdown documents. Earlier versions are historical and cannot restore transaction scope.
- Establish one canonical repository before functional development; grant only required access.
- Approve a development spending ceiling and service/account ownership before paid services or model calls.
- Approve framework, hosting, database, authentication and storage before dependent implementation. These are proposals until confirmed; no vendor is committed.
- Configure model and embedding credentials only when real assistant testing begins. Store secrets in the chosen environment's secret settings, never in prompts, files, screenshots or Git. Ask for configuration, not disclosure of secret values in chat.
- Prepare a small approved demo guidance corpus. The developer can draft it for founder review; it must not be presented as approved live policy.
- Seed fictional cooks/offers with next-week pickup, earlier-day cutoff, expiry/closure, timezone boundaries, missing disclosures and stale credentials. No stock-count fixtures.
- A single approved database may support relational data and vector retrieval if suitable; a separate vector database is not mandatory. LangChain is an application dependency, not a requirement to buy an additional hosted service. Any optional paid tooling needs a decision.

### Repository deliverables

README with setup, environment variable names, migrations, seeding and tests; technical design and API/schema contracts; field-validation/offer-state rules; fictional seed data; PRD-linked backlog; evaluation harness; decision log; and AGENTS.md with commands, conventions and scope boundaries. No secret values. Track unresolved decisions with owner, question, options, recommendation, status and affected work; mark decisions approved only after the founder answers.

## Remaining decisions before live launch

Confirm jurisdiction/platform obligations, cook verification, contact channels/consent, public browsing, privacy/retention, insurance language, policies and support/incident coverage. Verify providers/costs, monitoring, rollback and backup restoration. Off-platform transactions do not prove exemption from food-platform obligations. Prototype can proceed with fictional data while these questions remain open.

## Staged prompts for Codex or Replit

Copy one prompt at a time. Keep the three documents attached or accessible in the workspace. Each prompt inherits the explicit-decision rule: ask about unresolved choices, explain options and recommendation, wait for the founder's answer before dependent work, and record decisions. Never treat silence or a proposed default as approval. Continue independent work and do not re-ask approved decisions.

### Prompt 1 — Read documents and prepare wireframes

Read Neighborhood Kitchen business plan 1.5, PRD 1.4 and development handoff 1.6 first. Confirm that the MVP is a responsive discovery and connection app: cooks publish advance offers; ordering, payment and pickup arrangements happen outside the app. Identify conflicts and only the unresolved decisions needed for wireframes, and ask me explicitly before implementing affected work. After my answers, create clickable fictional-data wireframes for mobile and desktop with tablet adaptation. Show complete consumer and cook journeys, structured disclosures, cook-set prices, separate Contact/order by and pickup dates, same-day cook commitment, external-contact explanation and one assistant with two contextual entry points. Simulate AI and make contact actions inert. Include expired/closed offers, missing fields, no matches and assistant fallback. Do not build orders, inventory, reservations, checkout or fulfillment states. No paid services, real AI credentials or database are needed at this stage. Present the wireframes for my review and wait for approval before functional development.

### Prompt 2 — Propose the technical setup

Using the approved wireframes and the three planning documents, propose the simplest functional-prototype architecture. First ask for any missing budget ceiling, workspace/repository ownership or technical preferences. Present framework, hosting, database, authentication, storage, model/embedding and retrieval choices with practical options, recommendation, checked capabilities, expected setup/recurring costs and required accounts/access. Distinguish required services from optional tools and note whether one database can support both application data and vector retrieval. Record unresolved choices and wait for my explicit answers before provisioning or implementing dependent work. Do not silently select vendors or sign up for paid tooling. Produce a technical design, setup checklist and implementation backlog linked to the PRD. Keep real food activity out of scope.

### Prompt 3 — Set up and implement the functional core

Proceed only with the approved technical choices and budget. Check prerequisites and ask me to configure missing access or secrets through the environment's secret settings; never ask me to paste keys into chat. Establish one canonical repository and development environment with README, migrations, fictional seeds, AGENTS.md and decision log. Implement reviewable slices: one account for consumers/cooks, cook application and operator review, offers/disclosures, publication at least a week ahead, required future contact/order deadline no later than pickup start, same-day declaration, editing/closure, discovery, inert demo contact and reporting/audits. Use the shared server deadline/eligibility predicate across browsing, search and contact, including cutoff equality, timezone validation and stale pages. No inventory, reservations, orders, payment, order messaging or completion tracking. Run relevant PRD checks and present the core walkthrough. Keep real contact, external participant notifications and live food activity disabled. Ask about every unresolved decision before dependent work.

### Prompt 4 — Add the real assistant and document retrieval

After the core and AI-provider/budget choices are approved, implement one bounded assistant with Help me find a meal and Help me offer a meal. Use real model and embedding access through server-side secrets, LangChain schema-validated workflows and approved sample guidance over fictional data. Tools are searchOffers, getOfferDetails, validateOfferDraft and retrieveGuidance; no autonomous writes or external messages. Current published offers supply stated meal facts, not stock guarantees. Recheck deadlines and eligibility before returning IDs; expired offers cannot remain actionable in delayed responses or historical cards. Draft only supplied facts, ask about omissions, and return to the normal editor for review/declaration/publication. Cite current approved applicable guidance; exclude private evidence and internal plans from public retrieval. Preserve forms/filters on failure. Create at least 30 versioned evaluations and report hard-constraint/deadline/authorization compliance, task success, latency and cost. Ask me to approve unresolved call limits, guidance, retention and spending decisions before affected tests or implementation.

### Prompt 5 — Verify the prototype and prepare the handoff

Run PRD T01–T18 and the AI evaluation suite against the integrated fictional-data prototype. Check consumer/cook journeys on mobile, tablet and desktop, keyboard access, authorization, disclosures, exact cutoff behavior, stale pages, direct expired links, delayed AI responses, prompt injection and model fallback. Confirm no transactional screens/entities/routes were added. Report passed checks, failures, usability gaps and remaining decisions; fix issues within approved scope and ask about changes requiring decisions. Provide reproducible setup/test instructions, final decision log and a reviewable demonstration. Keep real contact, external notifications and live food disabled. Do not launch a live pilot; prepare its separate prerequisites and ask for explicit launch authorization only when concrete release work and PRD live gates are ready for review.

## Revision record

Version 1.6 adds preparation requirements, stage-by-stage prerequisites and gates, and five copyable development prompts. Business plan 1.5 and PRD 1.4 remain the product-scope sources. Explicit founder decisions are required before unresolved dependent work; wireframes can begin without database or AI service setup.

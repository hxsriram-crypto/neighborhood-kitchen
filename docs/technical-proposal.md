# Neighborhood Kitchen — Technical Proposal

## Status

**Core stack selected by the founder. Not authorization to provision services, install packages, implement features, incur charges, or publish.**

The founder approved the mobile, tablet, and desktop wireframes and approved these assumptions for preparing this proposal:

- Reuse the existing TypeScript workspace and scaffolding.
- Keep one source of truth, using this Replit project as the working source unless an existing canonical repository is named.
- Make no new service-cost commitments before explicit approval.
- Build the functional core before enabling real AI.

The founder subsequently approved React/Vite, the existing Express API, development PostgreSQL/Drizzle, Replit-managed Clerk Auth, and Replit App Storage. This tool selection does not establish a numeric budget ceiling or authorize setup or implementation.

## 1. Recommendation

Build a responsive React + Vite web app from the approved wireframes, reuse the Express API and PostgreSQL/Drizzle tooling, and keep the functional prototype development-only with fictional records.

Use the approved Replit-managed Clerk Auth choice for independent Neighborhood Kitchen accounts after setup authorization. Use the approved Replit App Storage choice for persistent meal media and restricted application evidence, subject to a spending allowance and approved upload/privacy rules. Keep all contact actions inert and disable participant notifications and real food activity.

Do not add another hosting provider, database service, vector service, payment service, or messaging service to the core merely to make it feel complete.

### Checked starting point

- Existing API artifact: Express 5, TypeScript, Zod validation tooling, PostgreSQL driver, and Drizzle.
- Existing UI: React/Vite visual prototype in the mockup sandbox. It is not the functional web app.
- Existing shared libraries: API specification/code generation, typed client, validation, and database package.
- No Neighborhood Kitchen database tables are implemented in the template schema.
- Registered artifacts are API and Canvas, not a deployable consumer web app. A web artifact is needed during approved implementation.
- No Clerk setup is currently configured. No authentication provisioning was performed.
- The repository reports a managed backup remote, not a founder-named external canonical repository. This proposal does not create a GitHub repository or change remotes.

### Proposed architecture

```text
Responsive web app
  ├─ React/Vite UI based on approved wireframes
  ├─ public browsing; one identity with consumer/cook capabilities
  └─ typed API calls
        │
        ▼
Express API
  ├─ authentication and server-side authorization
  ├─ shared offer eligibility/deadline predicate
  ├─ disclosure, publication, consent and report validation
  ├─ PostgreSQL + Drizzle: application records and audit/revision metadata
  └─ App Storage: files, with authorization before upload/access

Later assistant stage, after separate approval:
Express → bounded LangChain workflow → approved model/embeddings
                              ├─ current eligible offers from PostgreSQL
                              └─ approved sample guidance retrieval
```

Prefer one public web origin and platform-managed routing instead of a second hosting provider. Preserve the workspace's frontend/API separation during development. Final production service configuration must be checked before any publishing decision; it is not created by this proposal.

## 2. Choices, alternatives, and access

| Area | Recommendation | Practical alternative and tradeoff | Required access / gate |
| --- | --- | --- | --- |
| Frontend | React + Vite + TypeScript, using the approved UI as source | A framework rewrite adds migration work without a demonstrated prototype need | Approval to create a functional web artifact; no framework subscription |
| API and contracts | Reuse Express, shared Zod schemas, and generated typed API client | A new backend framework would duplicate existing scaffolding | Approval of architecture before API implementation |
| Database | Replit development PostgreSQL with Drizzle migrations and fictional seeds | External managed PostgreSQL can be compared if publishing costs or ownership require it; do not replace a configured database without approval | Database setup permission; confirm owner access; no production database now |
| Authentication | Replit-managed Clerk Auth; app-specific accounts rather than requiring neighbors to have Replit accounts | Replit Auth uses Replit accounts/branded login. External identity management adds account/configuration responsibilities | Approve provider, test sign-in methods, and any test verification-email delivery. No external Clerk account is needed for the managed tenant |
| Files | Replit App Storage; meal media and private evidence have separate application access rules | Another object-storage provider adds credentials and setup; local project files are not a durable substitute for user uploads | Approve storage charges, file types/size limits, authorization, and retention before enabling uploads |
| Hosting | Development preview first; evaluate Replit Autoscale when publishing is explicitly requested | Reserved/always-on infrastructure is unnecessary without an approved background-work requirement | Separate publishing authorization, cost review, and deployment configuration |
| Assistant | Scripted helper during the core; real AI is a later required stage of the full functional prototype | Direct provider credentials are possible, but add account/secret management | Exact model, embedding access, call limits, guidance, and spending ceiling must be approved before paid calls |
| Retrieval | First evaluate whether the selected PostgreSQL service can also hold the small guidance vector index | A separate managed vector service is an option only if needed and cost-approved | Replit documentation searches did not establish pgvector availability; verify it before choosing the index. Do not assume support or create an extension/service now |

Clerk Auth currently supports independent app accounts and separate development/production user stores. Published documentation lists email/password and supported social sign-in, not SMS/phone sign-in. Phone contact in this prototype is an external-contact concept, not a proposed phone-login mechanism.

App Storage buckets are private; the application must enforce access. Private cook evidence must never use an unconditionally public serving route or enter the assistant corpus. Upload templates must be adapted to the approved authentication identity and tested for owner/operator authorization rather than blindly relying on a different provider's middleware.

One PostgreSQL database can hold application records, approved guidance, versions, and chunk metadata. Using that same service for semantic vector retrieval is **conditional on verified extension/capability support**. No second database is recommended for the core.

## 3. Cost picture

These are published USD rates and cost models, not a quote or founder-approved budget. Rates, credits, and billing policies must be rechecked before use. Replit membership, Agent development activity, taxes, and existing account usage are not included in the infrastructure examples below.

| Item | Setup / recurring cost basis | Decision for this proposal |
| --- | --- | --- |
| Framework/API libraries | No separate framework-service subscription proposed | Reuse existing tooling; no installs now |
| Development PostgreSQL | Official documentation says development databases are included free with every Replit App | Recommended for the fictional core, after setup approval |
| Replit-managed Clerk Auth | Documentation currently says free, no MAU limit; future usage-based pricing is planned | Recommended provider, not provisioned |
| App Storage | $0.015/GiB-month stored; $0.05/GiB outbound transfer; $0.0004/1,000 basic operations; $0.005/1,000 advanced operations | Charges can apply while developing; needs explicit allowance |
| Autoscale publishing | $1/month base per deployment, plus $0.60/million compute units and $0.40/million requests | Deferred; not an all-in monthly estimate |
| Production PostgreSQL | $0.16 per active compute-hour + $0.35/GiB-month stored | Deferred. At 730 active hours, compute alone would be $116.80/month; actual active hours depend on usage |
| Real AI | Replit AI Integrations charge provider public API prices against Replit credits | $0 real-model calls in the core stage; later exact models/limits require approval |
| Separate vector service, domain, monitoring vendor | Not selected; would require additional cost/access checks | Not required for the core |

### Recommended spending policy

- Planning: no new spending or provisioning.
- Core: development-only database/authentication and fictional test accounts; no production database, publishing, or real-model traffic.
- Storage: obtain an explicit additional-service ceiling before uploads. A small example such as 1 GiB stored and 1 GiB outbound costs $0.065 for those two line items, **excluding operations and other account usage**. It is an illustration, not a monthly forecast.
- Publishing and AI: separate costed approvals after the core walkthrough.

The founder confirmed control of the workspace and billing. The numeric spending ceiling remains unresolved. Credits are a payment source, not a reason to treat usage as free.

A spending allowance agreed in chat is not automatically a configured billing limit. Replit provides usage alerts and a service shutdown limit under account Usage settings. The shutdown limit suspends usage-based services at the account threshold, but metering delays or work already in progress may cause a small overshoot. Account-wide controls may affect other projects/services; obtain explicit approval before changing them. See [Managing Your Spend](https://docs.replit.com/billing/managing-spend).

## 4. Core design boundaries

- One identity supports both consumer and cook use; eligibility and operator authority are server-side permissions.
- Cooks independently set prices. Offer portion descriptions are not inventory counts.
- Store deadline instants in UTC and a kitchen IANA timezone; use explicit local-time labels.
- A shared server predicate gates browse, search, detail actionability, contact, and later AI IDs: published + eligible cook/jurisdiction + not moderated + server time strictly before cutoff.
- Validate a future cutoff no later than pickup start; separate pickup date/window from cutoff. At cutoff equality, the offer is expired.
- Direct expired/closed links retain their defined explanatory states and reporting.
- Publish/edit requires structured disclosures and the unchecked same-day preparation declaration. Pickup-date changes clear that declaration.
- Unknown allergens, sourcing, and organic status stay unknown. No verified-health or allergy-safe claims.
- Record edits, closure/reopening, consent, reports, and operator decisions with appropriate audit metadata.
- Exact addresses and external order/payment conversations are outside the app.
- No carts, orders, reservations, stock, inventory, checkout, payments, order messages, completion tracking, or buyer order history.
- Real contact, participant notifications, and food activity remain disabled.

## 5. Setup checklist — after dependent decisions are approved

1. Confirm canonical code ownership, workspace permissions, service choices, and numeric spending ceiling.
2. Resolve prototype-only timezone, upload limits, evidence access/retention, sign-in/test-email settings, and operator access rules before affected work.
3. Create/register the functional web artifact and adapt approved UI into focused components. Keep Canvas as the design reference.
4. Configure approved development authentication and owner-controlled test identities.
5. Configure the approved development database; write reviewable migrations and fictional seeds.
6. Configure storage only after billing/limits/privacy approval; protect upload and file-access endpoints and validate file metadata.
7. Define API contracts, generate typed clients, and implement the shared server predicate and validation.
8. Verify the fictional core with the mapped PRD checks; present a walkthrough.
9. Only then seek the separate real-assistant choices and usage/guidance approval.

No service account signup, secret request, schema migration, package installation, deployment, or paid model call was performed while preparing this proposal.

## 6. Implementation backlog linked to the PRD

| Reviewable slice | Deliverable | PRD acceptance coverage |
| --- | --- | --- |
| Account and cook eligibility | Single identity, application/review, server authorization, protected evidence access | T01, T02 |
| Offer editor and disclosures | Advance drafts/publication, structured ingredients/allergens, cook prices, portion description, preparation declaration | T03, T09, T12 |
| Deadline and lifecycle | Cutoff/window validation, UTC/IANA conversion, DST checks, revisions, explicit close/reopen, stale-page enforcement | T04–T08, T11 |
| Discovery and contact explanation | Eligible fictional offers, filters/details, authenticated but inert demo contact, cutoff copy on all core layouts | T05, T06, T10 |
| Reporting and operator actions | Reports without an order ID, restricted operator review, auditable suspensions | T17 |
| Assistant — later stage | Real bounded model, approved-guidance retrieval, current eligible offer rehydration, draft-only tools, normal-form fallback | T13–T16; handoff's minimum 30 versioned AI evaluations |
| Cross-cutting verification | Responsive/keyboard usability, unauthorized access checks, no transactional entities/routes/screens | T01, T02, T18 |

## 7. Decisions still needed

1. Core framework/database/auth/storage choices are approved. Resolve the remaining prerequisites and obtain setup authorization; tool selection alone does not authorize provisioning.
2. Set the additional-service spending ceiling. Workspace/billing control is confirmed; this Replit project remains the working source under the approved assumptions. Confirm any additional repository/access requirements before affected setup.
3. Choose the fictional core's timezone, upload limits/form limits, test sign-in delivery, evidence retention, and operator access before dependent implementation.
4. Before assistant work: exact model/embedding/index choice, verified vector capability, approved sample guidance, and call/time/session/monthly limits.
5. Before any real pilot: separate jurisdiction, eligibility/legal/privacy/insurance/support decisions and explicit launch authorization.

## Sources

- [PRD v1.4](../.local/conversation-workspace/files/attached_assets/Neighborhood_Kitchen_PRD_v1.4_1791685354745.md)
- [Development Handoff v1.6](../.local/conversation-workspace/files/attached_assets/Neighborhood_Kitchen_Development_Handoff_v1.6_1791685354745.md), especially Prompt 2 and the staged gates
- [Business Plan v1.5](../.local/conversation-workspace/files/attached_assets/Neighborhood_Kitchen_Business_Plan_v1.5_1791685354736.md)
- [Decision log](decision-log.md)
- [Replit cloud pricing updates, August 2026](https://docs.replit.com/billing/aug-cloud-billing-updates)
- [Development and production databases](https://docs.replit.com/features/data-and-storage/development-and-production)
- [Clerk Auth](https://docs.replit.com/features/auth-and-identity/clerk-auth)
- [App Storage](https://docs.replit.com/features/data-and-storage/object-storage)
- [Replit AI Integrations](https://docs.replit.com/features/integrations/replit-ai-integrations)

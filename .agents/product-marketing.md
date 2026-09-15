# Jobsite Finder — Product Marketing Context

**Document version:** v1.0
**Last updated:** 2026-09-14
**Status:** Founder approved
**Purpose:** Master reference for positioning, copy, outreach and marketing planning.

## 1. Authority and usage

Founder-confirmed decisions in this document take precedence over conflicting repository copy and earlier business documentation.

Distinguish between:

- **Confirmed product policy:** Approved company facts, product direction and business rules.
- **Present in code:** An implementation exists, but may be incomplete, disabled or untested.
- **Tested beta capability:** End-to-end testing has confirmed the capability works within the approved beta scope.
- **Planned functionality:** Intended behaviour that is not yet confirmed operational.
- **Unresolved:** A decision or claim requiring further approval, design or evidence.

The repository review establishes implementation findings, not production reliability or beta readiness.

Invitations, messaging, payments, public profiles and new-jobsite creation must not be described as operational until end-to-end testing confirms them.

Approval of this context does not authorize application changes or public advertising of offers with unresolved launch conditions.

## 2. Company and product overview

**Company:** Jobsite Finder Technologies Inc.
**Website:** jobsitefinder.ca
**Founder and CEO:** Joseph W. Smith
**Tagline:** “Built for the Trades. Powered by Real Jobsites.”
**Initial market:** Canada
**Planned expansion:** United States
**Stage:** Preparing for closed beta.

**Company background**

Jobsite Finder Technologies Inc. is Indigenous-owned and founded by Joseph W. Smith, a Carcross/Tagish First Nation citizen. Joseph has approximately ten years of commercial plumbing and construction-industry experience.

These facts are approved for company-background use. Indigenous ownership is not the primary value proposition unless a specific audience or assignment calls for that emphasis.

**One-line description**

Jobsite Finder is a map-based construction employment and contractor platform that connects workers, general contractors and subcontractors through real active jobsites.

**What it does**

The active jobsite is the organizing centre of Jobsite Finder. Workers discover projects, explore available jobs and apply to the contractors hiring there. General contractors and subcontractors recruit for their own work while participating on the same project page.

**Core journey**

Discover → Project → Job → Apply.

**Category:** Construction employment and contractor platform.

**Product type:** A platform connecting workers and contractor companies, with paid contractor hiring tools.

**Primary value:** Contractors recruit workers in the context of where construction is actually happening.

**Secondary mission:** Improve access to construction opportunities for Indigenous workers, newcomers and other tradespeople. The platform serves the broader construction workforce and is not restricted to these groups.

**Proposed public description appropriate to the current stage**

> Jobsite Finder is preparing a closed beta for Canadian construction contractors and workers. The platform is being built around real active jobsites, helping workers discover projects and job opportunities while general contractors and subcontractors recruit for the work happening there.

## 3. Product model and participant roles

### Workers

Workers use Jobsite Finder free.

The confirmed product direction allows workers to:

- Create profiles and resumes.
- Discover active projects and available jobs.
- Search and filter opportunities.
- Apply to specific job postings.

Workers cannot initiate unsolicited direct messages to contractors. Once a contractor initiates contact, both parties can reply.

**Availability qualification:** Profile creation, resume uploads and applications have implementations. A dedicated resume builder and in-app messaging were not found in the reviewed application. Messaging remains planned until implemented and tested.

### General contractors

For the MVP, a GC creates or claims the main project/jobsite.

GCs can establish company profiles, manage their jobsites, post jobs and hire workers. A GC can invite subcontractors to participate on the same jobsite.

These are confirmed product responsibilities. New-jobsite creation and invitations must not be advertised as operational until end-to-end testing confirms them.

### Subcontractors

A subcontractor joins a jobsite by GC invitation or requests participation.

A participating subcontractor controls its own:

- Company information.
- Job postings.
- Applications.
- Hiring decisions.

A subcontractor does not control the GC’s main project record and cannot create a main project as a subcontractor during the MVP.

If a company acts as the prime/general contractor on another project, it must use the appropriate GC authority for that project. Do not promise that the current application already supports every required authority transition.

### Shared jobsite

The GC and its subcontractors operate around the same project page and can recruit from workers interested in that jobsite.

Each contractor hires independently. Each contractor company also pays independently for hiring access on each active jobsite.

A shared project page does not create shared access to private hiring records.

## 4. Active jobsites and map integrity

The MVP map displays **active construction jobsites only**, with valid locations.

Upcoming, completed, cancelled and otherwise inactive projects must not appear as active map listings.

There is **no approved minimum project-value requirement**. A $5-million threshold is not part of the approved product definition.

A map listing does not mean:

- The contractor has joined the platform.
- The contractor has endorsed the platform.
- The project has been claimed.
- The project is currently hiring.
- The project, contractor or claim has been verified.

Do not call listings, contractors or claims “verified” until a documented verification standard is implemented.

**Billing principle**

An active jobsite stops being billable for a contractor when that contractor marks it completed or inactive, subject to anti-abuse and billing rules that still need to be designed.

The exact definition of inactivity, enforcement process, billing treatment and relationship between contractor-specific status and the shared project’s status remain unresolved.

## 5. Data and privacy

Each hiring company sees applications submitted to its own job postings.

Participating companies do not automatically see one another’s private:

- Applications.
- Resumes.
- Messages.
- Notes.
- Hiring decisions.

“Shared worker pool” means workers can discover and apply to opportunities from multiple contractors on the same jobsite. It does not mean companies receive unrestricted access to a shared applicant database.

These are confirmed access requirements. Marketing must not present them as independently validated security guarantees without appropriate testing.

Existing records must not be deleted solely because a trial or subscription ended. Precise read-only access and reactivation rules still require product and security confirmation.

## 6. Target audience and use cases

**Initial contractor audience**

Selected Canadian GCs and subcontractors associated with projects already represented on the map.

The closed beta is Canada-wide in product scope. Initial onboarding may occur in smaller geographic groups to keep support manageable.

Canada-wide scope does not establish nationwide project coverage, worker availability or participating-contractor density.

There is no approved company-size pricing segmentation or minimum project-value requirement.

**Worker audience**

Tradespeople seeking construction work in Canada, including Indigenous workers, newcomers and other workers who can benefit from clearer access to jobsite-specific opportunities.

**Likely contractor decision-makers — research hypotheses**

Company owners, operations managers, project managers and people responsible for recruitment. The person managing a project may differ from the person approving payment.

**Jobs to be done**

- Help workers understand where a job is located, which company is hiring and what the role requires.
- Help GCs recruit for a specific jobsite and establish subcontractor participation.
- Help subcontractors recruit their own crews for work on an existing project.

**Example scenarios**

- A worker finds an active project in a preferred location and applies to a relevant opening.
- A GC establishes or claims its project relationship and posts jobs after activating hiring tools.
- A subcontractor joins an approved project and activates its own hiring access to recruit for its trade package.

These scenarios describe the intended product model. Availability must follow the readiness assessment below.

## 7. Personas

Buying roles and motivations below are hypotheses to validate during beta.

| Persona | Cares about | Challenge | Intended value |
|---|---|---|---|
| GC owner or operations lead — decision-maker | Staffing projects and controlling hiring costs | Recruiting across jobsites | Hiring organized by active jobsite |
| Project manager or superintendent — champion | Getting required trades onto the project | Explaining site needs and coordinating participation | Shared project context |
| Subcontractor owner or hiring lead — user and buyer | Finding workers for its own scope | Recruiting within a larger project | Independent hiring on the shared project |
| Hiring administrator — daily user | Clear applications and manageable follow-up | Keeping jobs and applicants organized | Company-specific hiring workflows |
| Finance approver — financial buyer | Predictable charges | Understanding costs across companies and jobsites | The same clear price and allowance for GCs and subcontractors |
| IT or privacy reviewer — possible influencer | Appropriate access to worker information | Assessing permissions and resume handling | Demonstrable company-specific access controls |
| Worker — user | Relevant work, location and employer clarity | Finding suitable opportunities | Free discovery and applications tied to real jobsites |

## 8. Problems and pain points

**Core problem hypothesis**

Construction hiring can lose important context when an opportunity is separated from the actual project, its location and the contractors doing the work.

**Pain points to validate**

- Workers spend time determining where work is happening and who is hiring.
- Contractors repeatedly explain project details through separate hiring channels.
- GCs and subcontractors recruit for the same physical jobsite through disconnected processes.
- Variable recruiting charges can make costs harder to anticipate.

**Potential consequences**

Administrative effort, less relevant applications and difficulty filling project staffing needs.

These are hypotheses, not measured Jobsite Finder outcomes. No supported cost savings, hiring-speed improvements or conversion results are available for marketing in this context.

**Emotional concerns to explore**

Contractors may worry about staffing commitments. Workers may worry about whether opportunities are current, relevant and credible. Customer interviews must establish the importance of these concerns and the language people use.

## 9. Competitive landscape

No verified competitor comparison has been completed for this context.

| Alternative | Relationship to Jobsite Finder | Question to validate |
|---|---|---|
| Construction employment platforms and job boards | Direct alternatives for discovering and advertising construction jobs | How do they connect opportunities to a shared physical jobsite? |
| General job boards, staffing agencies and company careers pages | Other ways to fill construction roles | What do customers value or find difficult about each? |
| Referrals, personal networks and social groups | Established recruiting approaches | When do they work well, and when do contractors need another channel? |

Do not claim competitors lack specific capabilities or charge particular fees without current evidence.

## 10. Differentiation and positioning

**Distinctive product approach**

- Discovery begins with the active jobsite.
- Projects connect location, participating contractors and jobs.
- GCs and subcontractors recruit independently on the same project.
- Workers participate free.
- Contractor company profiles remain free.
- GCs and subcontractors receive the same pricing and core hiring-tool allowance.
- Each company pays for its own hiring access on each active jobsite.

**Why this matters**

Jobsite Finder puts project and location context alongside the hiring opportunity. Workers can understand the worksite, while contractors recruit for the work they are delivering there.

**Positioning statement**

For Canadian construction contractors recruiting for active projects, Jobsite Finder organizes hiring around the real jobsite, bringing project information, participating companies and job opportunities together.

**Reasons customers choose us**

Not yet established through customer evidence. The points above are positioning propositions to test during beta, not proven reasons for purchase.

## 11. Business model, pricing and trial

### Currency and free access

All prices are in Canadian dollars unless explicitly stated otherwise.

Workers are always free. Contractor company profiles remain free.

### Standard contractor pricing

**$99 CAD per active jobsite per month for each contractor company using hiring tools.**

GCs and subcontractors receive the same pricing and the same core hiring-tool allowance.

Each paid jobsite includes unlimited job postings, applications and hires **for the subscribing contractor company**.

A GC subscription does not automatically pay for its subcontractors. Each participating contractor that uses hiring tools needs its own hiring access for that jobsite.

There are no per-click, per-application or per-hire charges.

Do not create Basic, Pro, Enterprise or company-size pricing tiers.

### Founding-member offer

**$999 CAD per active jobsite for the contractor’s first paid year.**

The offer amount and billing unit are confirmed. Final launch-date, eligibility and deadline rules are required before public advertising.

Do not invent renewal terms, eligibility limits, deadlines or scarcity claims.

### Trial

New contractors receive 30 days of hiring tools free.

The trial begins when a contractor activates hiring tools for its **first jobsite**, not when it creates a free company profile.

Do not require a payment method to begin the closed-beta trial unless later approved.

Do not describe this as a fresh 30-day trial for every additional jobsite. The treatment of additional jobsites during the initial trial needs to be specified before making promises about that behaviour.

### After the trial or subscription ends

- The company profile remains free.
- Paid hiring actions are disabled when the contractor does not subscribe.
- Existing records must not be deleted solely because the trial or subscription ended.
- Precise read-only access and reactivation rules require product and security confirmation.

### Jobsite billing status

A contractor’s active jobsite stops being billable when the contractor marks it completed or inactive, subject to anti-abuse and billing rules still to be designed.

Do not promise immediate refunds, prorated credits or particular cancellation effects before those terms are approved.

### Implementation qualification

No operational checkout, trial enforcement or billing entitlement implementation was found in the reviewed application. The policies above are approved requirements, not evidence that payment flows are ready.

## 12. Beta strategy and goals

**Current stage:** Preparing for closed beta.

**Product scope:** Canada-wide.

**Onboarding approach:** Smaller geographic groups may be used to keep support manageable. The initial sequence by province remains unresolved.

Selected contractors associated with mapped projects will be invited to establish or claim their proper project relationship:

- GCs establish or claim the main project.
- Subcontractors join through invitation or request participation.

A contractor’s appearance in project information does not imply participation or endorsement.

**Primary business goal**

Validate useful, dependable hiring journeys around real active jobsites before broader release.

**Conversion actions**

- Public preparation stage: Express interest through the waitlist.
- Selected-contractor onboarding: Accept a beta invitation and establish the proper company and project relationship.
- Contractor activation: Activate hiring tools and publish a valid job.
- Worker activation: Complete a relevant application.

A waitlist submission is not an account, an accepted beta invitation or an activated trial.

**Proposed beta measures**

Track invited companies, accepted participants, approved project relationships, hiring-tool activation, published jobs, completed applications and confirmed hiring outcomes.

Evaluate activity by jobsite and contractor company. Instrumentation, baselines and targets remain to be established.

Do not promise a specific worker supply, hiring outcome or number of active participating contractors.

**Expansion**

United States expansion is planned. Do not advertise US availability or a launch date.

## 13. Objections and switching dynamics

These are anticipated objections, not recorded sales conversations.

| Anticipated objection | Credible response |
|---|---|
| “We already use referrals and job boards.” | Jobsite Finder adds project and location context to recruiting. Beta participation can test whether that is useful for your work. |
| “Are there enough workers near our jobsite?” | Worker availability must be established during beta. No applicant volume or hiring outcome is promised. |
| “Does the GC’s subscription cover us?” | Each contractor company pays for its own hiring access on each active jobsite. GCs and subcontractors receive the same price and core allowance. |
| “What will hiring cost?” | Hiring access is $99 CAD per active jobsite per month for your company, with unlimited job postings, applications and hires for that jobsite. |
| “Will another contractor see our applicants?” | Each company sees applications to its own jobs. Shared project participation does not grant access to another company’s private hiring records. |
| “What happens when the trial ends?” | Your company profile remains free. Without a subscription, paid hiring actions are disabled. Records are not deleted solely because access ended; detailed read-only rules are still being finalized. |

**Poor-fit use cases**

Unsolicited worker messaging to contractors, guaranteed staffing requests, unrelated non-construction listings, or expectations of a fully launched international service.

**Switching forces — hypotheses**

- **Push:** Recruiting without clear project context and fragmented processes.
- **Pull:** Jobs organized around real construction locations and clear company-specific pricing.
- **Habit:** Familiar referrals, existing job boards and internal processes.
- **Anxiety:** Worker availability, setup effort, privacy, data accuracy and beta reliability.

## 14. Customer language and brand voice

**Verbatim customer language:** Not yet supplied or validated. Do not invent customer quotes.

**Words and phrases to use**

Active jobsite, project, trade, worker, general contractor, subcontractor, company profile, job opening, application, hiring tools, Canadian construction, selected beta participants.

**Words and claims to avoid**

Revolutionary, game-changing, seamless, guaranteed hires, instant hiring, best, largest, nationwide coverage, real-time data, verified companies or AI-powered matching without evidence.

Do not describe project listings or approved claims as “verified” before a documented standard is implemented.

Avoid language suggesting workers can cold-message contractors.

**Glossary**

| Term | Meaning |
|---|---|
| Jobsite | The physical construction site around which discovery and hiring are organized |
| Project page | The shared place for project information, participating contractors and jobs |
| Job | A specific opportunity posted by a hiring company |
| GC claim | A request to establish the GC’s authorized relationship with an existing main project |
| Participation | A subcontractor’s approved involvement in a jobsite |
| Active jobsite | A site with current construction activity; detailed status and billing enforcement remain to be finalized |
| Shared worker pool | Workers interested in jobs at the same site, without automatic sharing of private hiring records |
| Hiring access | A contractor company’s access to paid hiring tools for a particular active jobsite |
| Free company profile | Company information that remains free independently of paid hiring access |

**Tone:** Professional, direct, credible and construction-industry focused.

**Style:** Plain language and concrete descriptions. State what users can do and qualify availability accurately.

**Personality:** Practical, grounded, respectful and dependable.

**Approved tagline**

“Built for the Trades. Powered by Real Jobsites.”

**Proposed messaging examples**

- Contractor: “Recruit for the work happening on your jobsite.”
- Worker: “Find construction opportunities by jobsite.”
- Shared project: “One project page. Each contractor hires for its own work.”
- Pricing: “$99 CAD per active jobsite, per month, for your company. Unlimited job postings, applications and hires.”

These are proposed copy, not testimonials. Use feature and pricing copy only in a context that accurately explains availability.

## 15. Product readiness

| Capability | Repository finding | Marketing treatment |
|---|---|---|
| Map discovery and project pages | Implementations exist, including search and filters | Confirm active-only eligibility, valid locations and freshness before making availability claims |
| Worker profiles and resumes | Profile editing and resume uploads exist | Do not advertise a dedicated resume builder |
| Project-linked jobs and applications | Posting, application and applicant-management code exists | Validate the complete journey before calling it beta-ready |
| Company profiles | GC and subcontractor editing flows exist | Distinguish account editing from public profile availability |
| GC claims and subcontractor participation | Claim, approval and participation code exists | Test the approved authority and privacy model |
| GC invitations to subcontractors | Partial implementation; one project-prefixed path returns an invitation result without persisting it | Not operational until end-to-end testing confirms it |
| New-jobsite creation | Creation code exists, but the creation route leads to under-construction | Not operational until the GC flow is enabled and tested |
| Contractor-initiated messaging | No in-app implementation found | Planned functionality |
| Payments, trial enforcement and paid access | No implementation found in the reviewed app | Approved business policy awaiting implementation and testing |
| Public worker and company profiles | Public routes lead to under-construction | Not operational |
| Notifications, saved jobs, talent pool and advanced candidate pipeline | Hidden, disabled or incomplete in current launch configuration | Exclude from current availability claims |
| Real-time project updates | No supporting live-update implementation found in the reviewed map flow | Do not promise real-time data |
| Waitlist | Submission flow exists | Describe as an expression of interest; confirm delivery before claiming reliability |

Basic applicant status management exists in code. That does not establish readiness of the fuller planned candidate pipeline.

**Tested beta capability:** This context does not certify any feature as tested. The final beta-readiness feature list remains unresolved.

## 16. Repository conflicts and outdated messaging

These findings identify future correction needs. No application changes are authorized by this document.

| Repository conflict | Approved direction |
|---|---|
| Architecture specifies $99.99 monthly and $999.99 annually | Standard price is $99 CAD monthly per active jobsite per contractor; founding offer is $999 CAD for that contractor’s first paid year per active jobsite |
| Legacy pricing page describes Basic, Pro and Enterprise packages | No tiers or company-size pricing |
| Pricing can imply shared or ambiguous jobsite coverage | Each contractor company pays independently; a GC does not automatically cover subcontractors |
| Under-construction page advertises the founding offer | Hold public advertising until launch-date, eligibility and deadline rules are finalized |
| FAQ, metadata and legal copy describe an available or free beta | Product is preparing for closed beta; distinguish free profiles from the hiring-tool trial |
| Trial wording may be read as beginning at signup | Trial begins on first-jobsite hiring-tool activation |
| README and map documentation include upcoming projects | MVP map is active construction jobsites only |
| Copy and eligibility logic emphasize projects worth $5 million or more | No approved minimum project value |
| FAQ suggests new jobsites can already be created | Do not advertise creation until the GC journey passes end-to-end testing |
| Claim wording can imply subcontractor control of the main project | Subcontractors participate and manage only their own company and hiring records |
| FAQ and badges imply verification | Do not use “verified” until a documented standard is implemented |
| Initial signup metadata does not carry the selected role | Validate onboarding and project-specific authority before claiming readiness |
| Subcontractor routes exist while the subcontractor launch flag is disabled | Resolve against the final beta-readiness list |
| Founder copy says more than ten years of experience | Use the approved wording: approximately ten years of commercial plumbing and construction-industry experience |
| Contact/FAQ promise responses within 24–48 hours | Remove from approved messaging until support capacity is established |
| Copy promises real-time updates or broad national coverage | Canada-wide product scope is confirmed; coverage and real-time data claims require evidence |

## 17. Decisions still unresolved

The following remain open:

1. **Founding-member rules:** Exact eligibility, launch date and deadline.
2. **Cancellation and refunds:** Subscription cancellation, refunds and related billing treatment.
3. **Post-subscription access:** Precise read-only permissions and reactivation behaviour, subject to product and security confirmation.
4. **Inactive jobsites:** Exact definition, enforcement, anti-abuse rules and billing effects.
5. **Verification:** Documented standards and badge meanings.
6. **Beta readiness:** Final feature list and end-to-end acceptance evidence.
7. **Geographic onboarding:** Initial sequence by province.

Supporting implementation details must also be specified where needed, including additional-jobsite treatment during the initial trial and how a company receives the appropriate GC authority on a different project.

Audience motivations, buying roles and competitive positioning remain research hypotheses rather than founder-confirmed customer findings.

## 18. Proof points and evidence requirements

**Approved company-background facts**

- Jobsite Finder Technologies Inc.
- Indigenous-owned.
- Founded by Joseph W. Smith, a Carcross/Tagish First Nation citizen.
- Approximately ten years of commercial plumbing and construction-industry experience.

**Approved product and commercial foundations**

The jobsite-centred model, participant responsibilities, company-specific privacy rules, Canadian scope, pricing and trial policies recorded above.

These policies do not establish operational readiness.

**Not currently established for marketing**

- Customer or active-user counts.
- Successful hires or application volumes.
- Time-to-hire improvements or cost reductions.
- Testimonials or permission to use customer logos.
- Nationwide project coverage.
- Consistently current or real-time project data.
- Contractor, project or claim verification.
- Measured outcomes for Indigenous workers or newcomers.
- A supported customer-service response-time commitment.

| Claim or value theme | Evidence required |
|---|---|
| Active jobsites with valid locations | Source provenance, recent status checks and location-quality review |
| Shared GC/subcontractor hiring | Tested participation, authority, posting and permissions workflows |
| Company-specific privacy | End-to-end access-control testing |
| Operational pricing and trials | Tested activation, billing and entitlement behaviour |
| Faster or less expensive hiring | Defined measurements and credible comparisons |
| Verified listings, companies or claims | An implemented verification standard and supporting records |
| Inclusive employment impact | Measured outcomes and permission for personal stories |
| Security or compliance assurances | Appropriate review supporting each specific claim |

Do not treat mapped projects, preview graphics, synthetic data or planned architecture as customer traction.

## 19. Changelog

- **v1.0 — Founder approved on 2026-09-14:** Incorporated founder decisions on CAD pricing, independent contractor billing, trial activation, active-only map scope, GC/subcontractor authority, private hiring records, company background and Canada-wide beta scope. Preserved unresolved launch, billing, access, verification and readiness decisions.

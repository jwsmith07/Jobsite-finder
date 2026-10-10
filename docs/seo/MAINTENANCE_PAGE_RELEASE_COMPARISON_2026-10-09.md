# Maintenance page: production versus final candidate

> Current founder decision: restore the original Scrimba video, including narration/slides, with its direct link and tested fallback/retry. Earlier withholding sections below are historical; the permanent website-copy/product-development exclusion remains. See the final release review for current results.

Updated 2026-10-09. Base: production 57d65d841ab08a1f6dac4641b3490aa790c8f67b. This replaces the previous preview-image proposal. No publication approval is implied.

[Desktop/mobile visual comparison](../../.release-review/final-release/visuals/comparison.html). Actual public production and local candidate Chromium screenshots cover hero, overview and feature cards. Review artifacts are excluded from the release index. External fonts, video and analytics were blocked equally; no backend writes were permitted.

| Area | Production | Final candidate | Decision |
| --- | --- | --- | --- |
| Branding | Existing logo, approved tagline, dark backgrounds and amber accents | Retained | No new branding or theme |
| Status | Large UNDER CONSTRUCTION badge with emoji; broad coming-soon explanation | Smaller In development badge; explicit preparing-for-closed-beta status and unavailable public tools | Retained as directed; final visual review |
| H1 | Canada's Construction Workforce & Jobsite Platform | Find Construction Jobs. Connect With Real Jobsites. | Retained as directed; closed-beta notice remains prominent |
| Hero supporting copy | Broad platform and national opportunities wording | Planned project-first platform; construction workers, GCs and SCs; expanded labourer-to-project-manager audience wording | Retained; Canada is target scope, not established coverage |
| Overview | Four capability cards | Three planned-audience cards under an H2, each marked unavailable | Retained for final full-page review |
| Feature cards | Workers, contractors, industry: three desktop columns | Workers and contractors only; future capability disclaimers; two balanced desktop columns, stacked on mobile | Requested balanced layout implemented; final visual review |
| Preview | Image, zoom modal and interface capability list | Entire section and modal removed; desktop/mobile WebPs absent; unused original PNG deleted too | Required image removal complete, no replacement imagery |
| Worker pricing | Always free | Always free; resume sharing instead of unsupported builder claim | Approved free policy retained |
| Contractor pricing | 30-day trial, $99 CAD per active jobsite/month, $999 founding offer | Free company profiles; trial begins first-jobsite hiring activation; $99 CAD per active jobsite/month for each company; independent GC/SC billing | Approved policy preserved; unresolved founding offer withheld |
| Pricing card | Founding offer | Per-company billing explanation in same styled card | Approved contractor pricing explanation preserved |
| Footer | Company, contact and Admin Login | Adds existing Privacy, Terms and Contact links | Closed-beta legal/contact exception retained |
| Rendering | Client-only visible content | Offline initial HTML; detached React startup and atomic replacement | Technical change approved; one connected H1 |

Unchanged: survey destination (the old explainer is now withheld), CTA labels, waitlist inputs and service behavior, approved company facts, mission/partnership/land acknowledgement sections, authenticated route implementations and map services. Public availability, customer counts, hiring outcomes and jobsite totals are not asserted. Unlimited postings/applications/hires remain approved proposed plan allowances, not proof of a tested operational service.

Removed unused code: PlatformPreview component, platformFeatures list, previewOpen state, preview-only useEffect/Escape handler/body scroll lock, modal markup and X icon import. No global CSS or other map/UI code was removed.

The complete focused source diff is MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff. Final test results and exact release manifest are in SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md. Headline/status, branding, CTAs and pricing are retained as directed. The two-column layout is implemented; release awaits final full-page visual approval.

## Final visual polish

The existing explainer was verified with third-party content permitted. Its 16:9 space now shows a black-and-gold fallback until a trusted player message arrives, with a viewport-aware timeout, direct link and retry. The same player URL and approved layout remain. Selected mobile supporting descriptions now use 16px/28px text; small acknowledgement/footer text has stronger contrast. Current screenshots and measured checks are in the final release report.

The external explainer contains r?sum?-creation wording and the unresolved founding offer. The current candidate withholds its iframe/link until a corrected asset is reviewed; prohibited r?sum?-building functionality will not be developed.

## Permanent r?sum? policy correction

Founder decision: no r?sum? builder is offered or will be developed. Existing r?sum? uploads/sharing remain. The iframe and external link are removed; the professional 16:9 panel is retained with an honest explainer-update notice. Previous player-readiness/failure details above are historical. Product context v1.1 and the build-time marketing gate enforce the corrected direction. See RESUME_BUILDER_CLAIM_REVIEW_2026-10-09.md for the search and exact changes.

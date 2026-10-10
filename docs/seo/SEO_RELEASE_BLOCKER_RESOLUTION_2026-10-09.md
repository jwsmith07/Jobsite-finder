# SEO release blocker resolution

> Historical blocker review. The final candidate now removes all preview assets and code. See [final release review](SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md) for the current manifest, visuals and approval decisions.

Date: 2026-10-09. Worktree: `.release-review/maintenance-seo`, production base `57d65d841ab08a1f6dac4641b3490aa790c8f67b`. **Technical blockers resolved locally. Founder-facing content/image approval remains. No commit, push or deployment.** All edits and new evidence for this mission are confined to this isolated candidate.

The installed `seo-audit` instructions and founder-approved `.agents/product-marketing.md` were used. The prior release review remains as historical evidence; this report describes the current implementation and supersedes its unresolved technical findings.

## Blocker status

| Blocker | Result |
| --- | --- |
| Loading flash/document-height collapse | Resolved: public snapshot remains connected until the guarded client destination has committed. Zero visible loading frames in the delayed, timeout, failure and auth-initialization scenarios. |
| Canonical hostname mismatch | Resolved: canonical, schema, Open Graph/social-image URLs, source/emitted sitemap and robots sitemap reference use `https://www.jobsitefinder.ca`. Existing apex-to-www redirect remains unchanged. |
| Shared maintenance page | Full comparison and policy corrections completed. Founder approval of headline/layout and image provenance/scope remains outstanding. Preview count/Upcoming filter concerns prevent unconditional release readiness. |

## Smallest compatible startup change

The former entry point cleared `#root` immediately. App then displayed its existing full-viewport loading state while checking maintenance and authentication. That discarded the prerendered content for up to the existing four-second timeout.

`marketingSnapshot.js` now prepares a detached client container only when initial HTML has the snapshot marker. React mounts the unchanged guarded SPA into that off-DOM container. App calls an idempotent handoff in a layout effect only after its maintenance/auth initialization finishes and no maintenance redirect is pending. At that point `replaceWith` swaps the ready container into the document before the next paint. There is never a second connected root or a second heading alongside the snapshot.

The before-paint handoff uses the documented timing of [React useLayoutEffect](https://react.dev/reference/react/useLayoutEffect). The browser regression verifies the actual connected DOM and geometry rather than assuming that hook timing alone prevents a flash.

All maintenance settings reads and redirects still run. Loading and redirect states may exist off-DOM while initialization proceeds, but cannot replace the public snapshot prematurely. Failed JS delivery leaves the readable public landing and disabled waitlist form intact. Plain dev entry HTML without the snapshot marker follows the original client-root behavior. No new framework, server-rendered authentication, global bypass, database write or runtime dependency was introduced. No hydration is attempted against a mismatching auth tree.

This change covers initial boot/handoff. It does not redesign later SPA navigation or remove existing loading states elsewhere in the application. Guarded client views remain responsible for authentication and roles; the public snapshot contains no private content.

## Before and after

The before measurements came from the prior isolated release review, with bundle delivery delayed by 700 ms so initial HTML could paint. Current tests use the same delivery delay, intercepted settings responses and blocked third-party requests.

| Scenario | Before visible loading gap | After |
| --- | --- | --- |
| Desktop, immediate settings | 40 ms | 0 observed loading frames |
| Desktop, 1500 ms settings delay | 1535 ms | 0 observed loading frames |
| Mobile, 1500 ms settings delay | 1532 ms | 0 observed loading frames |
| Homepage, 1500 ms settings delay | 1536 ms | 0 observed loading frames |
| Settings timeout | 4020 ms | 0 observed loading frames |
| Tablet delay, settings error, scroll position, expired-session delay/timeout and failed bundle | Not covered by original review | All current scenarios preserve the snapshot/geometry |

During every sampled frame after styles were ready, connected H1 count and root count stayed exactly one, document height stayed within one pixel of its initial value, and scroll position stayed within one pixel. Current heights: desktop 7139 px, tablet 8242 px, mobile 10362 px. The earlier mobile page was 10242 px; the current 120 px increase is the static height of longer approved-context copy, not a startup collapse. Original startup collapsed the document to 900 px.

Controlled Layout Instability observations are CLS 0. These local fixtures block external fonts/video/analytics; they are not a promise of production Core Web Vitals under every network, input or embed condition. Animation-frame/DOM assertions directly verify the previously missed content removal.

Screenshots and full samples: `.release-review/blocker-resolution/*-initial.png`, `*-initializing.png`, `*-final.png` and `startup-results.json` inside this candidate. Evidence is excluded from the release commit.

## Canonical hostname and verification

Read-only production checks on 2026-10-09:

- Apex `/under-construction` returns HTTP 308 to `https://www.jobsitefinder.ca/under-construction`.
- Following redirects terminates at that www URL with HTTP 200, exactly one redirect, and no loop.
- Www homepage also returns HTTP 200. Www Open Graph image returns HTTP 200.
- Remote main remains the reviewed Bing verification commit. No hosting rewrite or redirect configuration was changed.

The primary SEO hostname is now www in `SITE_URL`, the HTML template, schema URLs, canonical/OG URLs, social images, source/emitted sitemaps and the robots sitemap declaration. The production build has no apex URL signal in its head. The existing Organization email/domain spelling and unrelated auth origin fallback are not canonical metadata and were preserved.

The emitted maintenance sitemap still has exactly one entry: `https://www.jobsitefinder.ca/under-construction`. The source seven-route sitemap remains the reviewed prebuild checker input; it is replaced by the maintenance-only output in dist. Emitted robots preserve private/auth/test exclusions and block unfinished public discovery/marketing paths. Legal/contact pages remain accessible but need not be in this conservative sitemap subset.

Bing key `ADE257E16E03BAE1931E14672A5AE938` appears exactly once in the initial and final head. Google Analytics `G-DKTKBS8JFY` is preserved. No Google site-verification credential was created; neither the reviewed production template nor this candidate contains such a meta tag. Existing DNS/file-based Search Console verification, if any, was not assessed.

## Copy/image review

See [focused maintenance comparison](MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md) and [complete production-to-candidate diff](MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff).

This mission made the status explicitly “preparing a closed beta,” changed worker capability copy to future tense, spelled out free company profiles and first-jobsite hiring-tool activation as the trial trigger, and made $99 CAD monthly billing explicitly company-specific. The public $999 founding offer and resume-builder claim remain removed. No jobs, customers, outcomes or coverage claims were invented.

The inline concept notice now covers names, counts, filters and markers; the fullscreen image keeps a visible concept label. All three source images were inspected. The WebPs are cropped/resized versions of the existing production PNG and were not altered during this mission. They still show project names, “1690 Jobsites,” an Upcoming filter and national cluster counts. Their provenance cannot be certified from repository evidence alone. Concept labels reduce implied availability but do not establish authorized data or align an Upcoming filter with active-only MVP policy.

**Remaining approval:** headline/hero copy and card-layout choices; and a decision to remove/withhold imagery or supply documented provenance plus an approved sanitized asset without misleading counts/scope. Do not release as an unconditional “all blockers solved” change while that decision remains open.

## Exact files modified during this mission

All paths are relative to the isolated candidate; pre-existing staged changes remain separate from this incremental list.

| Path | Mission change |
| --- | --- |
| `src/main.jsx` | Prepare detached root instead of clearing snapshot. |
| `src/lib/marketingSnapshot.js` | New idempotent prepare/swap helper. |
| `src/app/App.jsx` | Reveal after existing initialization/maintenance redirect conditions resolve; guard decisions unchanged. |
| `src/lib/seo.js` | Www primary SEO base URL. |
| `index.html` | Www template canonical/social URLs; verification scripts unchanged. |
| `public/robots.txt` | Www sitemap declaration. |
| `public/sitemap.xml` | Www source entries. |
| `src/pages/public/UnderConstructionPage.jsx` | Approved-context beta/trial/free-profile/company-price wording; stronger inline/fullscreen concept labels. |
| `package.json` | Add `test:seo-startup`, without dependency changes. |
| `tests/seo-rendering/verify.mjs` | Host/schema/robots/verification and approved-copy assertions. |
| `tests/seo-rendering/startup-and-auth.mjs` | New frame/geometry/scroll, delayed/timeout/failure, maintenance and mock-auth regression tests. |
| `docs/seo/MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md` | Focused copy/layout/image comparison and approval decisions. |
| `docs/seo/MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff` | Complete page diff against production base. |
| `docs/seo/SEO_RELEASE_BLOCKER_RESOLUTION_2026-10-09.md` | Current results and readiness assessment. |
| `docs/seo/MAINTENANCE_RENDERING_IMPLEMENTATION_2026-10-09.md` | Historical-report banner linking current findings. |
| `docs/seo/MAINTENANCE_SEO_RELEASE_REVIEW_2026-10-09.md` | Historical-report banner linking current findings. |

No preview image pixels/files or lockfile were changed in this mission. No changes to the main workspace or to unrelated candidate auth, signup, router, map, dashboard, service, database/RLS or migration files. The final draft manifest/diff includes the earlier SEO dependency set plus this mission; it is not limited to the incremental files above.

## Complete validation

| Check | Result |
| --- | --- |
| Production-mode build (`npm run build`) | PASS, including offline prebuild checker and postbuild prerender. Placeholder backend configuration; no production env file copied. |
| Typecheck (`npm run typecheck`) | PASS. |
| SEO rendering (`npm run test:seo-rendering`) | PASS: raw/direct-route/fallback HTML, one H1, schema, canonical/description/robots/verification, no invented Google credential, JS off/on at 360/768/1440, preview interaction and allowed/denied maintenance routes. |
| Startup/auth (`npm run test:seo-startup`) | PASS: 11 startup scenarios, seven anonymous private/maintenance routes, sign-in error/success fixtures, rejection of admin metadata without a DB role, and private auth rejection with maintenance disabled. |
| Loading/content integrity | PASS: one connected root/H1, no visible loading, no height collapse or scroll jump throughout sampled delayed/timeout/failure initialization. |
| Public canonical redirect and image | PASS: 308 apex → www; final 200, one hop; social image 200. |
| Lockfile/dependencies | PASS: package dependencies/devDependencies match lock root; no new packages installed. |
| Scope/protected source | PASS: original production router, useAuth, auth client, ProtectedRoute/RoleRedirect, sign-in/signup, maps/dashboards, maintenance settings and waitlist services unchanged. |

The startup suite uses synthetic browser fixtures at `https://seo-review.invalid`; no real user credentials or authentication requests leave the browser. Profile fixtures are read-only and role-less; no signup, role assignment, waitlist or project writes are attempted. Other remote traffic is aborted. A delayed expired-session refresh can hold the SDK's settings request queue until the existing timeout; the fresh-browser fallback still resolves to maintenance. This is tested without changing service timeout/fallback behavior.

Test development caught and corrected two fixture assumptions: requiring a dispatched settings GET when auth refresh holds the SDK queue, and seeding localStorage in blocked external/about:blank iframe contexts. No production application errors were suppressed to make the suite pass. Final runs report no page JavaScript/hydration errors or unexpected private-data requests.

Residual build warning: the existing JS bundle remains large (about 2.20 MB / 588 KB gzip). This mission does not include unrelated code splitting. The retained snapshot makes content available during loading but does not claim to reduce download time.

## Final recommendation and release gates

The rendering and hostname fixes are locally ready. **Hold release until the shared maintenance-page design/copy and preview-image decisions are approved.** Prefer withholding the unverified image until an approved sanitized version is available.

After that decision, update only the isolated candidate as approved, rerun checks if content/assets change, reconfirm the remote base and explicit file manifest, and obtain separate approval before any commit/push/deployment. Ensure hosting builds with `npm run build` into `dist`, not bare `vite build`; the local placeholder bundle is test evidence, not the production deployment artifact. Use existing production environment configuration for the approved release build.

Post-deployment smoke checks must examine raw and rendered www maintenance/homepage HTML, one H1 without a loading flash, canonical/schema/sitemap host consistency, Bing verification, robots and anonymous private/unfinished-route restrictions. No database migration is required; rollback uses the previous hosting deployment if smoke checks fail.

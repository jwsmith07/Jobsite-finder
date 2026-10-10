# Maintenance SEO production release review

> Historical report. The isolated candidate has since resolved the loading flash and aligned SEO URLs with www. See [current blocker-resolution report](SEO_RELEASE_BLOCKER_RESOLUTION_2026-10-09.md) and [maintenance-page comparison](MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md). Founder copy/layout and image decisions remain pending; nothing has been committed, pushed or deployed.


Review date: 2026-10-09. **Not ready to release as-is. No commit, push or deployment performed.** This review supersedes the earlier implementation report's deployment-readiness wording.

The installed `seo-audit` skill and founder-approved product marketing context were used. The implementation was not redone. The candidate was assembled from existing SEO work in a separate worktree, then checked independently against the production branch.

## Isolated candidate

- Location: `.release-review/maintenance-seo` under the main workspace.
- Base: `origin/main`, `57d65d841ab08a1f6dac4641b3490aa790c8f67b` (Bing verification). A read-only `git ls-remote` confirmed this is still remote main during review.
- Detached worktree; no new commit or branch was created. Candidate files are prepared for review only. Do not release until the blockers below are resolved and the final scope is approved.
- Existing local commits `58d041a` and `b37f6bc` were not merged or cherry-picked wholesale. Only the public legal/contact exception from the latter was extracted into production App.
- The primary workspace implementation and all unrelated work remain intact. No stashing, resetting, cleaning or moving of user work was performed.

## Exact candidate file list

These are the draft release paths, relative to the isolated worktree. Shared content is still pending scope approval; staging is not approval.

| Path | Why it is included |
| --- | --- |
| `index.html` | SEO head template, canonical and social metadata needed by the renderer; existing Bing key and Google analytics retained. |
| `package.json` | Postbuild renderer and SEO test command; existing local Playwright dev dependency declared. |
| `package-lock.json` | Matching Playwright lock entries; only 64 added lines compared with remote main. Required for reproducible `npm ci`. |
| `scripts/prerender-marketing.mjs` | Existing offline maintenance renderer and emitted closed-beta SEO artifacts. |
| `scripts/generate-sitemap.mjs` | Earlier offline sitemap checker. Production's original prebuild queried projects/companies; retaining it would defeat the no-backend-read build boundary. |
| `public/sitemap.xml` | Reviewed source sitemap required by that checker; overridden by the maintenance-only sitemap in dist. |
| `public/robots.txt` | Earlier private/auth/test crawl exclusions; renderer adds unfinished-public-page exclusions to dist. |
| `src/lib/seo.js` | Maintenance metadata, schema and sitemap helper dependencies of the existing renderer and page. Includes earlier SEO metadata changes, not page implementations. |
| `src/components/ui/PageMeta.jsx` | Earlier client head/schema upserts, local/private noindex and safe social-image metadata. |
| `src/main.jsx` | Existing explicit snapshot-clear/client startup change. Loading-flash blocker applies here. |
| `src/pages/public/UnderConstructionPage.jsx` | Existing maintenance snapshot source, deferred waitlist import and static form behavior. Shared content/design scope requires review; see blocker 3. |
| `public/assets/platform-preview-mockup.webp` | Required by the selected existing maintenance component; not present in remote main. |
| `public/assets/platform-preview-mockup-mobile.webp` | Required responsive preview image; not present in remote main. |
| `src/app/App.jsx` | Only a three-line diff: allow `/privacy`, `/terms`, `/contact` during maintenance, plus explanatory comment. No Google-linking, callback, password-recovery or messaging changes. |
| `vite.config.ts` | Existing local dev/preview `X-Robots-Tag: noindex, nofollow` safeguards only. No production server headers changed. |
| `tests/seo-rendering/verify.mjs` | Existing built-artifact and browser regression checks. |
| `docs/seo/MAINTENANCE_RENDERING_IMPLEMENTATION_2026-10-09.md` | Existing implementation explanation; readiness qualified by this review. |
| `docs/seo/MAINTENANCE_SEO_RELEASE_REVIEW_2026-10-09.md` | Release findings and procedure. |

Already present in the base and reused without source changes: React/ReactDOM, React Router, Vite, React plugin, Tailwind, Lucide, Logo, global CSS, waitlist service, maintenance settings service, protected routes, auth client, hosting rewrites and existing logo/favicon/Open Graph assets. No new runtime package is needed. Playwright is a test-only dependency; no packages or browsers were installed for this review. The worktree reused existing node_modules through a local junction, which is not part of the release.

## Excluded work

The isolated worktree retains production versions of the following; their workspace changes are not included:

- Homepage and public application: `src/pages/public/HomePage.jsx`, `HomePage.css`, `FAQPage.jsx`, `JobsitesPage.jsx`, `ProjectDetailPage.jsx`; homepage Edmonton hero assets and project placeholder asset.
- Maps/projects: every changed `src/components/map/*`, map pin/tile/location helpers, project cards/image helpers, `useProjects`, projects/contractor workspace services and map-reliability tests.
- Authentication/registration: `src/app/router.jsx`, ProtectedRoute, RoleRedirect, `src/lib/supabase.js`, Google auth/linking/callback helpers, GoogleLinkPage, SignInPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage, onboarding hooks/pages and registration tests.
- Dashboards/account/admin: GC/SC/worker dashboard and profile changes, account settings, navigation/header, messaging and admin service changes.
- Database: all migrations, Supabase test configurations, schemas, actors, fixtures, project-access evidence and local backend artifacts.
- Other documentation: architecture/database/business reports and the broader SEO V2 strategy plan, which are not runtime dependencies of this release.
- Tool artifacts: browser profiles, `.playwright-mcp`, local screenshots, review probe script, generated dist, node_modules, environment files and all nested `.release-review` evidence.

The full pre-selection source status is preserved in `.release-review/evidence/source-workspace-status.txt`; the explicit machine-readable candidate list is `.release-review/evidence/candidate-files.json`. Do not use `git add .`, merge local main, or copy the entire working tree to release.

## Checks and findings

### Build and regression checks

The isolated candidate passed `npm run build`, `npm run typecheck` and `npm run test:seo-rendering`. The build uses dummy `https://seo-review.invalid` settings and a noncredential placeholder key for browser tests; no production env file was copied. The test intercepts maintenance/map-provider settings and blocks all other external traffic. No live project data, authentication requests, registrations, submissions or paid services were used.

The initial HTML and final React DOM each contain exactly one H1. Schema, canonical, title, description, verification tags, responsive layout, preview interaction, anonymous closed-beta redirects and legal/contact/signin exceptions pass. The existing large-bundle warning remains (isolated JS approximately 2.20 MB / 587 KB gzip).

These are functional tests, not proof that the transition is visually acceptable. Fresh-browser anonymous maintenance behavior was tested. The auth client, protected routes, settings service, router, database/RLS and dashboards remain production versions; this review does not claim a new logged-in or live-database security audit.

### Blocker 1 — significant loading flash

A separate local browser probe delayed module delivery by 700 ms so the static content could paint, then measured the actual replacement with controlled settings delays. All remote requests were intercepted. The isolated candidate results were:

| Scenario | Loading screen duration |
| --- | --- |
| Desktop, immediate settings response | 40 ms |
| Desktop, settings response delayed 1500 ms | 1535 ms |
| Mobile 360 px, same delay | 1532 ms |
| Homepage `/`, same delay | 1536 ms |
| Desktop, settings timeout | 4020 ms |

The content goes from the full maintenance landing to an empty root, then the full-viewport “Loading Jobsite Finder...” screen, then back to the landing. Document height collapses from 7139 to 900 px on desktop and 10242 to 900 px on mobile during that interval. This is a significant visible flash and geometry collapse under ordinary delayed-network conditions. It fails the request to verify that there is no significant loading flash.

The Layout Instability observer reported CLS 0 in these controlled fresh-page runs. That metric does not certify the transition: full subtree removal/replacement was clearly visible and captured by animation-frame sampling and screenshots. No claim is made that real-user CLS will be zero with production fonts, embeds, scroll position or input.

Evidence for the original working-tree build: `.release-review/evidence/loading-review.json` and adjacent screenshots. Evidence for the isolated candidate: `.release-review/maintenance-seo/.release-review/evidence/loading-review.json` and adjacent screenshots. The existing regression test does not assert preservation of content during loading; a release fix needs such an assertion. No rendering/startup changes were made during this review.

Before release, separately authorize a targeted startup fix that keeps the approved public snapshot visible until the guarded client view is ready, or a narrowly scoped matching hydration strategy. Preserve all auth/maintenance decisions and ensure no duplicate H1 or simultaneous static/client content. Do not suppress maintenance checks globally.

### Blocker 2 — canonical hostname mismatch

Read-only production checks at approximately 22:57 UTC:

- `https://jobsitefinder.ca/` returns HTTP 308 to `https://www.jobsitefinder.ca/`.
- `https://www.jobsitefinder.ca/under-construction` returns HTTP 200, serving the existing empty-root SPA shell.
- Candidate canonical and Open Graph URL are `https://jobsitefinder.ca/under-construction`; candidate schema, sitemap and robots sitemap declaration also use apex.

Candidate SEO signals agree with each other but their hostname does not agree with production redirect behavior. For a minimal release, use the already served `www` hostname consistently in SEO output; alternatively approve an apex-primary hosting redirect change. Neither change was made during this review. Do not mix hosts or advertise a canonical URL that redirects.

Live production robots still advertise unfinished public paths and the live sitemap lists 13 URLs. Candidate dist fixes the closed-beta scope with one canonical maintenance URL and public discovery exclusions, but hostname consistency must be corrected before release. The seven-URL source sitemap is only a prebuild checker fixture; the release artifact is the one-URL `dist/sitemap.xml` produced by the postbuild hook.

### Blocker 3 — shared maintenance-page release scope

The six-file implementation delta is not self-contained against production. The local maintenance component had earlier copy, layout and preview-image changes before prerendering was added. Relative to remote main it now has a 227-line diff, including a changed H1, planned-feature copy, removal of synthetic preview-project generation, responsive preview imagery and legal links. Those dependencies were included in this draft so it builds independently; this is not a silent authorization of every earlier design change.

Review and approve the complete maintenance-page diff and two preview images, or authorize extraction of only the necessary rendering/content-safety changes onto the original production design. The original production H1 is “Canada's Construction Workforce & Jobsite Platform”; the draft's H1 is “Find Construction Jobs. Connect With Real Jobsites.” The unfinished public `HomePage` implementation is excluded in either case. No whole-file App/auth copy or unrelated local commit is part of this candidate.

### Verification and closed-beta policy

- Bing verification key is exactly `ADE257E16E03BAE1931E14672A5AE938`, appears once in initial head, and remains after React startup. Do not remove it after verification.
- Live and candidate HTML contain Google Analytics `G-DKTKBS8JFY`. Neither has a `google-site-verification` meta tag. Analytics is not a Google verification meta tag. Existing DNS/file-based Search Console verification, if any, is outside the evidence available here; no new tag was guessed or removed.
- Emitted sitemap contains only maintenance; emitted robots keep private/auth/test exclusions and disallow unfinished jobsites/projects/companies/pricing/FAQ/resources. Runtime guard tests prevent anonymous access to those application pages. Robots are crawl policy, not access control.
- No private/test project records are used for prerendering. The existing preview image is explicitly labeled illustrative; no synthetic project objects are generated by the selected component.
- The production maintenance flag is not changed. It is mocked as enabled in local tests. Snapshot/SEO output assumes maintenance and must be rebuilt under an approved public-launch policy before maintenance is disabled.
- Existing client fallback behavior remains unchanged: fresh-browser failure defaults to maintenance; this is not a substitute for database RLS or an authorization guarantee.

## Procedure after blockers are resolved and release is approved

1. Resolve loading behavior, select the canonical host, and approve the shared maintenance-page scope. Update the isolated candidate only with that approved scope; retain source workspace work separately.
2. Reconfirm remote main still matches the reviewed base. If it moved, rebase the candidate onto it and review the resulting diff; do not merge the unreviewed local branch.
3. Validate the explicit candidate file manifest and lockfile. Run `npm ci` in a clean environment with Node compatible with the locked Vite version (20.19+ or 22.12+); use the existing approved production environment configuration for the actual production build. No new environment variables, database migrations or paid services are required.
4. Run `npm run build`, `npm run typecheck`, SEO browser checks and the new slow-settings visual-transition regression. The deployment command must be `npm run build`, not bare `vite build`, so npm runs the offline prebuild and postbuild hooks. Verify dist head/body, final canonical's HTTP 200 response, one-URL maintenance sitemap and robots exclusions.
5. Only after explicit release approval, create a release branch from the isolated base and commit the approved explicit files. Proposed message: `Prerender maintenance landing and align closed-beta SEO output`. Do not include dist, env files, browser artifacts, synthetic data or unrelated source changes.
6. Push only the approved release branch and review its diff/PR. Before pushing, confirm whether Vercel automatically deploys branch previews and whether that action is included in the user's deployment approval. Do not update production main until production deployment is approved.
7. Deploy through the existing Vercel workflow with `npm run build` and output `dist`. Confirm the configured build command in the hosting project, since it cannot be verified from repository rewrites alone. Do not publish the placeholder local build.
8. After deployment, check both hostnames, raw homepage and maintenance HTML without JavaScript, final rendered H1, absence of a loading flash under a slow settings response, Bing tag, existing Google verification mechanism, canonical/schema/social URLs, sitemap/robots, and anonymous redirects for private and unfinished routes. Do not submit forms or expose project data during smoke tests.
9. Resubmit the final sitemap in Bing/Search Console as appropriate and rerun Bing's site scan. Retain verification tags. If smoke checks fail, roll back the Vercel deployment to the previously verified release; no database rollback is needed for this SEO-only change.

The candidate is prepared for review, not approved for release. Approval to commit/push/deploy remains pending, and a direct deployment of the current candidate is not recommended.

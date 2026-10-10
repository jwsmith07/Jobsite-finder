# Jobsite Finder - final maintenance SEO release candidate

Date: 2026-10-09. Latest mission: restore the original explainer video. Isolated worktree: .release-review/maintenance-seo. Production base and unchanged HEAD: 57d65d841ab08a1f6dac4641b3490aa790c8f67b. No commit, push or deployment performed.

**All required local checks pass. The original Scrimba explainer is restored unchanged with the tested black-and-gold loading/failure fallback and retry controls. Release awaits final approval.**

## Latest approved card-label edit

Removed the repeated "Planned - not available yet" label from all three overview cards. The shared closed-beta notice and section-level availability qualification remain. Build and rendering regression validation cover this revision; the startup metrics and screenshot dimensions below describe the preceding full validation.

## Current founder decisions

- Keep the original video at https://scrimba.com/explain/guide0o93ighc7, including its existing narration and slides, embed and direct link.
- This is a narrowly approved existing-video exception, documented in product-marketing context v1.2. Jobsite Finder does not offer a resume builder and will not develop one. That exclusion remains in force for website copy and future development; no new marketing assets gain an exemption.
- Approved headline, closed-beta status, black-and-gold branding, worker/contractor CTAs, two balanced desktop feature cards and mobile readability improvements remain.
- Worker participation and company profiles remain free. Contractor price remains $99 CAD per active jobsite per month for each company; the applicable 30-day trial starts at first-jobsite hiring activation. Website copy does not advertise the unresolved founding offer. The original video is retained under the founder's specific approval.
- Keep all prerendering, www canonical, Bing verification, sitemap/robots and closed-beta security improvements. Unverified platform preview assets remain removed.

The previous withholding decision in RESUME_BUILDER_CLAIM_REVIEW_2026-10-09.md is historical and superseded for this approved video only. No external video was rewritten or replaced.

## Restored player and fallback

The restored ExplainerEmbed component retains the same URL, responsive 16:9 area and 800px maximum width. Initial HTML includes meaningful page content and a black-and-gold fallback with the direct Open explainer link. The iframe remains hidden and excluded from keyboard focus until a scrimba:embed-watching message arrives from https://scrimba.com and this iframe's contentWindow. An iframe load event alone is not treated as success.

A 10-second timeout starts when the area enters the viewport; failure removes the iframe while preserving the same area and offers Retry. Retry remounts the original player. Timer, observer and listener are cleaned up. Autoplay/fullscreen permission is restored explicitly. No blank or white failure rectangle is exposed.

The readiness message is observed provider behavior rather than a documented stable API. A provider change may leave the fallback visible; the direct link remains available. No new dependency, framework, authentication flow or paid service.

## Current screenshots and evidence

| View | Third-party playback permitted | Third-party content blocked |
| --- | --- | --- |
| Desktop full page, 1440px | [Playback](../../.release-review/final-release/visuals/candidate-desktop-full-page-permitted.png) | [Fallback](../../.release-review/final-release/visuals/candidate-desktop-full-page.png) |
| Mobile full page, 360px | [Playback](../../.release-review/final-release/visuals/candidate-mobile-full-page-permitted.png) | [Fallback](../../.release-review/final-release/visuals/candidate-mobile-full-page.png) |
| Desktop player detail | [Playback](../../.release-review/final-release/visuals/candidate-desktop-explainer-permitted.png) | [Fallback](../../.release-review/final-release/visuals/candidate-desktop-explainer-fallback.png) |
| Mobile player detail | [Playback](../../.release-review/final-release/visuals/candidate-mobile-explainer-permitted.png) | [Fallback](../../.release-review/final-release/visuals/candidate-mobile-explainer-fallback.png) |

Actual Chromium captures of the local final build. Live permitted checks fetch existing public player resources read-only; private backend traffic and writes remain blocked. Tests use local fixtures; no real accounts or submissions. Main-page external fonts and analytics remain blocked for controlled review. Capture scripts, screenshots, metrics and generated build output are local evidence, excluded from the release index.

## Required validation results

| Check | Result |
| --- | --- |
| npm run build, including policy/sitemap prebuild and offline prerender | PASS |
| npm run typecheck | PASS |
| npm run test:marketing | PASS: 198 source/public files, 205 source/built files |
| Approved embed/direct-link marketing case | PASS, without exemptions for any source file or arbitrary video host |
| Negative policy check in this same component | PASS: temporarily replacing supporting copy with a prohibited creation claim fails the gate; original source restored |
| npm run test:seo-rendering | PASS at 360/768/1440px with JS on/off; restored iframe and direct link, one H1, metadata/schema/verification and guards |
| Player readiness, empty response, wrong origin/source, timeout, retry | PASS; fallback height unchanged |
| npm run test:seo-startup | PASS: all 11 normal/delayed/failure/timeout/session/bundle/scroll scenarios |
| Visible startup gap / height collapse / controlled CLS | 0ms visible gap; stable height; CLS 0 in all 11 cases |
| Stable document heights | Desktop 6539px; tablet 7330px; mobile 9596px |
| Closed-beta and auth regression checks | PASS: existing legal/contact/signin access; private guards; mock signin; forged role metadata cannot grant admin; auth required when maintenance disabled |
| Real original explainer | PASS: desktop and 360px mobile readiness/playback permitted |
| Local supporting-copy contrast/readability | PASS: selected descriptions/pricing notice/footer at least 11.99:1; mobile body copy 16px with 28px spacing; no horizontal overflow |
| Scope, whitespace and release manifest | PASS: isolated candidate only, exact 27 paths, no unrelated source changes |

The existing bundle-size warning remains outside this release. Controlled CLS/contrast measurements do not certify field Core Web Vitals, all site screens or third-party video UI.

## SEO and security

- Initial and post-startup HTML have exactly one H1; the static landing remains connected until the guarded React replacement is ready. No hydration against a mismatching auth tree and no duplicated visible roots.
- Canonical, Open Graph and Organization/WebSite URLs consistently use https://www.jobsitefinder.ca. The existing apex-to-www redirect is unchanged; earlier read-only production review confirmed 308 then 200 in one hop.
- Exactly one Bing msvalidate.01 tag in head before body, key ADE257E16E03BAE1931E14672A5AE938. Existing GA4 G-DKTKBS8JFY is retained. No Google verification credential invented.
- Emitted sitemap contains only the www maintenance URL; emitted robots references the www sitemap and disallows unfinished/private routes. Deploy the complete npm run build output, not public/ or a bare Vite build.
- No private/test project records are prerendered. No changes to auth hooks, dashboard, registration, maps, RLS, resume-upload implementation or application handling. Robots remains crawler guidance; existing guarded routing/backend authorization remain intact.

## Files changed in this restoration mission

1. .agents/product-marketing.md - v1.2, exact original-video exception while retaining permanent exclusion.
2. src/pages/public/UnderConstructionPage.jsx - restore embed, original URL/direct link, fallback, timeout, readiness checks and retry.
3. scripts/check-marketing-claims.mjs - explicit approved-embed case; prohibition unchanged.
4. tests/seo-rendering/verify.mjs - restored embed/link assertions and readiness/failure/spoof/retry tests.
5. docs/seo/MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff - refreshed focused production diff.
6. docs/seo/MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md - current video approval status.
7. docs/seo/RESUME_BUILDER_CLAIM_REVIEW_2026-10-09.md - mark the old withholding decision superseded by the specific founder approval.
8. docs/seo/SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md - this current report and final manifest.

## Exact final release manifest

Twenty code/config/test/asset/policy paths and seven review documents. A = new, M = modified, D = deleted relative to production 57d65d8. The two withdrawn WebPs are absent and are not release files.

~~~text
M .agents/product-marketing.md
M index.html
M package-lock.json
M package.json
D public/assets/platform-preview-mockup.png
M public/robots.txt
M public/sitemap.xml
A scripts/check-marketing-claims.mjs
M scripts/generate-sitemap.mjs
A scripts/prebuild.mjs
A scripts/prerender-marketing.mjs
M src/app/App.jsx
M src/components/ui/PageMeta.jsx
A src/lib/marketingSnapshot.js
M src/lib/seo.js
M src/main.jsx
M src/pages/public/UnderConstructionPage.jsx
A tests/seo-rendering/startup-and-auth.mjs
A tests/seo-rendering/verify.mjs
M vite.config.ts
A docs/seo/MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff
A docs/seo/MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md
A docs/seo/MAINTENANCE_RENDERING_IMPLEMENTATION_2026-10-09.md
A docs/seo/MAINTENANCE_SEO_RELEASE_REVIEW_2026-10-09.md
A docs/seo/SEO_RELEASE_BLOCKER_RESOLUTION_2026-10-09.md
A docs/seo/SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md
A docs/seo/RESUME_BUILDER_CLAIM_REVIEW_2026-10-09.md
~~~

Required dependency addition remains @playwright/test and its lockfile entries, for development/test only. No new runtime dependency. Existing historical reports are retained for review; this report governs the current candidate. No node_modules junction, dist artifacts, local evidence, environment files or secrets enter the index.

## Procedure after final approval

1. Confirm production has not advanced and review the exact staged diff against 57d65d8; keep unrelated main-workspace work out.
2. Create the isolated release commit only after authorization. Push/deploy only within the approved release scope.
3. Use the existing production environment and npm run build so the marketing gate, sitemap check and maintenance prerender/postprocessing execute.
4. After deployment verify apex-to-www termination, raw homepage/direct maintenance HTML, one H1 before/after JS, verification/schema, restricted sitemap/robots, maintenance/signin guards and original video/fallback behavior. Then request a new Bing scan.

**Recommendation: locally ready for final release approval. Nothing committed, pushed or deployed.**

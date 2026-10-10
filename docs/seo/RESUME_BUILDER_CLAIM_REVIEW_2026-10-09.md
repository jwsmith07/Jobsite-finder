# Résumé claims — permanent product-policy correction

> Historical cleanup review. Later founder approval restores the original existing video unchanged. The withholding/external-correction prerequisites below are superseded for that video only. Website copy and future development still exclude resume builders. Current status: [final release review](SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md).

Date: 2026-10-09. Isolated maintenance SEO candidate, production base `57d65d8`. No commit, push or deployment.

**Founder decision:** Jobsite Finder does not offer a résumé builder and will not develop one. This is a permanent scope exclusion, not an unimplemented future feature. Existing worker profiles, uploads of existing résumés and applications remain supported product direction, subject to beta availability.

## Search and findings

Repository text searches covered accented/unaccented résumé and CV variants, builder/maker/generator/creation wording, and verbs such as build, create, generate, write and design. Reviewed homepage, maintenance, FAQ, pricing, remaining public pages, SEO metadata/schema helpers, HTML entry, services, scripts, public text assets and documentation. Installed skill examples, historical audits, deleted lines in comparison diffs and technical signed-URL/storage references were distinguished from Jobsite Finder marketing claims. Binary image/video pixels cannot be certified by a text search; the previously unverified preview assets remain excluded.

| Area | Finding / disposition |
| --- | --- |
| Product-marketing context | “Create profiles and resumes” implied creation. Changed to worker profiles and uploads of existing résumés. Replaced the old “not found” caveat with the permanent exclusion; updated readiness treatment and changelog to v1.1 |
| Homepage | No prohibited creation/builder claim found; no page change needed |
| Maintenance page | Existing résumé-sharing copy already valid. The embedded external explainer contained the prohibited creation claim, so its iframe and external link are withheld pending correction. Existing black-and-gold 16:9 space now says the explainer is being updated; no false network-error explanation. Removed unused player listener/observer/timer/retry code, hooks and URL constant |
| FAQ | Profile creation and résumé uploads are valid; unchanged |
| Pricing | “Upload resume” and “Resume management” describe document handling; unchanged. Approved worker/contractor price/trial copy preserved |
| SEO metadata, schema and entry HTML | No builder claim found; canonical, verification, prerender and schema unchanged |
| Worker profile/application UI and services | Upload, attachment, signed-URL and résumé reference handling are legitimate functionality; all implementation files unchanged from production base |
| Email templates | No dedicated transactional/marketing email templates found in this candidate. Service email-address fields and waitlist messages contain no builder claim. Hosted provider templates and private campaigns were not accessible/audited |
| Documentation | Product context corrected. Current release/comparison docs updated. Historical “removed claim” findings and minus-lines in the production diff are retained as evidence, not promoted as product functionality |
| Public Google Forms survey | Read-only browser review: question 21 asks about résumé uploads and quick apply, not résumé creation. No builder wording found in rendered survey text; form unchanged |

## External correction required

Existing resource: `https://scrimba.com/explain/guide0o93ighc7` — Jobsite Finder explainer. Earlier permitted browser verification found worker-pricing text **“Always free to search, build a resume, and apply.”** The same asset also advertises the unresolved $999 first-year offer. Its résumé creation wording must be rewritten to uploading an existing résumé; the narration, slides/captions and transcript should all be checked. No externally hosted video was edited, deleted or replaced here. This candidate no longer embeds or links to it, preventing automatic exposure to the unsupported claim.

A corrected video may be restored in a separate approved mission after review. Retaining the prohibited claim is no longer an approval alternative under the permanent founder decision. Other private videos, emails or marketing assets require an inventory or access before they can be verified; no claim is made that external channels are comprehensively clean.

## Outside this isolated candidate

Read-only comparison of the main workspace found:

- `.agents/product-marketing.md` still has the old “create profiles and resumes” wording and “not found” caveat. Integrate this candidate's v1.1 correction before further marketing work.
- `docs/seo/JOBSITE_FINDER_SEO_V2_PLAN.md` lines 53 and 196 treat résumé-building as unsupported/conditional on evidence. Change that guidance to a permanent exclusion, preserving the valid upload alternative. This plan is outside the isolated candidate and was not copied into the release.
- The main workspace's maintenance copy already uses résumé sharing; public-page text searches found no additional builder claims. Its unrelated dirty source changes remain excluded.

The deployed production page will continue showing its current assets until an approved release; no production state changed in this mission.

## Regression gate

`scripts/check-marketing-claims.mjs` normalizes accents, whitespace and common accented HTML entities, rejects builder/maker/generator and creation/action variants in application/public/marketing content, and permits supported profile/upload/attachment wording. Internal historical audits and the negative policy document are outside the promotional scan. Future content/email/template directories are included when present.

`scripts/prebuild.mjs` runs this gate followed by the existing offline sitemap check before Vite. `npm run test:marketing` additionally scans emitted HTML and JavaScript. No dependency or runtime service added. This is a text-policy guard, not OCR or an external-media scanner; embedded assets still need editorial review.

## Validation

- PASS: build, including policy gate, sitemap precheck and offline prerender; typecheck.
- PASS: marketing check of 198 source/public files and 205 source/built files. Negative/positive detector cases include accent variants, CV generation, indirect profile-and-résumé creation, valid uploads and signed-URL identifiers.
- PASS: a temporary public fixture containing a prohibited claim caused a nonzero policy-gate exit; fixture removed before completion.
- PASS: SEO rendering at 360/768/1440px with/without JavaScript, one H1, www canonical/schema, Bing key, restricted sitemap/robots and no link/iframe to the noncompliant video.
- PASS: all 11 startup cases retain stable height, no visible loading gap and CLS 0 under controlled conditions; existing maintenance/auth guards remain intact.
- PASS: protected résumé/profile/application implementation paths have no diff against `57d65d8`. No database/RLS/auth/map/upload changes or real submissions performed.
- PASS: refreshed desktop/mobile full-page captures show the withheld-video notice in the existing dimensions. Existing large-bundle warning remains outside scope.

## Exact files changed in this mission

1. `.agents/product-marketing.md`
2. `package.json`
3. `scripts/check-marketing-claims.mjs` — new
4. `scripts/prebuild.mjs` — new
5. `src/pages/public/UnderConstructionPage.jsx`
6. `tests/seo-rendering/verify.mjs`
7. `docs/seo/MAINTENANCE_PAGE_PRODUCTION_COMPARISON.diff`
8. `docs/seo/MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md`
9. `docs/seo/SEO_FINAL_RELEASE_CANDIDATE_2026-10-09.md`
10. `docs/seo/RESUME_BUILDER_CLAIM_REVIEW_2026-10-09.md` — this report

Local capture scripts/screenshots and startup evidence are excluded from the release index. Full release manifest is maintained in the final release review (27 paths total after this mission). Release remains subject to approval.

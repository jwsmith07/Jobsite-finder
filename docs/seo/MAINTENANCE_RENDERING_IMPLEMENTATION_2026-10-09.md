# Maintenance landing rendering — local implementation

> Historical report. The isolated candidate has since resolved the loading flash and aligned SEO URLs with www. See [current blocker-resolution report](SEO_RELEASE_BLOCKER_RESOLUTION_2026-10-09.md) and [maintenance-page comparison](MAINTENANCE_PAGE_RELEASE_COMPARISON_2026-10-09.md). Founder copy/layout and image decisions remain pending; nothing has been committed, pushed or deployed.


Status: Implemented and tested locally. Not pushed or deployed. Approval required before release.

## Approach

The existing React/Vite SPA and maintenance/authentication guards remain intact. An offline npm postbuild step renders the existing `UnderConstructionPage` component using React's static renderer and Vite's JSX module loader. It does not render the application router or load environment files, services, hooks, backend clients or private data. A module boundary fails the build if those modules are introduced into the rendering dependency tree.

The generated `dist/index.html` SPA fallback and `dist/under-construction/index.html` contain the same public marketing snapshot, including the existing visible H1, descriptive content, images, links, and disabled waitlist submit button. There are no project queries, credentials, submissions or database writes during prerendering.

The static tree is explicitly cleared before the existing client root starts. The complete app initially renders an asynchronous auth/maintenance loading state, which does not match the standalone landing component. Hydrating that tree would require changes to app startup and auth state. This implementation uses deliberate replacement, not hydration, and does not introduce an SSR server or framework migration. React then activates the existing form and preview handlers through the normal routes.

React documents that client rendering replaces initial markup, while hydration requires a matching initial tree: [React createRoot](https://react.dev/reference/react-dom/client/createRoot). Vite's module loader supplies JSX for the offline render: [Vite SSR API](https://vite.dev/guide/ssr.html).

## Changed source files for this mission

| File | Change |
| --- | --- |
| `package.json` | Adds the offline postbuild step and `test:seo-rendering` script. |
| `scripts/prerender-marketing.mjs` | Explicit approved-component registry, offline rendering boundary, head updates, route output, closed-beta sitemap and robots artifacts. |
| `src/main.jsx` | Explicitly clears the marketing snapshot before starting the existing client app. |
| `src/pages/public/UnderConstructionPage.jsx` | Defers the existing waitlist service import until submission; disables static submission; corrects two claims conflicting with approved context. |
| `tests/seo-rendering/verify.mjs` | Tests built HTML and browser startup with all external traffic intercepted. |
| `docs/seo/MAINTENANCE_RENDERING_IMPLEMENTATION_2026-10-09.md` | Implementation evidence, risks and release requirements. |

The landing page already contained the desired H1: “Find Construction Jobs. Connect With Real Jobsites.” Its markup and responsive styles are reused. The unapproved $999 founding offer is replaced with the approved per-company hiring policy in the same card; “Build and share a resume” becomes “Share trade experience and a resume.” The approved `.agents/product-marketing.md` and installed `.agents/skills/seo-audit/SKILL.md` informed these decisions.

No changes were made by this mission to authentication, RLS, dashboards, maps, protected routes, service logic, `index.html`, hosting rewrites, source `public/robots.txt`, source `public/sitemap.xml`, or the existing sitemap checker. The workspace already contained extensive changes before this mission; they must be reviewed separately before release.

## HTML and indexing policy

- Initial and rendered canonical: `https://jobsitefinder.ca/under-construction`, preserving the existing canonical host policy.
- Title: `Jobsite Finder in Development | Launch Updates`; description comes from existing maintenance metadata. Open Graph and Twitter title, description and URL agree.
- Organization and WebSite JSON-LD are present initially under the existing `jf-jsonld` ID and updated in place by PageMeta. No JobPosting schema or project records are generated.
- Bing key `ADE257E16E03BAE1931E14672A5AE938` remains in the head exactly once. Existing Google analytics scripts and any template verification tags are preserved. The current template contains Google Analytics, but no Google site-verification meta tag; none was invented.
- The emitted sitemap lists only the canonical maintenance landing page. Legal/contact pages stay available but are intentionally omitted from this conservative sitemap subset.
- Emitted robots retain existing private/auth/test restrictions and additionally disallow unfinished about/pricing/FAQ/discovery/project/company/resource paths. The maintenance landing remains crawlable under the existing production indexing policy. Robots rules do not replace security controls.
- Dev source files remain unchanged and locally noindex; maintenance-aware SEO output is produced by `npm run build`. A plain `vite build` skips npm's postbuild hook and must not be the release command.

## Validation results

`npm.cmd run build`: PASS, including the existing reviewed-source sitemap check and offline prerender step. Existing large JavaScript chunk warning remains (approximately 2.27 MB before compression); no new build failure.

`npm.cmd run typecheck`: PASS.

`npm.cmd run test:seo-rendering`: PASS.

The regression test verifies:

- Exactly one H1 in raw built HTML and after React startup; a DOM observer detects no duplicate H1 during startup or preview interaction.
- Identical direct-route and fallback HTML artifacts.
- Visible content, title, description, canonical, one schema script and preservation of verification/analytics tags.
- JavaScript disabled and enabled at 360, 768 and 1440 pixels; no horizontal overflow; static waitlist submission disabled and client submission button enabled.
- Preview dialog opens and Escape closes it without leaving extra headings.
- Anonymous `/`, `/jobsites`, `/pricing`, `/faq`, a synthetic nonexistent project path, `/gc/dashboard` and `/signup` still redirect to maintenance.
- `/signin`, `/privacy`, `/terms` and `/contact` retain their existing allowed behavior.
- No page JavaScript errors or hydration error messages. No auth/project/private-data requests. Settings responses are browser fixtures; all other external requests, including analytics, fonts and video, are blocked. No live services or paid services were used.

This does not claim a new exhaustive logged-in dashboard/map/security audit. Their code and startup guards were preserved; focused anonymous route tests cover the rendering change's interaction with closed beta.

## Risks and deployment readiness

Locally ready for review, not deployed. Approve and isolate this mission's changes from the pre-existing workspace work before any push.

1. Replacement can briefly show the existing app loading state between the static snapshot and interactive page. True hydration is a separate startup design task; it is not required to deliver crawler-readable HTML here.
2. The snapshot and emitted SEO artifacts intentionally assume closed beta. Changing the database maintenance flag alone does not update raw HTML or the sitemap. Approving a public launch requires updating the registry, canonical fallback, metadata, crawl policy and route tests, then rebuilding.
3. The existing catch-all hosting rewrite serves public maintenance HTML as the initial shell on other SPA paths. Runtime guards still govern those paths; no private content is rendered at build time. Route-specific static marketing output should be checked against hosting rewrite behavior when future pages are approved.
4. Apex-to-www production redirect and existing apex canonicals were not changed. Production headers, indexing and the final deployed response require a smoke check after a separately approved deployment.
5. Existing assets contain a clearly labeled illustrative interface image. No real, test or private project records are exported by this implementation.

To extend later, register only approved, data-independent marketing components and their metadata. The generator supports explicit per-route HTML output and derives its sitemap from that registry. Each addition also requires reviewing the closed-beta robots restrictions and hosting route serving. Never auto-discover project pages or prerender the protected application.

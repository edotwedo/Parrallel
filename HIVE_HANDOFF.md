# PARALLEL — HIVE HANDOFF / EXECUTION PLAN
Updated: 2026-11-16
Repository: https://github.com/edotwedo/Parrallel
Owner: edotwedo
Mission: "Don't escape it. Build alongside it."
Priority: ship a functioning, privacy-conscious neighborhood mutual-aid bulletin board on existing GitHub + Cloudflare infrastructure, with NO new paid subscriptions or Lovable dependency.

## Non-negotiable operating instructions
- This is an execution handoff to the Hive. Work in the existing repo; inspect actual code and Cloudflare configuration before changing anything. Assign owners and coordinate changes through branches/PRs. Do not assume a deployment is functional just because CI says success.
- Do not use Lovable or request credits. Cloudflare and GitHub are preferred. Stay within free-tier limits where feasible; report any expected costs before enabling services.
- Never commit API keys, tokens, secrets, private contact data or precise home addresses. Use Cloudflare Worker secrets and least-privilege credentials.
- Do not claim public posting works until a second browser/device can create a post and a different visitor can see an approved post.
- Maintain a visible distinction between sample/demo posts and actual community posts. Don't present fake activity as real.
- Preserve the core principle: the platform serves the community, not the reverse.

## What exists (verified during prior session)
- GitHub repo edotwedo/Parrallel exists; at inspection it was PUBLIC. Owner can rename to Parallel later, but avoid breaking Cloudflare integration without planning.
- index.html: standalone responsive prototype, category filters, search, sample posts, post form. The form currently saves to localStorage ONLY. It is NOT a multi-user bulletin board.
- schema.sql: proposed Cloudflare D1 posts and reports schema, NOT applied.
- worker-api.js: proposed API with /api/health, /api/posts, /api/admin/pending and /api/admin/review. It is NOT wired into deployment. Treat it as a starting point requiring security review.
- README.md: status and next steps.
- User screenshot showed a successful Cloudflare deployment from edotwedo/Parrallel, branch main, with no build command and deploy command `npx wrangler deploy`. This is a Workers deployment, not proof the public URL serves the intended site.
- The Cloudflare public workers.dev/pages.dev URL has NOT been verified in this session.
- A separate Lovable prototype was previously generated but is explicitly abandoned. Do not rely on it.

## Phase 0 — Verify current production (highest priority)
1. Inspect repo, commits, Cloudflare Worker settings, routes, Wrangler config, assets configuration, deployed script and logs.
2. Find actual public URL and HTTP-check root page, static assets, browser console and mobile viewport. Confirm that the latest GitHub commit is deployed.
3. If Cloudflare deployment is misconfigured (e.g. no Wrangler config or missing assets binding), fix it in-repo and redeploy. Prefer Cloudflare Workers static assets, or Pages if the current integration is easier to maintain. Avoid unnecessary migration.
4. Record exact public URL and current state in README. Provide shareable link ONLY after checking response and visual rendering.
5. If posting is not yet ready, display a conspicuous 'preview / coming soon' notice; do not invite visitors to submit data that is not shared.

## Phase 1 — Shared bulletin board MVP
Core categories: I Have, I Need, I Can Teach, Let's Build.
- Cloudflare D1 schema/migrations for posts, statuses, moderation, reports; add migration discipline rather than blindly applying SQL to production.
- Worker routes for public approved posts, submitting a post for moderation, viewing own submission state where appropriate, reporting posts and admin approval/rejection.
- Integrate frontend with actual API; replace localStorage submission; clear feedback for pending approval, network failures and empty states.
- Support text search and category filtering, approximate city/area only; don't expose exact address, GPS or contact details.
- Posts: title, description, category, approximate area, public nickname, created date, status. Validate lengths and content server-side.
- Design a simple way for members to connect, but don't publicly expose personal emails/phone numbers. Start with consent-based contact requests or an opt-in relay, not unrestricted direct contact.
- Add lightweight project-interest coordination once basic posting works.
- Seed examples as EXAMPLES ONLY or omit them in production.

## Phase 2 — Abuse resistance, privacy and moderation (before open public submissions)
- Critical: rate limiting per route/IP or privacy-conscious equivalent; bot protection such as Cloudflare Turnstile if appropriate; payload-size limits and validation; safe HTML rendering; content security policy.
- Admin authentication must be secure; do not put ADMIN_TOKEN into browser JS or public repo. The proposed Bearer token admin endpoint is suitable only for a trusted server-side/operator workflow, NOT direct browser exposure.
- Moderation queue with approve/reject; report handling; ability to remove posts quickly; basic block/spam controls.
- Consider account model: anonymous pending posts versus verified accounts. Choose smallest viable safe approach, explain tradeoffs. Avoid collecting unnecessary identity data.
- Publish plain-language privacy policy, community guidelines, terms/contact mechanism, retention/deletion process.
- Test abusive inputs, script injection, flooding, privacy leakage, permission bypass, and accidental publication of pending posts.

## Phase 3 — Deployment and observability
- GitHub main -> Cloudflare automatic deployment with environment configuration documented.
- Use Wrangler configuration committed to repo (without secrets), D1 binding, migration scripts and documented rollback.
- Verify production routes /, /api/health, /api/posts and moderation flows. Set cache behavior deliberately.
- Add smoke tests and a basic automated test suite; run on PR. Test on Android/mobile and desktop.
- Add error logging without leaking personal data. Track meaningful outcomes (posts approved, projects started, matches made), not addictive engagement metrics.
- Keep operations within existing budget. Document resource usage and potential free-tier ceilings.

## Phase 4 — Community launch and iteration
- Start with Tacoma / Pierce County, but allow other locations as membership grows.
- Landing page optimized for TikTok bio traffic: clear purpose, simple invitation, browse without signup, easy first contribution.
- Consider invite-only or moderation-first pilot before open enrollment.
- Build real-world trust features progressively: completed exchanges, volunteer commitments, community projects, opt-in skills and needs.
- Avoid premature integration into Sanstatic or other ventures. Let usage and community needs determine organizational structure (POSIWID).
- Do not equate registered accounts or likes with impact. Measure completed cooperative actions.

## Recommended immediate Hive work allocation
- Infrastructure agent: inspect Cloudflare, fix public deployment, report URL and logs.
- Backend agent: D1 migrations and Worker endpoints, security constraints.
- Frontend agent: replace local-only flow with API and accurate states.
- Security/moderation agent: threat model, abuse prevention, safe admin workflow, privacy text.
- QA/release agent: independent end-to-end tests, verify cross-device posting and production URL.
Coordinate through PRs; merge only after review. Document blockers rather than asking owner to click through unrelated services.

## Definition of done for PUBLIC SHARE
- [ ] Public Cloudflare URL confirmed serving intended responsive homepage
- [ ] Clear demo/preview disclosure if public posting not yet operational
- [ ] No secret keys exposed
- [ ] If accepting posts: shared D1 persists across devices
- [ ] If accepting posts: unapproved posts never appear publicly
- [ ] If accepting posts: moderation, abuse controls and reporting tested
- [ ] Basic privacy guidance and no precise-address exposure
- [ ] Real Android/mobile browser smoke test
- [ ] README documents deployment, limitations, rollback and URL

## Status reporting back to owner
Return: URL, what works NOW, what is still demo-only, exact commits/PRs, test evidence, deployment status, blockers, next smallest action. Avoid requiring owner interaction unless credentials/permissions genuinely cannot be accessed by the Hive. Never request a token pasted into chat.

## First instruction to Hive
Inspect current repository and Cloudflare deployment; fix and verify a real public homepage URL. Then implement the D1-backed moderated bulletin board through reviewed PRs. Work autonomously using existing authorized tools, without new subscriptions.

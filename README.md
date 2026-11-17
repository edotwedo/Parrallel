# Parallel

An independent, privacy-conscious neighborhood bulletin board.

## Status
The root `index.html` is a static prototype. Sample posts are clearly labeled, and user-created posts stay in local browser storage. **It is not yet a shared public posting service.**

## Infrastructure
- Source: GitHub `edotwedo/Parrallel`
- Hosting: Cloudflare Workers (deployment confirmed by owner)
- Planned shared storage: Cloudflare D1, using `schema.sql`
- Planned backend: `worker-api.js` (not deployed)

## Launch safeguards
Do not invite public submissions until D1 is bound, the API is deployed, moderation is tested, and abuse controls (rate limiting, anti-spam, reporting) are operational. Never commit API tokens or secrets. Public posts must not contain street addresses or personal contact details.

## Next steps
1. Configure a Cloudflare D1 database and bind it as `DB`.
2. Apply `schema.sql`.
3. Integrate `worker-api.js` into the existing Worker deployment without breaking static asset serving.
4. Configure `ADMIN_TOKEN` as a Worker secret and build a secure moderation interface.
5. Add rate limiting, spam protection, and report handling.
6. Replace browser-only posting with the shared API, then verify production end to end.

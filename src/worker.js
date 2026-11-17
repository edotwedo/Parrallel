// Parallel: shared, moderated community bulletin board.
// Bindings: ASSETS (static site), DB (D1), NOTIFY (send_email). Secrets: REVIEW_SECRET, NOTIFY_FROM, NOTIFY_TO.
// Every post starts "pending" and is public only after the organizer approves it from the email link.

const CATEGORIES = ["I Have", "I Need", "I Can Teach", "Let's Build"];
const LIMITS = { category: 20, title: 100, description: 1000, location: 80, author: 50 };
const FIELDS = Object.keys(LIMITS);
const PER_HOUR = 3; // posts per visitor per hour
const PENDING_CAP = 200; // stop taking posts if this many await review (flood guard)

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const html = (body, status = 200) =>
  new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Parallel review</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:32px auto;padding:0 16px;color:#18342d">${body}</body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex", "referrer-policy": "no-referrer" } });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sameText(a, b) {
  if (typeof a !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
// Strip control characters; keep it plain text.
const clean = (v, max) => String(v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// Keep the "no private contact info" promise: refuse posts that carry emails, phone numbers or links.
const CONTACT = /[^\s@]+@[^\s@]+\.[a-z]{2,}|(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|https?:\/\/|www\./i;

async function createPost(request, env) {
  if (Number(request.headers.get("content-length") || 0) > 4096) return json({ error: "That post is too long." }, 413);
  const raw = await request.text();
  if (raw.length > 4096) return json({ error: "That post is too long." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Something went wrong. Try again." }, 400); }
  if (!body || typeof body !== "object") return json({ error: "Something went wrong. Try again." }, 400);
  if (body.website) return json({ ok: true, status: "pending" }, 202); // honeypot: bots fill hidden fields
  const post = {};
  for (const f of FIELDS) {
    if (typeof body[f] !== "string") return json({ error: `Please fill in ${f}.` }, 400);
    post[f] = clean(body[f], LIMITS[f]);
    if (!post[f]) return json({ error: `Please fill in ${f}.` }, 400);
  }
  if (!CATEGORIES.includes(post.category)) return json({ error: "Pick a category." }, 400);
  if (CONTACT.test(`${post.title} ${post.description} ${post.location} ${post.author}`))
    return json({ error: "Please leave out emails, phone numbers and links. Keep it to a city or area." }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = (await hmac(env.REVIEW_SECRET, `ip:${ip}`)).slice(0, 24);
  const recent = await env.DB.prepare("SELECT COUNT(*) n FROM posts WHERE ip_hash = ? AND created_at > datetime('now','-1 hour')").bind(ipHash).first("n");
  if (recent >= PER_HOUR) return json({ error: "You've posted a few times already. Try again in an hour." }, 429);
  const pending = await env.DB.prepare("SELECT COUNT(*) n FROM posts WHERE status = 'pending'").first("n");
  if (pending >= PENDING_CAP) return json({ error: "We're catching up on posts. Try again later." }, 503);

  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO posts (id,category,title,description,location,author,status,ip_hash) VALUES (?,?,?,?,?,?,'pending',?)")
    .bind(id, post.category, post.title, post.description, post.location, post.author, ipHash).run();

  // Tell the organizer. The post is saved even if the email fails; it still shows on the review page.
  try {
    const sig = await hmac(env.REVIEW_SECRET, `review:${id}`);
    const link = `${new URL(request.url).origin}/review?id=${id}&sig=${sig}`;
    await env.NOTIFY.send({
      from: env.NOTIFY_FROM, to: env.NOTIFY_TO,
      subject: `Parallel: new post to review (${post.category})`,
      text: `${post.category}: ${post.title}\n\n${post.description}\n\n${post.location} · ${post.author}\n\nApprove or reject: ${link}\n\nAll waiting posts: ${new URL(request.url).origin}/review?all=1&sig=${await hmac(env.REVIEW_SECRET, "review:all")}`,
    });
  } catch (e) { console.error("notify failed", e?.message); }
  return json({ ok: true, status: "pending" }, 202);
}

async function reviewPage(url, env) {
  const all = url.searchParams.get("all") === "1";
  const id = url.searchParams.get("id") || "";
  const sig = url.searchParams.get("sig") || "";
  const expected = await hmac(env.REVIEW_SECRET, all ? "review:all" : `review:${id}`);
  if (!sameText(sig, expected)) return html("<h1>Link not valid</h1>", 403);
  const rows = all
    ? (await env.DB.prepare("SELECT * FROM posts WHERE status='pending' ORDER BY created_at ASC LIMIT 50").all()).results
    : [await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first()].filter(Boolean);
  if (!rows.length) return html(all ? "<h1>Nothing waiting</h1><p>No posts need review.</p>" : "<h1>Post not found</h1>", all ? 200 : 404);
  const cards = await Promise.all(rows.map(async (p) => {
    const s = await hmac(env.REVIEW_SECRET, `review:${p.id}`);
    const buttons = p.status === "pending"
      ? `<form method="post" action="/review" style="display:flex;gap:8px"><input type="hidden" name="id" value="${esc(p.id)}"><input type="hidden" name="sig" value="${s}">
         <button name="action" value="approved" style="padding:10px 18px;background:#1f6b4f;color:#fff;border:0;border-radius:8px;font-size:16px">Approve (make public)</button>
         <button name="action" value="rejected" style="padding:10px 18px;background:#eee;border:0;border-radius:8px;font-size:16px">Reject</button></form>`
      : `<p><strong>Already ${esc(p.status)}.</strong></p>`;
    return `<div style="border:1px solid #ccd;border-radius:10px;padding:14px;margin:14px 0"><small>${esc(p.category)} · ${esc(p.created_at)} UTC</small><h2 style="margin:4px 0">${esc(p.title)}</h2><p>${esc(p.description)}</p><p>📍 ${esc(p.location)} · ${esc(p.author)}</p>${buttons}</div>`;
  }));
  return html(`<h1>Review ${all ? "waiting posts" : "post"}</h1>${cards.join("")}`);
}

async function reviewAction(request, env) {
  const form = await request.formData();
  const id = String(form.get("id") || "");
  const action = String(form.get("action") || "");
  if (!sameText(String(form.get("sig") || ""), await hmac(env.REVIEW_SECRET, `review:${id}`))) return html("<h1>Link not valid</h1>", 403);
  if (!["approved", "rejected"].includes(action)) return html("<h1>Pick approve or reject</h1>", 400);
  const r = await env.DB.prepare("UPDATE posts SET status = ?, reviewed_at = datetime('now') WHERE id = ? AND status = 'pending'").bind(action, id).run();
  const done = r.meta.changes > 0;
  return html(`<h1>${done ? (action === "approved" ? "Approved: it's on the board now" : "Rejected") : "Already reviewed"}</h1><p><a href="/">Open the board</a></p>`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;
    try {
      if (url.pathname.startsWith("/api/") || url.pathname === "/review") {
        if (!env.DB || !env.REVIEW_SECRET) return json({ error: "The board isn't set up yet." }, 503);
        if (route === "GET /api/health") return json({ ok: true });
        if (route === "GET /api/posts") {
          const { results } = await env.DB.prepare("SELECT id,category,title,description,location,author,created_at FROM posts WHERE status='approved' ORDER BY created_at DESC LIMIT 200").all();
          return json({ posts: results });
        }
        if (route === "POST /api/posts") return await createPost(request, env);
        if (route === "GET /review") return await reviewPage(url, env);
        if (route === "POST /review") return await reviewAction(request, env);
        return json({ error: "Not found" }, 404);
      }
    } catch (e) {
      console.error(e?.stack || e);
      return json({ error: "Something went wrong. Try again in a minute." }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};

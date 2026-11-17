-- Parallel D1 schema. Apply with: npx wrangler d1 execute parallel-db --remote --file=./schema.sql
CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY,
 category TEXT NOT NULL CHECK(category IN ('I Have','I Need','I Can Teach',"Let's Build")),
 title TEXT NOT NULL,
 description TEXT NOT NULL,
 location TEXT NOT NULL,
 author TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status,created_at DESC);
CREATE TABLE IF NOT EXISTS reports (
 id TEXT PRIMARY KEY,
 post_id TEXT NOT NULL REFERENCES posts(id),
 reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Parallel D1 schema. Apply with: npx wrangler d1 execute parallel-db --remote --file=./schema.sql
CREATE TABLE IF NOT EXISTS posts (
 id TEXT PRIMARY KEY,
 category TEXT NOT NULL CHECK(category IN ('I Have','I Need','I Can Teach','Let''s Build')),
 title TEXT NOT NULL,
 description TEXT NOT NULL,
 location TEXT NOT NULL,
 author TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 ip_hash TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_ip_created ON posts(ip_hash,created_at);

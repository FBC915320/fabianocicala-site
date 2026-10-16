-- D1 order records: no EPUB binaries in D1, store them privately in R2.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  claim_hash TEXT NOT NULL,
  client_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  preference_id TEXT,
  checkout_url TEXT,
  payment_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  access_expires_at INTEGER NOT NULL,
  download_count INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_idx ON orders(payment_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS orders_email_hash_idx ON orders(email_hash);

-- Chaves derivadas de IP com sal secreto; nenhuma informação bruta de IP é salva.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON rate_limits(reset_at);

-- Feature 6: Index to support search on description (ILIKE / text search)
-- Btree helps equality and prefix; for large datasets consider pg_trgm for partial match.

CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions(description)
  WHERE description IS NOT NULL AND description != '';

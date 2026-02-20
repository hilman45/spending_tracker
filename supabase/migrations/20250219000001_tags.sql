-- Feature 5: Tag system (user-defined tags, many-to-many with transactions)
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags(tag_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Tags: user CRUD on own rows
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- transaction_tags: user can manage only if they own both transaction and tag
CREATE POLICY "Users can view own transaction_tags"
  ON transaction_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_tags.transaction_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transaction_tags"
  ON transaction_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_tags.transaction_id AND t.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM tags g WHERE g.id = transaction_tags.tag_id AND g.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own transaction_tags"
  ON transaction_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_tags.transaction_id AND t.user_id = auth.uid()
    )
  );

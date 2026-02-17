-- Feature 2: Recurring expense detection (pattern storage; detection runs in-app)
-- Run in Supabase SQL Editor or via: supabase db push

-- Pattern table so transactions.recurring_pattern_id has a valid FK.
-- Rows are created only when user confirms recurring (no auto-save of detection).
CREATE TABLE recurring_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  normalized_description TEXT,
  amount_center DECIMAL(12, 2),
  interval_type TEXT NOT NULL CHECK (interval_type IN ('weekly', 'monthly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_patterns_user_id ON recurring_patterns(user_id);

ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring_patterns"
  ON recurring_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_patterns"
  ON recurring_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_patterns"
  ON recurring_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_patterns"
  ON recurring_patterns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add recurring columns to transactions (user-confirmable; detection is in-memory only).
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_pattern_id UUID NULL REFERENCES recurring_patterns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring_pattern_id ON transactions(recurring_pattern_id);

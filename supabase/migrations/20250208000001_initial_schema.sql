-- Spending Tracker - Initial Schema
-- Run this in Supabase SQL Editor or via: supabase db push

-- Categories for rule-based categorization (V1)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default categories with keywords (from FEATURES.md)
INSERT INTO categories (name, keywords) VALUES
  ('Transport', ARRAY['Grab', 'Uber', 'Gojek', 'taxi', 'fuel', 'petrol']),
  ('Subscriptions', ARRAY['Netflix', 'Spotify', 'YouTube', 'subscription']),
  ('Shopping', ARRAY['Shopee', 'Lazada', 'Amazon', 'mall']),
  ('Food & Dining', ARRAY['restaurant', 'food', 'grab food', 'delivery']),
  ('Utilities', ARRAY['electric', 'water', 'internet', 'phone']),
  ('Other', ARRAY[]::TEXT[]);

-- Files uploaded by users (stored in Supabase Storage)
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions extracted from files
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MYR',
  description TEXT,
  suggested_category TEXT,
  confirmed_category TEXT NOT NULL,
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_file_id ON transactions(file_id);

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Categories: readable by all authenticated users
CREATE POLICY "Categories are viewable by authenticated users"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Files: users can only access their own
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Transactions: users can only access their own
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

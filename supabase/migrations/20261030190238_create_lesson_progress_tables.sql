/*
# Create lesson progress and user preferences tables

1. New Tables
- `lesson_progress`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to the authenticated user — owner of the row)
  - `lesson_id` (text, not null — references lesson JSON id, not a DB FK since lessons live in files)
  - `status` (text, not null, default 'not_started' — one of: not_started, in_progress, completed)
  - `score_percent` (integer, nullable — 0-100, set on completion)
  - `best_score_percent` (integer, nullable — highest score across attempts)
  - `questions_total` (integer, nullable — total questions in the attempt)
  - `questions_correct` (integer, nullable — correct answers in the attempt)
  - `completed_at` (timestamptz, nullable — when the lesson was last completed)
  - `updated_at` (timestamptz, default now)
  - `created_at` (timestamptz, default now)
  - Unique constraint on (user_id, lesson_id) so each user has one progress row per lesson

- `user_preferences`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, unique — one preferences row per user)
  - `interface_locale` (text, not null, default 'en' — learner interface language)
  - `updated_at` (timestamptz, default now)
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- Grant CRUD to `authenticated` only (the app requires sign-in).
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- `user_id` columns default to `auth.uid()` so client inserts that omit `user_id` succeed.
- No `anon` policies — the app requires sign-in to read/write progress.

3. Important Notes
- `lesson_id` is a text reference to lesson JSON ids, not a foreign key — lessons are file-based.
- `status` is constrained by a CHECK constraint to valid values.
- `best_score_percent` tracks the highest score across all attempts for gamification.
- `updated_at` is automatically updated via a trigger.
*/

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score_percent integer CHECK (score_percent >= 0 AND score_percent <= 100),
  best_score_percent integer CHECK (best_score_percent >= 0 AND best_score_percent <= 100),
  questions_total integer,
  questions_correct integer,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON lesson_progress TO authenticated;

DROP POLICY IF EXISTS "select_own_progress" ON lesson_progress;
CREATE POLICY "select_own_progress" ON lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON lesson_progress;
CREATE POLICY "insert_own_progress" ON lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON lesson_progress;
CREATE POLICY "update_own_progress" ON lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON lesson_progress;
CREATE POLICY "delete_own_progress" ON lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  interface_locale text NOT NULL DEFAULT 'en',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;

DROP POLICY IF EXISTS "select_own_preferences" ON user_preferences;
CREATE POLICY "select_own_preferences" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_preferences" ON user_preferences;
CREATE POLICY "insert_own_preferences" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_preferences" ON user_preferences;
CREATE POLICY "update_own_preferences" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_preferences" ON user_preferences;
CREATE POLICY "delete_own_preferences" ON user_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
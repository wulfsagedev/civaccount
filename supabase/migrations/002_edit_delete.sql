-- Town Hall UX: edit + delete support
-- Run this against your Supabase project via SQL Editor

-- 1. Add edited_at to proposals (null = never edited)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 2. Add edited_at to comments (null = never edited)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 3. Allow 'deleted' and 'removed' statuses
-- proposals: 'deleted' for soft-deleted proposals
-- comments: 'removed' for author-deleted comments (placeholder shown)

-- Note: If your status column uses a CHECK constraint, update it:
-- ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
-- ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
--   CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'flagged', 'deleted'));

-- 4. RLS: authors can update their own proposals
CREATE POLICY "Authors can update own proposals"
  ON proposals FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 5. RLS: authors can update their own comments
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 6. Update comments select policy to include 'removed' status
-- so deleted comments still appear as "[Removed by author]" placeholders
-- DROP POLICY IF EXISTS "Comments are visible" ON comments;
-- CREATE POLICY "Comments are visible"
--   ON comments FOR SELECT
--   USING (status IN ('visible', 'removed'));

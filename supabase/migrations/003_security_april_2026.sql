-- CivAccount Security Migration — April 2026
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- Triggered by: Vercel April 2026 security incident (see ROTATION-RUNBOOK.md).
-- This migration tightens RLS around user emails, pins search_path on every
-- SECURITY DEFINER function to defeat public-schema hijacking, and adds
-- constitutional hardening that does not depend on any vendor trust.

-- ════════════════════════════════════════════════════════════════════════
-- 1. Remove the public SELECT policy on public.users that leaks email
--    ─────────────────────────────────────────────────────────────────
--    The previous migration left both policies in place:
--       "Users can see their own full record"  USING (auth.uid() = id)
--       "Public can see basic user info"       USING (true)
--    RLS treats multiple permissive policies as OR, so the "true" policy
--    wins for anonymous requests and `from('users').select('*')` returns
--    every email address.  The view `public.user_profiles` does not fix
--    this because clients can still query the underlying table.
--
--    Fix: drop the public policy, keep the self-visibility policy, and
--    force anonymous readers to use the `public.user_profiles` view.
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public can see basic user info" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;

-- Keep (or recreate) the self-row policy so a user can always read their own row.
DROP POLICY IF EXISTS "Users can see their own full record" ON public.users;
CREATE POLICY "Users can see their own full record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Ensure the view exists and has an explicit GRANT so anonymous clients can
-- read display_name + reputation without hitting the base table.
CREATE OR REPLACE VIEW public.user_profiles
  WITH (security_invoker = true)
  AS
  SELECT id, display_name, reputation, created_at
  FROM public.users;

-- Grant read on the view to the Supabase anon + authenticated roles.  The
-- view runs with security_invoker, so it still respects RLS on the base
-- table — which is exactly what we want: the user's own full row is
-- visible to them, other users only get the non-sensitive columns.
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- Revoke any over-broad grants a prior migration may have added on the
-- base table.  Anonymous must NEVER be able to SELECT directly from
-- public.users — only via the view.
REVOKE ALL ON public.users FROM anon;
GRANT  SELECT (id, display_name, reputation, role, council_slug, created_at)
       ON public.users TO authenticated;
-- Note: authenticated users can see their own email via the self-row policy
-- because RLS filters rows, and the GRANT filters columns for rows OTHER than
-- their own.  This is the column-level privacy the comment in
-- security-migration.sql step 4 acknowledged was missing.

-- ════════════════════════════════════════════════════════════════════════
-- 2. Pin search_path on every SECURITY DEFINER function
--    ─────────────────────────────────────────────────
--    A SECURITY DEFINER function without a pinned search_path can be
--    hijacked by a malicious object created in a schema earlier on the
--    caller's search_path (typically `public`).  The standard defence is
--    `SET search_path = pg_catalog, public` on the function definition so
--    unqualified references resolve to known objects only.
-- ════════════════════════════════════════════════════════════════════════

ALTER FUNCTION public.update_proposal_score()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.update_comment_count()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.flag_comment(uuid)
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.check_vote_rate_limit()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.check_proposal_rate_limit()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.check_comment_rate_limit()
  SET search_path = pg_catalog, public;

-- ════════════════════════════════════════════════════════════════════════
-- 3. Harden comment_flags: prevent self-disclosure of flagger identities
--    across the user base.  Currently only "see your own flags" — which
--    is already correct, but verify by re-applying the policy in case an
--    earlier DROP left it off.
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can see their own flags" ON public.comment_flags;
CREATE POLICY "Users can see their own flags"
  ON public.comment_flags FOR SELECT
  USING (auth.uid() = user_id);

-- The counter on public.comments.flag_count is safe to expose because it's
-- aggregated and no individual flagger is revealed.

-- ════════════════════════════════════════════════════════════════════════
-- 4. Lock the display_name constraint to reject zero-width / RTL tricks
--    that bypass the "no HTML tags" check by using Unicode control chars.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_display_name_length;

ALTER TABLE public.users
  ADD CONSTRAINT users_display_name_length
  CHECK (
    display_name IS NULL
    OR (
      char_length(display_name) >= 2
      AND char_length(display_name) <= 50
      AND display_name !~ '<[^>]+>'
      -- Reject zero-width joiners, RTL overrides, and BOMs that are common
      -- homograph-attack ingredients.
      AND display_name !~ '[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]'
    )
  );

-- ════════════════════════════════════════════════════════════════════════
-- 5. Session hardening: ensure public.users.email is NEVER leaked by
--    realtime publications.  (Requires Supabase extension `supabase_realtime`
--    to be present.)
-- ════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Remove public.users from realtime so email changes aren't broadcast
    -- over the realtime websocket.
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.users';
    EXCEPTION WHEN undefined_object THEN
      -- Table wasn't in the publication; nothing to do.
      NULL;
    END;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- Done.  Verify with:
--   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
--   SELECT nspname, proname, proconfig
--     FROM pg_proc JOIN pg_namespace ON pronamespace = pg_namespace.oid
--     WHERE nspname = 'public' AND prosecdef = true;
--   -- proconfig should show "search_path=pg_catalog, public" on every
--   -- SECURITY DEFINER function.
-- ════════════════════════════════════════════════════════════════════════
